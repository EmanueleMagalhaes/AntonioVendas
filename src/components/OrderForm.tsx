import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Save, Share2, FileText, CheckCircle, Search, User, Package, Building2, Truck, CreditCard, Loader2 } from 'lucide-react';
import { Client, Product, OrderItem, Order } from '../types';
import { saveOrder } from '../services/storageService';
import { generateOrderPDF, shareViaWhatsApp } from '../services/pdfService';

interface OrderFormProps {
  clients: Client[];
  products: Product[];
  onOrderSaved: () => void;
}

const SIZES = ['33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'];

const OrderForm: React.FC<OrderFormProps> = ({ clients, products, onOrderSaved }) => {
  // State
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientList, setShowClientList] = useState(false);

  const [cart, setCart] = useState<OrderItem[]>([]);
  
  // Item Entry State
  const [refInput, setRefInput] = useState('');
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [sizeQuantities, setSizeQuantities] = useState<Record<string, number>>({});
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);

  // Payment & Shipping State
  const [freight, setFreight] = useState('FOB');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  // Feedback State
  const [isSaving, setIsSaving] = useState(false);
  const [savedOrder, setSavedOrder] = useState<Order | null>(null);

  // -- Client Search Logic --
  const filteredClients = clients.filter(c => {
    const term = clientSearch.toLowerCase();
    return c.name.toLowerCase().includes(term) || 
           (c.companyName && c.companyName.toLowerCase().includes(term));
  });

  // -- Product Search Logic --
  useEffect(() => {
    if (refInput.length > 1) {
      const exactMatch = products.find(p => p.reference.toLowerCase() === refInput.toLowerCase());
      if (exactMatch) {
        setActiveProduct(exactMatch);
      } else {
        // Only reset active product if it doesn't match anymore
         if (activeProduct && activeProduct.reference.toLowerCase() !== refInput.toLowerCase()) {
            setActiveProduct(null);
            setSizeQuantities({});
         }
      }
      setShowProductSuggestions(true);
    } else {
      setShowProductSuggestions(false);
      if(!refInput) {
        setActiveProduct(null);
        setSizeQuantities({});
      }
    }
  }, [refInput, products]);

  const filteredProducts = products.filter(p => 
    p.reference.toLowerCase().includes(refInput.toLowerCase())
  ).slice(0, 5);

  // -- Size Input Logic --
  const handleSizeChange = (size: string, val: string) => {
    const qty = parseInt(val) || 0;
    setSizeQuantities(prev => ({
      ...prev,
      [size]: qty
    }));
  };

  const currentTotalQty = useMemo(() => {
    return Object.values(sizeQuantities).reduce((a: number, b: number) => a + b, 0);
  }, [sizeQuantities]);

  const currentTotalPrice = useMemo(() => {
    return activeProduct ? currentTotalQty * activeProduct.price : 0;
  }, [currentTotalQty, activeProduct]);


  // -- Cart Logic --
  const addItem = () => {
    if (!activeProduct) return;
    if (currentTotalQty <= 0) {
      alert("Insira a quantidade em pelo menos uma numeração.");
      return;
    }

    const newItem: OrderItem = {
      productId: activeProduct.id,
      reference: activeProduct.reference,
      description: activeProduct.description,
      quantity: currentTotalQty,
      unitPrice: activeProduct.price,
      total: currentTotalPrice,
      sizes: { ...sizeQuantities },
      color: activeProduct.color,
      sole: activeProduct.sole || '',
      material: activeProduct.material || ''
    };

    setCart([...cart, newItem]);
    // Reset inputs
    setRefInput('');
    setActiveProduct(null);
    setSizeQuantities({});
    setShowProductSuggestions(false);
  };

  const removeItem = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const totalOrderValue = cart.reduce((acc, item) => acc + item.total, 0) || 0;

  // -- Finalize Order --
  const handleSaveOrder = async () => {
    if (!selectedClient || cart.length === 0) return;

    setIsSaving(true);
    try {
      const order = await saveOrder({
        clientId: selectedClient.id,
        clientName: selectedClient.companyName || selectedClient.name,
        items: cart,
        totalValue: totalOrderValue,
        status: 'pending',
        freight,
        paymentTerms,
        paymentMethod
      });

      setSavedOrder(order);
      onOrderSaved();
    } catch (error) {
      console.error("Error saving order", error);
      alert("Erro ao salvar o pedido.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewOrder = () => {
    setSavedOrder(null);
    setCart([]);
    setSelectedClient(null);
    setClientSearch('');
    setFreight('FOB');
    setPaymentTerms('');
    setPaymentMethod('');
  };

  if (savedOrder && selectedClient) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center animate-fade-in">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
          <CheckCircle className="text-green-500 w-20 h-20 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Sucesso!</h2>
          <p className="text-slate-600 mb-6">O pedido #{savedOrder.id.toUpperCase()} foi salvo corretamente.</p>
          
          <div className="space-y-3">
            <button 
              onClick={() => generateOrderPDF(savedOrder, selectedClient).save(`Pedido_${savedOrder.id}.pdf`)}
              className="w-full py-3 bg-slate-800 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-slate-900"
            >
              <FileText size={20} /> Baixar PDF
            </button>
            <button 
              onClick={() => shareViaWhatsApp(savedOrder, selectedClient)}
              className="w-full py-3 bg-green-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-green-700"
            >
              <Share2 size={20} /> Enviar no WhatsApp
            </button>
            <button 
              onClick={handleNewOrder}
              className="w-full py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 mt-4"
            >
              Criar Novo Pedido
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-8 grid grid-cols-1 xl:grid-cols-4 gap-8">
      
      {/* Left Column: Inputs */}
      <div className="xl:col-span-3 space-y-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Novo Pedido</h2>

        {/* Step 1: Select Client */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative z-20">
          <div className="flex items-center gap-2 mb-4 text-slate-800 font-semibold">
            <User className="text-indigo-600" size={20} />
            <h3>1. Dados do Cliente</h3>
          </div>
          
          {selectedClient ? (
            <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-lg border border-indigo-100">
              <div>
                <p className="font-bold text-indigo-900 flex items-center gap-2">
                  <Building2 size={18} />
                  {selectedClient.companyName || selectedClient.name}
                </p>
                <div className="text-sm text-indigo-600 mt-1">
                   <span className="font-medium">Resp:</span> {selectedClient.name} • {selectedClient.city}
                </div>
                <div className="text-xs text-indigo-500 mt-0.5">
                   Tel: {selectedClient.phone}
                </div>
              </div>
              <button onClick={() => setSelectedClient(null)} className="text-sm text-indigo-500 underline hover:text-indigo-700">Trocar</button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="Buscar por empresa ou responsável..."
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-200 outline-none"
                value={clientSearch}
                onChange={(e) => { setClientSearch(e.target.value); setShowClientList(true); }}
                onFocus={() => setShowClientList(true)}
              />
              {showClientList && clientSearch && (
                <ul className="absolute z-30 w-full bg-white border mt-1 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredClients.map(c => (
                    <li 
                      key={c.id} 
                      className="p-3 hover:bg-slate-50 cursor-pointer border-b last:border-0"
                      onClick={() => { setSelectedClient(c); setShowClientList(false); setClientSearch(''); }}
                    >
                      <div className="font-medium flex flex-col">
                        <span>{c.companyName || c.name}</span>
                        {c.companyName && <span className="text-xs font-normal text-slate-500">Resp: {c.name}</span>}
                      </div>
                      <div className="text-xs text-slate-500">{c.city}</div>
                    </li>
                  ))}
                  {filteredClients.length === 0 && <li className="p-3 text-slate-500 text-sm">Nenhum cliente encontrado.</li>}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Add Products */}
        <div className={`bg-white p-6 rounded-xl shadow-sm border border-slate-200 transition-opacity ${!selectedClient ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex items-center gap-2 mb-6 text-slate-800 font-semibold">
            <Package className="text-indigo-600" size={20} />
            <h3>2. Adicionar Produtos</h3>
          </div>
          
          {/* Reference Input */}
          <div className="mb-6 relative z-10">
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Referência do Produto</label>
            <input 
                type="text"
                className="w-full md:w-1/2 border p-3 rounded-lg uppercase focus:ring-2 focus:ring-indigo-200 outline-none font-bold text-lg tracking-wide"
                placeholder="DIGITE A REF..."
                value={refInput}
                onChange={(e) => setRefInput(e.target.value.toUpperCase())}
              />
              
              {/* Autocomplete Dropdown */}
              {showProductSuggestions && filteredProducts.length > 0 && (
                <div className="absolute z-20 w-full md:w-1/2 bg-white border mt-1 rounded-lg shadow-xl">
                  {filteredProducts.map(p => (
                    <div 
                      key={p.id}
                      className="p-3 hover:bg-indigo-50 cursor-pointer border-b last:border-0"
                      onClick={() => { setActiveProduct(p); setRefInput(p.reference); setShowProductSuggestions(false); }}
                    >
                      <div className="font-bold text-indigo-700">{p.reference}</div>
                      <div className="text-sm text-slate-600">{p.description}</div>
                    </div>
                  ))}
                </div>
              )}
          </div>

          {/* Product Details & Grid - Only show if product is found */}
          {activeProduct && (
            <div className="animate-fade-in">
               {/* Product Info Cards */}
               <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200 items-end">
                  <div className="md:col-span-2">
                    <span className="text-xs text-slate-400 font-bold uppercase block mb-1">Descrição</span>
                    <p className="font-semibold text-slate-800 text-sm">{activeProduct.description}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase block mb-1">Solado</span>
                    <p className="font-semibold text-slate-700 text-sm">{activeProduct.sole || '-'}</p>
                  </div>
                   <div>
                    <span className="text-xs text-slate-400 font-bold uppercase block mb-1">Material</span>
                    <p className="font-semibold text-slate-700 text-sm">{activeProduct.material || '-'}</p>
                  </div>
                  <div className="text-right bg-white p-2 rounded border border-slate-100 shadow-sm w-full">
                    <span className="text-xs text-slate-400 font-bold uppercase block">Preço Unit.</span>
                    <p className="font-bold text-lg text-emerald-600">R$ {activeProduct.price.toFixed(2)}</p>
                  </div>
               </div>

               {/* Grid Input */}
               <div className="mb-6">
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Grade de Numeração (Pares)</label>
                  <div className="flex flex-wrap gap-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                     {SIZES.map(size => (
                        <div key={size} className="flex flex-col items-center w-12">
                           <span className="text-xs font-bold text-slate-500 mb-1">{size}</span>
                           <input 
                             type="number"
                             min="0"
                             className={`w-full h-10 text-center border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${sizeQuantities[size] > 0 ? 'bg-indigo-50 border-indigo-300 font-bold text-indigo-700' : 'border-slate-300'}`}
                             value={sizeQuantities[size] || ''}
                             onChange={(e) => handleSizeChange(size, e.target.value)}
                           />
                        </div>
                     ))}
                  </div>
               </div>

               {/* Footer Actions */}
               <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <div className="text-sm text-slate-600">
                     <span className="font-semibold">Total Pares:</span> {currentTotalQty}
                     <span className="mx-3">|</span>
                     <span className="font-semibold">Total Item:</span> R$ {currentTotalPrice.toFixed(2)}
                  </div>
                  <button 
                    onClick={addItem}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md flex items-center gap-2 font-semibold disabled:bg-slate-300 disabled:cursor-not-allowed transition-all"
                    disabled={currentTotalQty === 0}
                  >
                    <Plus size={20} /> Adicionar
                  </button>
               </div>
            </div>
          )}
          
          {!activeProduct && refInput.length > 0 && !showProductSuggestions && (
             <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200">
                Produto não encontrado. Verifique a referência.
             </div>
          )}
        </div>

        {/* Step 3: Payment & Shipping */}
        <div className={`bg-white p-6 rounded-xl shadow-sm border border-slate-200 transition-opacity ${cart.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex items-center gap-2 mb-6 text-slate-800 font-semibold">
            <CreditCard className="text-indigo-600" size={20} />
            <h3>3. Pagamento e Entrega</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Frete</label>
              <div className="flex bg-slate-100 rounded-lg p-1">
                <button 
                  onClick={() => setFreight('CIF')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${freight === 'CIF' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}
                >
                  CIF
                </button>
                <button 
                  onClick={() => setFreight('FOB')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${freight === 'FOB' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}
                >
                  FOB
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Condição de Pagamento</label>
              <input 
                type="text"
                className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-200 outline-none"
                placeholder="Ex: 30/60/90 dias"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Forma de Pagamento</label>
              <select 
                className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-200 outline-none bg-white"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="">Selecione...</option>
                <option value="Boleto Bancário">Boleto Bancário</option>
                <option value="Pix">Pix</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Cheque">Cheque</option>
                <option value="Depósito">Depósito</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Summary */}
      <div className="xl:col-span-1">
        <div className="bg-white rounded-xl shadow-lg border border-slate-100 sticky top-6">
          <div className="p-5 border-b border-slate-100 bg-slate-50 rounded-t-xl">
             <h3 className="font-bold text-slate-700">Resumo do Pedido</h3>
          </div>
          
          <div className="p-4 max-h-[calc(100vh-300px)] overflow-y-auto space-y-3">
             {cart.length === 0 ? (
               <p className="text-center text-slate-400 py-8">Carrinho vazio</p>
             ) : (
               cart.map((item, idx) => (
                 <div key={idx} className="flex flex-col text-sm p-3 bg-white border border-slate-100 rounded-lg shadow-sm hover:border-indigo-200 transition-all group">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-bold text-slate-800">{item.reference}</div>
                        <div className="text-xs text-slate-500 truncate w-32">{item.description}</div>
                      </div>
                      <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 p-1">
                         <Trash2 size={16} />
                      </button>
                    </div>
                    
                    {/* Mini Grid Preview */}
                    <div className="flex flex-wrap gap-1 mb-2">
                       {Object.entries(item.sizes).filter(([_, q]) => (q as any) > 0).map(([size, qty]) => (
                          <span key={size} className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                             {size}: <b>{qty}</b>
                          </span>
                       ))}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-50 mt-auto">
                       <span className="text-xs text-slate-500">{item.quantity} pares</span>
                       <span className="font-bold text-indigo-600">R$ {item.total.toFixed(2)}</span>
                    </div>
                 </div>
               ))
             )}
          </div>

          <div className="p-5 bg-slate-50 rounded-b-xl border-t border-slate-100">
             <div className="flex justify-between items-center mb-2">
                <span className="text-slate-500">Itens</span>
                <span className="font-semibold">{cart.length}</span>
             </div>
             <div className="flex justify-between items-center mb-6">
                <span className="text-slate-500">Total Geral</span>
                <span className="text-2xl font-bold text-slate-800">R$ {totalOrderValue.toFixed(2).replace('.', ',')}</span>
             </div>
             
             <button 
              onClick={handleSaveOrder}
              disabled={cart.length === 0 || !selectedClient || isSaving}
              className="w-full py-4 bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-600 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
             >
               {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Finalizar Pedido</>}
             </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default OrderForm;