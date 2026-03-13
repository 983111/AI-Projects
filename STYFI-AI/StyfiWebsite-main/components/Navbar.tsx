import React, { useState } from 'react';
import { ShoppingBag, Sparkles, TrendingUp, Camera, Wand2, Menu, X } from 'lucide-react';
import { AppView } from '../types';

interface NavbarProps {
  currentView: AppView;
  setView: (view: AppView) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, setView }) => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: AppView.MARKETPLACE, label: 'Marketplace', icon: ShoppingBag },
    { id: AppView.OUTFIT_COMPOSER, label: 'Outfit Composer', icon: Sparkles },
    { id: AppView.TREND_DETECTOR, label: 'Trend Detector', icon: TrendingUp },
    { id: AppView.VIRTUAL_TRY_ON, label: 'Virtual Try-On', icon: Camera },
    { id: AppView.IMAGE_ENHANCER, label: 'Seller Studio', icon: Wand2 },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-rose-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={() => setView(AppView.HOME)}>
            <span className="bg-gradient-to-r from-rose-500 to-rose-700 bg-clip-text text-transparent text-2xl font-bold tracking-tight">
              Styfi
            </span>
          </div>
          
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  currentView === item.id
                    ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-rose-600'
                }`}
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-gray-500 hover:text-rose-600 focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-rose-100">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id);
                  setIsOpen(false);
                }}
                className={`block w-full text-left px-3 py-3 rounded-md text-base font-medium ${
                  currentView === item.id
                    ? 'bg-rose-50 text-rose-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-rose-600'
                }`}
              >
                <div className="flex items-center">
                   <item.icon className="w-5 h-5 mr-3" />
                   {item.label}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;