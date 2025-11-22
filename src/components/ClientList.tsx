
import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, MapPin, Phone, Mail, Building2, User, FileText, Edit, Loader2 } from 'lucide-react';
import { Client } from '../types';
import { db } from '../firebaseConfig';
import { collection, addDoc, updateDoc, doc, getDocs } from 'firebase/firestore';


const ClientList: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [clientForm, setClientForm] = useState<Partial<Client>>({
    companyName: '',
    name: '',
    phone: '',
    phone2: '',
    email: '',
    zipCode: '',
    address: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    cpfCnpj: '',
    stateRegistration: ''
  });

  // ✅ Buscar clientes do Firestore
  const fetchClients = async () => {
    const querySnapshot = await getDocs(collection(db, 'clients'));
    const data: Client[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
    setClients(data);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filteredClients = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return clients.filter(c =>
      (c.companyName && c.companyName.toLowerCase().includes(term)) ||
      c.name.toLowerCase().includes(term) ||
      c.phone.includes(searchTerm)
    );
  }, [clients, searchTerm]);

  const handleEdit = (client: Client) => {
    setEditingId(client.id);
    setClientForm({ ...client });
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setEditingId(null);
    setClientForm({
      companyName: '',
      name: '',
      phone: '',
      phone2: '',
      email: '',
      zipCode: '',
      address: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
      cpfCnpj: '',
      stateRegistration: ''
    });
    setIsModalOpen(true);
  };

  const checkCep = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length === 8) {
      setIsLoadingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setClientForm(prev => ({
            ...prev,
            address: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf,
            zipCode: e.target.value
          }));
        }
      } catch (err) {
        console.error("Erro ao buscar CEP");
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  // ✅ Salvar no Firestore
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingId) {
        const docRef = doc(db, 'clients', editingId);
        await updateDoc(docRef, clientForm);
      } else {
        await addDoc(collection(db, 'clients'), clientForm);
      }
      setIsModalOpen(false);
      setEditingId(null);
      fetchClients();
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      alert("Erro ao salvar cliente.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Gerenciar Clientes</h2>
        <button
          onClick={handleNew}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md transition-all"
        >
          <Plus size={20} /> Novo Cliente
        </button>
      </div>

      {/* Busca */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Buscar por empresa, responsável ou telefone..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Lista de clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <div key={client.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group relative">
            <button
              onClick={() => handleEdit(client)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
              title="Editar Cliente"
            >
              <Edit size={18} />
            </button>
            <div className="flex justify-between items-start mb-2 pr-10">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Building2 size={18} className="text-indigo-500" />
                  {client.companyName || 'Empresa N/A'}
                </h3>
                <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                  <User size={14} />
                  <span>{client.name}</span>
                </div>
              </div>
            </div>
            <span className="inline-block text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full whitespace-nowrap mb-3">
              {client.city}{client.state ? ` - ${client.state}` : ''}
            </span>
            <div className="border-t border-slate-100 pt-2 space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-indigo-500" />
                <span>{client.phone}</span>
                {client.phone2 && <span className="text-slate-400">/ {client.phone2}</span>}
              </div>
              {(client.cpfCnpj || client.stateRegistration) && (
                <div className="flex flex-col gap-1 text-xs text-slate-500">
                  {client.cpfCnpj && (
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-indigo-500" />
                      <span>CNPJ/CPF: {client.cpfCnpj}</span>
                    </div>
                  )}
                  {client.stateRegistration && (
                    <div className="flex items-center gap-2 ml-6">
                      <span>IE: {client.stateRegistration}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-indigo-500" />
                <span className="truncate">{client.email || 'Sem email'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-indigo-500 flex-shrink-0" />
                <span className="truncate line-clamp-1">
                  {client.address}
                  {client.number ? `, ${client.number}` : ''}
                  {client.neighborhood ? ` - ${client.neighborhood}` : ''}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-6 border-b pb-2">
              {editingId ? 'Editar Cliente' : 'Cadastrar Cliente'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Form fields iguais aos seus */}
              {/* ... */}
              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-slate-300 rounded-lg text-slate-600 font-medium hover:bg-slate-50">Cancelar</button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex justify-center items-center gap-2"
                >
                  {isSaving ? <Loader2 className="animate-spin" /> : 'Salvar Cadastro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientList;
