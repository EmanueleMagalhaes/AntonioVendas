import React, { useState, useMemo } from 'react';
import { Calendar, Search, Filter, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { Order, Client } from '../types';
import { generateOrderPDF } from '../services/pdfService';

interface ReportsProps {
  orders: Order[];
  clients: Client[];
}

type DateRangePreset = '7' | '15' | '30' | 'custom';

const Reports: React.FC<ReportsProps> = ({ orders, clients }) => {
  const [preset, setPreset] = useState<DateRangePreset>('7');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  console.log("📄 Dados recebidos no Reports:", { orders, clients });

  const totalOrders = orders?.length || 0;
  const totalRevenue = orders?.reduce((acc, order) => acc + (order.total || 0), 0) || 0;

  const totalClients = clients?.length || 0;

  console.log("📊 Totais calculados:", { totalOrders, totalRevenue, totalClients });


  // Initialize dates on mount or preset change
  React.useEffect(() => {
    if (preset !== 'custom') {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - parseInt(preset));
      
      setEndDate(end.toISOString().split('T')[0]);
      setStartDate(start.toISOString().split('T')[0]);
    }
  }, [preset]);

  const filteredOrders = useMemo(() => {
    const startMs = startDate ? new Date(startDate).getTime() : 0;
    const endMs = endDate ? new Date(endDate).getTime() + 86400000 : Date.now(); // Add 1 day to include the end date fully

    return orders.filter(order => {
      const inDateRange = order.date >= startMs && order.date < endMs;
      const matchesSearch = 
        order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase());
      return inDateRange && matchesSearch;
    }).sort((a, b) => b.date - a.date);
  }, [orders, startDate, endDate, searchTerm]);

  const reportSummary = useMemo(() => {
    return {
      totalRevenue: filteredOrders.reduce(
      (acc, o) => acc + (o.totalValue ?? o.total ?? o.totalAmount ?? 0), 
      0
    ),
    totalOrders: filteredOrders.length,
    totalItems: filteredOrders.reduce(
      (acc, o) => acc + (o.items?.reduce((sum, i) => sum + (i.quantity ?? 0), 0) ?? 0),
      0
    ),
  };
}, [filteredOrders]);

  const handlePrint = (order: Order) => {
    const client = clients.find(c => c.id === order.clientId);
    
    if (client) {
      generateOrderPDF(order, client).save(`Pedido_${order.id}.pdf`);
    } else {
      alert('Dados do cliente não encontrados para gerar PDF.');
    }
  };

  const toggleRow = (id: string) => {
    if (expandedRow === id) setExpandedRow(null);
    else setExpandedRow(id);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Relatórios de Vendas</h2>
          <p className="text-slate-500">Analise o desempenho e histórico detalhado.</p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
        <div className="flex flex-col lg:flex-row gap-6 items-end">
          
          {/* Presets */}
          <div className="w-full lg:w-auto">
            <label className="block text-sm font-medium text-slate-700 mb-2">Período</label>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {(['7', '15', '30', 'custom'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPreset(p)}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    preset === p 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {p === 'custom' ? 'Personalizado' : `Últimos ${p} dias`}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Inputs */}
          <div className={`flex gap-4 w-full lg:w-auto ${preset !== 'custom' ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Data Início</label>
                <input 
                  type="date" 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setPreset('custom'); }}
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Data Fim</label>
                <input 
                  type="date" 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setPreset('custom'); }}
                />
             </div>
          </div>

          {/* Search */}
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-slate-700 mb-2">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Nome do cliente ou ID do pedido..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-lg shadow-indigo-200">
          <p className="text-indigo-200 text-sm font-medium mb-1">Faturamento Total</p>
          <h3 className="text-3xl font-bold">R$ {reportSummary.totalRevenue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-sm font-medium mb-1">Pedidos no Período</p>
          <h3 className="text-3xl font-bold text-slate-800">{reportSummary.totalOrders}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-sm font-medium mb-1">Produtos Vendidos</p>
          <h3 className="text-3xl font-bold text-slate-800">{reportSummary.totalItems} <span className="text-sm font-normal text-slate-400">unidades</span></h3>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-4 w-10"></th>
                <th className="p-4">Data</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Resumo</th>
                <th className="p-4 text-right">Valor</th>
                <th className="p-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map(order => {
                console.log("🧾 Pedido individual:", {
                  cliente: order.clientName,
                  valor: order.totalValue ?? order.total ?? order.totalAmount,
                  data: order.createdAt || order.date,
                });
                console.log("🧾 Valores dos pedidos:", orders.map(o => ({
                  id: o.id,
                  totalValue: o.totalValue,
                  total: o.total,
                  totalAmount: o.totalAmount
                })));
                console.log("🧾 Pedido individual:", {
                  id: order.id,
                  cliente: order.clientName,
                  totalValue: order.totalValue,
                  total: order.total,
                  totalAmount: order.totalAmount,
                  itens: order.items?.map(i => ({
                    descricao: i.description,
                    unitPrice: i.unitPrice,
                    quantity: i.quantity,
                    total: i.total
                  }))
                });
                console.log("🔍 Exemplo de um pedido:", orders[0]);

                return (
                <React.Fragment key={order.id}>
                  <tr 
                    className={`hover:bg-slate-50 transition-colors cursor-pointer ${expandedRow === order.id ? 'bg-slate-50' : ''}`}
                    onClick={() => toggleRow(order.id)}
                  >
                    <td className="p-4 text-slate-400">
                      {expandedRow === order.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </td>
                    <td className="p-4 text-slate-600">
                      {new Date(order.date).toLocaleDateString('pt-BR')}
                      <div className="text-xs text-slate-400">{new Date(order.date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</div>
                    </td>
                    <td className="p-4 font-medium text-slate-800">
                      {order.clientName}
                      <div className="text-xs text-slate-400 font-mono">#{order.id.substring(0,6).toUpperCase()}</div>
                    </td>
                    <td className="p-4 text-slate-600">
                      {order.items.length} itens • {order.items.reduce((s, i) => s + i.quantity, 0)} un.
                    </td>
                    <td className="p-4 text-right font-bold text-emerald-600">
                      R$ {(order.totalValue ?? order.total ?? 0).toFixed(2)}
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handlePrint(order); }}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                        title="Baixar PDF"
                      >
                        <Download size={18} />
                      </button>
                    </td>
                  </tr>
                  
                  {/* Expanded Details Row */}
                  {expandedRow === order.id && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={6} className="p-0">
                        <div className="px-12 py-4 border-t border-slate-100">
                          
                          <div className="grid grid-cols-3 gap-4 mb-4 text-xs text-slate-600 bg-white p-3 rounded border border-slate-200">
                            <div><span className="font-bold">Frete:</span> {order.freight || 'FOB'}</div>
                            <div><span className="font-bold">Cond. Pagto:</span> {order.paymentTerms || '-'}</div>
                            <div><span className="font-bold">Forma Pagto:</span> {order.paymentMethod || '-'}</div>
                          </div>

                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Itens do Pedido</p>
                          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                            <table className="w-full text-xs">
                              <thead className="bg-slate-100 text-slate-600">
                                <tr>
                                  <th className="px-4 py-2 text-left">Ref</th>
                                  <th className="px-4 py-2 text-left">Produto</th>
                                  <th className="px-4 py-2 text-left">Grade</th>
                                  <th className="px-4 py-2 text-center">Qtd Total</th>
                                  <th className="px-4 py-2 text-right">Unit.</th>
                                  <th className="px-4 py-2 text-right">Total</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {order.items.map((item, idx) => (
                                  <tr key={idx}>
                                    <td className="px-4 py-2 font-mono text-slate-500">{item.reference}</td>
                                    <td className="px-4 py-2">
                                      {item.description}
                                      <div className="text-[10px] text-slate-400">Cor: {item.color} | Solado: {item.sole || '-'}</div>
                                    </td>
                                    <td className="px-4 py-2">
                                      <div className="flex gap-1 flex-wrap">
                                        {Object.entries(item.sizes || {}).filter(([_, q]) => (q as any) > 0).map(([size, qty]) => (
                                          <span key={size} className="bg-slate-200 px-1 rounded text-slate-700 font-medium">{size}: {qty}</span>
                                        ))}
                                      </div>
                                    </td>
                                    <td className="px-4 py-2 text-center font-medium">{item.quantity}</td>
                                    <td className="px-4 py-2 text-right">R$ {item.unitPrice.toFixed(2)}</td>
                                    <td className="px-4 py-2 text-right font-medium">R$ {item.total.toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
                );
              })}
            </tbody>
          </table>
          {filteredOrders.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              <Filter size={48} className="mx-auto mb-3 opacity-20" />
              <p>Nenhum pedido encontrado para o filtro selecionado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;