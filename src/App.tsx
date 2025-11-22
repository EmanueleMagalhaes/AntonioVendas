import React, { useState, useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ClientList from './components/ClientList';
import ProductList from './components/ProductList';
import OrderForm from './components/OrderForm';
import Reports from './components/Reports';
import { Menu, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { seedInitialProducts, getClients, getProducts, getOrders } from './services/storageService';
import { Client, Product, Order } from './types';


function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  
  // Data State
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Initialize
  useEffect(() => {
    initData();
    
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const initData = async () => {
    setIsLoading(true);
    setLoadingError(null);

    // Safety timeout: If Firebase hangs for 12 seconds, show retry button
    const timeoutId = setTimeout(() => {
      setIsLoading((current) => {
        if (current) {
          setLoadingError("O banco de dados demorou muito para responder. Verifique sua conexão.");
          return false;
        }
        return false;
      });
    }, 12000);

    try {
      await seedInitialProducts();
      await refreshData();
      clearTimeout(timeoutId); // Success, clear timeout
    } catch (error: any) {
      console.error("Error loading data", error);
      setLoadingError(error.message || "Erro ao conectar com o banco de dados.");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    // Don't set full screen loading for refresh, just background update usually
    // But for first load we need it.
    try {
      const [c, p, o] = await Promise.all([
        getClients(),
        getProducts(),
        getOrders()
      ]);
      setClients(c);
      setProducts(p);
      setOrders(o);
    } catch (error) {
      console.error("Error refreshing data", error);
      throw error;
    }
  };

  const renderContent = () => {
    if (isLoading && clients.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6">
          <div className="text-center text-indigo-600">
             <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" />
             <p className="text-lg font-bold">Inicializando Antonio Vendas...</p>
             <p className="text-sm text-slate-400 mt-2">Conectando ao Firebase...</p>
          </div>
        </div>
      );
    }

    if (loadingError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-100 max-w-md">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">Erro de Conexão</h3>
            <p className="text-slate-600 mb-6">{loadingError}</p>
            <button 
              onClick={initData}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw size={20} /> Tentar Novamente
            </button>
          </div>
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard orders={orders} clientCount={clients.length} productCount={products.length} />;
      case 'clients':
        return <ClientList clients={clients} onRefresh={refreshData} />;
      case 'products':
        return <ProductList products={products} onRefresh={refreshData} />;
      case 'new-order':
        return <OrderForm clients={clients} products={products} onOrderSaved={refreshData} />;
      case 'reports':
        return <Reports orders={orders} clients={clients} />;
      default:
        return <Dashboard orders={orders} clientCount={clients.length} productCount={products.length} />;
    }
  };

  return (
    <HashRouter>
      <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900">
        
        {/* Mobile Menu Button */}
        {isMobile && (
          <div className="fixed top-0 left-0 right-0 bg-white p-4 z-30 shadow-md flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="text-slate-600">
              <Menu size={24} />
            </button>
            <span className="font-bold text-lg text-indigo-900">Antonio Vendas</span>
          </div>
        )}

        <Sidebar 
          currentView={currentView} 
          setCurrentView={setCurrentView} 
          isMobile={isMobile}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
        />

        <main className={`flex-1 overflow-y-auto transition-all duration-300 ${isMobile ? 'pt-20' : ''}`}>
          {renderContent()}
        </main>
      </div>
    </HashRouter>
  );
}

export default App;