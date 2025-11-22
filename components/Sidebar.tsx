import React from 'react';
import { LayoutDashboard, Users, Package, FilePlus, BarChart3 } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  isMobile: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isMobile, isOpen, setIsOpen }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new-order', label: 'Novo Pedido', icon: FilePlus },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'products', label: 'Produtos', icon: Package },
    { id: 'reports', label: 'Relatórios', icon: BarChart3 },
  ];

  const handleNav = (viewId: string) => {
    setCurrentView(viewId);
    if (isMobile) setIsOpen(false);
  };

  // Changed to flex-col and removed relative/absolute logic for footer to prevent layout bugs
  const containerClass = isMobile
    ? `fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`
    : `w-64 bg-slate-900 text-white min-h-screen flex-shrink-0 flex flex-col`;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={containerClass}>
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-indigo-400">Antonio</span>Vendas
          </h1>
        </div>
        
        <nav className="p-4 space-y-2 flex-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === item.id
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer uses mt-auto to sit at bottom naturally, preventing overlap */}
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center bg-slate-900 mt-auto">
          v1.1.0 - Projeto Vendas
        </div>
      </div>
    </>
  );
};

export default Sidebar;