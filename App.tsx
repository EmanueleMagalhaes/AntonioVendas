import React, { useState, useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ClientList from './components/ClientList';
import ProductList from './components/ProductList';
import OrderForm from './components/OrderForm';
import Reports from './components/Reports';
import { Menu, Loader2 } from 'lucide-react';
import { seedInitialProducts, getClients, getProducts, getOrders } from './services/storageService';
import { Client, Product, Order } from './types';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Data State
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Initialize
  useEffect(() => {
    const initData = async () => {
      try {
        await seedInitialProducts();
        await refreshData();
      } catch (error) {
        console.error("Error loading data", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initData();
    
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const refreshData = async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (isLoading && clients.length === 0 && products.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-indigo-600">
             <Loader2 className="w-10 h-10 animate-spin mx-auto mb-2" />
             <p>Carregando dados...</p>
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