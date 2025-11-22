import React, { useMemo } from 'react';
import { Order } from '../types';
import { TrendingUp, Users, ShoppingBag, DollarSign, Trophy, ArrowUpRight } from 'lucide-react';

interface DashboardProps {
  orders: Order[];
  clientCount: number;
  productCount: number;
}

const Dashboard: React.FC<DashboardProps> = ({ orders, clientCount, productCount }) => {
  // Calculate metrics for the last 30 days
  const stats = useMemo(() => {
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const last30DaysOrders = orders.filter(o => (now - o.date) < thirtyDaysMs);

    const totalRevenue = last30DaysOrders.reduce((acc, o) => acc + o.totalValue, 0);
    
    // Active customers: unique client IDs in orders from the last 30 days
    const activeClientsSet = new Set(last30DaysOrders.map(o => o.clientId));
    
    // Top 5 Products logic
    const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
    
    last30DaysOrders.forEach(order => {
      order.items.forEach(item => {
        if (!productSales[item.reference]) {
          productSales[item.reference] = { 
            name: item.description, 
            qty: 0, 
            revenue: 0 
          };
        }
        productSales[item.reference].qty += item.quantity;
        productSales[item.reference].revenue += item.total;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return {
      revenue30Days: totalRevenue,
      orders30Days: last30DaysOrders.length,
      activeClients: activeClientsSet.size,
      topProducts
    };
  }, [orders]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
          <p className="text-slate-500 text-sm mt-1">Visão geral dos últimos 30 dias</p>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
           <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
               <DollarSign size={24} />
             </div>
             <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
               <ArrowUpRight size={12} className="mr-1" /> 30 dias
             </span>
           </div>
           <div>
             <p className="text-sm font-medium text-slate-500">Faturamento</p>
             <h3 className="text-3xl font-bold text-slate-800 mt-1">
               R$ {stats.revenue30Days.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
             </h3>
           </div>
        </div>

        {/* Active Customers Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
           <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
               <Users size={24} />
             </div>
             <span className="flex items-center text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
               Ativos
             </span>
           </div>
           <div>
             <p className="text-sm font-medium text-slate-500">Clientes Ativos (30d)</p>
             <h3 className="text-3xl font-bold text-slate-800 mt-1">
               {stats.activeClients}
             </h3>
             <p className="text-xs text-slate-400 mt-1">de {clientCount} clientes totais</p>
           </div>
        </div>

        {/* Sales Volume Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
           <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
               <ShoppingBag size={24} />
             </div>
             <span className="flex items-center text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
               Volume
             </span>
           </div>
           <div>
             <p className="text-sm font-medium text-slate-500">Pedidos Realizados</p>
             <h3 className="text-3xl font-bold text-slate-800 mt-1">
               {stats.orders30Days}
             </h3>
           </div>
        </div>

        {/* Products Count Card */}
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
           <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
               <TrendingUp size={24} />
             </div>
             <span className="flex items-center text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
               Catálogo
             </span>
           </div>
           <div>
             <p className="text-sm font-medium text-slate-500">Produtos Cadastrados</p>
             <h3 className="text-3xl font-bold text-slate-800 mt-1">
               {productCount}
             </h3>
           </div>
        </div>
      </div>

      {/* Top 5 Products Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
           <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Trophy className="text-yellow-500" size={20} />
                Top 5 Produtos Mais Vendidos
              </h3>
           </div>
           <div className="p-0">
             {stats.topProducts.length > 0 ? (
               <div className="divide-y divide-slate-100">
                 {stats.topProducts.map((prod, index) => (
                   <div key={index} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                          index === 1 ? 'bg-slate-200 text-slate-700' : 
                          index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{prod.name}</p>
                          <p className="text-xs text-slate-500">{prod.qty} unidades vendidas</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600">R$ {prod.revenue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                      </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="p-10 text-center text-slate-400">
                 Nenhuma venda registrada nos últimos 30 dias.
               </div>
             )}
           </div>
        </div>

        {/* Recent Activity Mini List (Visual Filler) */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-lg">
          <h3 className="font-bold mb-6 text-lg">Atividade Recente</h3>
          <div className="space-y-6">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-start gap-3 relative">
                 <div className="absolute left-[5px] top-8 bottom-[-24px] w-px bg-slate-700 last:hidden"></div>
                 <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 mt-1.5 relative z-10"></div>
                 <div>
                   <p className="text-sm font-medium text-slate-200">Pedido #{order.id.substring(0,5).toUpperCase()}</p>
                   <p className="text-xs text-slate-400">{order.clientName}</p>
                   <p className="text-xs text-indigo-400 mt-1">R$ {order.totalValue.toFixed(2)}</p>
                 </div>
                 <div className="ml-auto text-xs text-slate-500">
                    {new Date(order.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit'})}
                 </div>
              </div>
            ))}
            {orders.length === 0 && <p className="text-slate-500 text-sm">Sem atividades recentes.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;