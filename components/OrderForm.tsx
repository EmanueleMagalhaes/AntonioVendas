import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Save, FileText, CheckCircle, Search, User, Package, CreditCard, Loader2, Send } from 'lucide-react';
import { Client, Product, OrderItem, Order } from '../types';
import { saveOrder, updateOrder } from '../services/storageService';
import { generateOrderPDF } from '../services/pdfService';
import { serverTimestamp } from 'firebase/firestore';

interface OrderFormProps {
  clients: Client[];
  products: Product[];
  onOrderSaved: () => void;
  initialOrder?: Order | null;
  onNewOrder?: () => void;
}

const SIZES = ['33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'];

const OrderForm: React.FC<OrderFormProps> = ({ clients, products, onOrderSaved, initialOrder, onNewOrder }) => {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientList, setShowClientList] = useState(false);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [refInput, setRefInput] = useState('');
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [sizeQuantities, setSizeQuantities] = useState<Record<string, number>>({});
  const [freight, setFreight] = useState('FOB');
  const [paymentTerms, setPaymentTerms] = useState('');
  
  // AJUSTE 1: Valor inicial padrão para a forma de pagamento
  const [paymentMethod, setPaymentMethod] = useState('Boleto Bancário');
  
  const [isSaving, setIsSaving] = useState(false);
  const [savedOrder, setSavedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (initialOrder) {
      const client = clients.find(c => c.id === initialOrder.clientId);
      if (client) setSelectedClient(client);
      setCart(initialOrder.items);
      setFreight(initialOrder.freight || 'FOB');
      setPaymentTerms(initialOrder.paymentTerms || '');
      setPaymentMethod(initialOrder.paymentMethod || 'Boleto Bancário');
    }
  }, [initialOrder, clients]);

  const filteredClients = useMemo(() => {
    return clients.filter(c => 
      (c.companyName?.toLowerCase() || "").includes(clientSearch.toLowerCase()) || 
      (c.name?.toLowerCase() || "").includes(clientSearch.toLowerCase())
    );
  }, [clients, clientSearch]);

  const filteredProducts = useMemo(() => {
    if (!refInput) return [];
    return products.filter(p => p.reference.toUpperCase().includes(refInput.toUpperCase())).slice(0, 5);
  }, [products, refInput]);

  const currentTotalQty = useMemo(() => Object.values(sizeQuantities).reduce((a, b) => a + b, 0), [sizeQuantities]);
  const totalOrderValue = useMemo(() => cart.reduce((acc, item) => acc + item.total, 0), [cart]);

  const handleSizeChange = (size: string, value: string) => {
    const qty = parseInt(value) || 0;
    setSizeQuantities(prev => ({ ...prev, [size]: qty }));
  };

  const addItem = () => {
    if (!activeProduct || currentTotalQty === 0) return;
    
    const newItem: OrderItem = {
      productId: activeProduct.id,
      reference: activeProduct.reference,
      description: activeProduct.description,
      unitPrice: activeProduct.price,
      quantity: currentTotalQty,
      sizes: { ...sizeQuantities },
      total: currentTotalQty * activeProduct.price,
      color: activeProduct.color || '',
      sole: activeProduct.sole || '',
      material: activeProduct.material || ''
    };

    setCart([...cart, newItem]);
    setActiveProduct(null);
    setRefInput('');
    setSizeQuantities({});
  };

  const handleSaveOrder = async () => {
    if (!selectedClient || cart.length === 0) return;
    setIsSaving(true);
    try {
      const orderData: Omit<Order, 'id'> = {
        clientId: selectedClient.id,
        clientName: selectedClient.companyName || selectedClient.name,
        items: cart,
        totalValue: totalOrderValue,
        date: serverTimestamp(),
        status: 'pendente',
        freight,
        paymentTerms,
        paymentMethod
      };

      let result: Order;
      if (initialOrder?.id) {
        await updateOrder(initialOrder.id, orderData);
        result = { ...orderData, id: initialOrder.id } as Order;
      } else {
        const saved = await saveOrder(orderData);
        result = saved as Order;
      }

      setSavedOrder(result);
      onOrderSaved();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar pedido");
    } finally {
      setIsSaving(false);
    }
  };

  const removeItem = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleNewOrderLocal = () => {
    setSavedOrder(null);
    setCart([]);
    setSelectedClient(null);
    setPaymentTerms('');
    // AJUSTE 2: Resetar para o padrão
    setPaymentMethod('Boleto Bancário');
    if (onNewOrder) onNewOrder();
  };

  if (savedOrder && selectedClient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-100">
            <CheckCircle className="text-emerald-500 w-16 h-16 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Pedido Gravado!</h2>
            <p className="text-slate-500 mb-8">O pedido para <strong>{savedOrder.clientName}</strong> foi salvo com sucesso.</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => generateOrderPDF(savedOrder, selectedClient).save()} className="w-full bg-indigo-600 text-white p-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg shadow-indigo-100">
                <FileText size={20}/> Baixar PDF
              </button>
              <button onClick={handleNewOrderLocal} className="w-full bg-slate-100 text-slate-700 p-4 rounded-xl flex items-center justify-center gap-2 font-bold">
                <Plus size={20}/> Novo Pedido
              </button>
            </div>
          </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-8 grid grid-cols-1 xl:grid-cols-4 gap-8">
      <div className="xl:col-span-3 space-y-6">
        {/* Seção 1: Cliente */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center gap-2 mb-4 font-semibold"><User className="text-indigo-600" size={20} /><h3>1. Cliente</h3></div>
          {selectedClient ? (
            <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-lg border">
              <p className="font-bold">{selectedClient.companyName}</p>
              <button onClick={() => setSelectedClient(null)} className="text-indigo-500 text-sm font-bold">Trocar</button>
            </div>
          ) : (
            <div className="relative">
              <input type="text" placeholder="Buscar cliente..." className="w-full p-3 border rounded-lg" value={clientSearch} onChange={(e) => { setClientSearch(e.target.value); setShowClientList(true); }} />
              {showClientList && clientSearch && (
                <ul className="absolute z-30 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                  {filteredClients.map(c => (
                    <li key={c.id} className="p-3 hover:bg-indigo-50 cursor-pointer border-b last:border-0" onClick={() => { setSelectedClient(c); setShowClientList(false); }}>
                      {c.companyName}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Seção 2: Produtos */}
        <div className={`bg-white p-6 rounded-xl shadow-sm border ${!selectedClient ? 'opacity-50' : ''}`}>
          <div className="flex items-center gap-2 mb-6 font-semibold"><Package className="text-indigo-600" size={20} /><h3>2. Produtos</h3></div>
          <input type="text" placeholder="Referência..." className="w-full border p-3 rounded-lg uppercase font-bold" value={refInput} onChange={(e) => setRefInput(e.target.value)} />
          {refInput && !activeProduct && (
            <div className="border rounded-lg mt-2 bg-white shadow-md">
              {filteredProducts.map(p => (
                <div key={p.id} className="p-3 hover:bg-indigo-50 cursor-pointer border-b last:border-0" onClick={() => { setActiveProduct(p); setRefInput(p.reference); }}>
                  <span className="font-bold">{p.reference}</span> - {p.description}
                </div>
              ))}
            </div>
          )}
          {activeProduct && (
            <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-indigo-100">
               <div className="flex flex-wrap gap-2 mb-4">
                 {SIZES.map(size => (
                   <div key={size} className="w-12">
                     <span className="text-[10px] block text-center font-bold text-slate-500">{size}</span>
                     <input type="number" className="w-full border rounded text-center py-2" value={sizeQuantities[size] || ''} onChange={(e) => handleSizeChange(size, e.target.value)} />
                   </div>
                 ))}
               </div>
               <button onClick={addItem} className="w-full bg-indigo-600 text-white p-3 rounded-lg font-bold">Adicionar {currentTotalQty} pares</button>
            </div>
          )}
        </div>

        {/* Seção 3: Pagamento */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center gap-2 mb-6 font-semibold"><CreditCard className="text-indigo-600" size={20} /><h3>3. Pagamento</h3></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div>
               <label className="text-xs font-bold text-slate-500 mb-1 block">FRETE</label>
               <select className="w-full border p-3 rounded-lg bg-white" value={freight} onChange={(e) => setFreight(e.target.value)}>
                 <option value="FOB">FOB</option>
                 <option value="CIF">CIF</option>
               </select>
             </div>
             <div>
               <label className="text-xs font-bold text-slate-500 mb-1 block">CONDIÇÃO</label>
               <input type="text" placeholder="Ex: 30/60 dias" className="w-full border p-3 rounded-lg" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
             </div>
             <div>
               <label className="text-xs font-bold text-slate-500 mb-1 block">FORMA</label>
               {/* AJUSTE 3: Trocado de input para select */}
               <select className="w-full border p-3 rounded-lg bg-white font-bold text-indigo-700" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                 <option value="Boleto Bancário">Boleto Bancário</option>
                 <option value="Depósito">Depósito</option>
               </select>
             </div>
          </div>
        </div>
      </div>

      {/* Resumo Lateral */}
      <div className="xl:col-span-1">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 sticky top-6 overflow-hidden">
          <div className="p-4 bg-slate-900 text-white font-bold flex items-center gap-2">
            <Package size={18} /> Resumo do Pedido
          </div>
          
          <div className="p-4 max-h-[400px] overflow-y-auto space-y-3">
            {cart.map((item, i) => (
              <div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-xs font-bold text-indigo-600 block uppercase">Ref: {item.reference}</span>
                    <span className="text-[11px] text-slate-500 leading-tight">{item.description}</span>
                  </div>
                  <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16}/></button>
                </div>
                
                <div className="flex justify-between items-end border-t border-slate-100 pt-2">
                  <div className="flex items-center gap-2">
                    <div className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-sm font-black">
                      {item.quantity} {item.quantity === 1 ? 'PAR' : 'PARES'}
                    </div>
                  </div>
                  <span className="font-bold text-slate-700">R$ {item.total.toFixed(2)}</span>
                </div>
              </div>
            ))}
            {cart.length === 0 && <p className="text-center text-slate-400 py-10 text-sm">Carrinho vazio</p>}
          </div>

          <div className="p-5 bg-indigo-50 border-t border-indigo-100">
            <div className="flex justify-between text-xs text-indigo-600 font-bold mb-1 uppercase tracking-wider">
              <span>Total de Pares:</span>
              <span>{cart.reduce((acc, item) => acc + item.quantity, 0)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold mb-4 text-slate-800">
              <span>Total Geral:</span>
              <span className="text-2xl text-indigo-700">R$ {totalOrderValue.toFixed(2)}</span>
            </div>
            <button onClick={handleSaveOrder} disabled={isSaving || cart.length === 0 || !selectedClient} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-xl font-bold flex justify-center items-center gap-2 disabled:opacity-50 transition-all">
              {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Gravar Pedido</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderForm;