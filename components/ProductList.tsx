import React, { useState, useMemo } from 'react';
import { Plus, Search, Tag, Edit, Trash2, Loader2 } from 'lucide-react';
import { Product } from '../types';
import { saveProduct, deleteProduct } from '../services/storageService';

interface ProductListProps {
  products: Product[];
  onRefresh: () => void;
}

const ProductList: React.FC<ProductListProps> = ({ products, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> & { id?: string }>({
    reference: '', description: '', price: 0, category: '', grid: '33-46', color: '', sole: '', material: ''
  });
  const [error, setError] = useState('');

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const handleOpenModal = (product?: Product) => {
    setError('');
    if (product) {
      setEditingProduct(product);
    } else {
      setEditingProduct({
        reference: '', description: '', price: 0, category: '', grid: '33-46', color: '', sole: '', material: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await deleteProduct(id);
        onRefresh();
      } catch (e) {
        alert("Erro ao excluir produto.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      // Handle price input potentially being a string from the input field temporarily or number
      const priceVal = typeof editingProduct.price === 'string' 
        ? parseFloat((editingProduct.price as string).replace(',', '.')) 
        : editingProduct.price;

      await saveProduct({
        ...editingProduct as any,
        price: priceVal || 0
      });
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar produto");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Catálogo de Produtos</h2>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md transition-all"
        >
          <Plus size={20} /> Cadastrar Produto
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Buscar por referência ou descrição..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-800 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-4">Referência</th>
                <th className="p-4">Descrição</th>
                <th className="p-4">Caracteristicas</th>
                <th className="p-4">Grade</th>
                <th className="p-4 text-right">Preço</th>
                <th className="p-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-medium text-indigo-600">{product.reference}</td>
                  <td className="p-4">{product.description}</td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1 text-xs">
                      <span><span className="font-semibold">Cor:</span> {product.color}</span>
                      <span><span className="font-semibold">Solado:</span> {product.sole || '-'}</span>
                      <span><span className="font-semibold">Mat:</span> {product.material || '-'}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">{product.grid}</span>
                  </td>
                  <td className="p-4 text-right font-bold text-emerald-600">
                    R$ {product.price.toFixed(2).replace('.', ',')}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => handleOpenModal(product)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredProducts.length === 0 && (
          <div className="p-8 text-center text-slate-400">Nenhum produto encontrado.</div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-bold mb-4">{editingProduct.id ? 'Editar Produto' : 'Novo Produto'}</h3>
            {error && <div className="bg-red-50 text-red-600 p-2 rounded mb-4 text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Referência</label>
                    <input required className="w-full border p-2 rounded-lg" value={editingProduct.reference} onChange={e => setEditingProduct({...editingProduct, reference: e.target.value.toUpperCase()})} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                    <input required className="w-full border p-2 rounded-lg" value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                <input required className="w-full border p-2 rounded-lg" value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} />
              </div>
              
              {/* Details Row */}
              <div className="grid grid-cols-3 gap-4">
                 <div className="col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cor</label>
                    <input required className="w-full border p-2 rounded-lg" value={editingProduct.color} onChange={e => setEditingProduct({...editingProduct, color: e.target.value})} />
                 </div>
                 <div className="col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Solado</label>
                    <input required className="w-full border p-2 rounded-lg" value={editingProduct.sole} onChange={e => setEditingProduct({...editingProduct, sole: e.target.value})} />
                 </div>
                 <div className="col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Material (Couro)</label>
                    <input required className="w-full border p-2 rounded-lg" value={editingProduct.material} onChange={e => setEditingProduct({...editingProduct, material: e.target.value})} />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Grade</label>
                    <input required placeholder="ex: 33-46" className="w-full border p-2 rounded-lg" value={editingProduct.grid} onChange={e => setEditingProduct({...editingProduct, grid: e.target.value})} />
                 </div>
                 <div className="col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Preço (R$)</label>
                    <input required type="number" step="0.01" className="w-full border p-2 rounded-lg" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: e.target.value as any})} />
                 </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-slate-600 font-medium">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;