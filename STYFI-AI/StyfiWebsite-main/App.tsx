import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Marketplace from './components/Marketplace';
import OutfitComposer from './components/OutfitComposer';
import TrendDetector from './components/TrendDetector';
import VirtualTryOn from './components/VirtualTryOn';
import ImageEnhancer from './components/ImageEnhancer';
import { AppView, Product } from './types';

/**
 * Mock product data for demonstration
 * In production, this would be fetched from an API
 */
const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Silk Wrap Blouse',
    price: 85,
    category: 'Tops',
    image: 'https://images.unsplash.com/photo-1551163943-3f6a29e39bb7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    description: 'Elegant silk wrap blouse in soft pink.',
    seller: 'Studio 45'
  },
  {
    id: '2',
    name: 'High-Rise Wide Leg Trousers',
    price: 120,
    category: 'Bottoms',
    image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    description: 'Comfortable linen blend trousers.',
    seller: 'Urban Weave'
  },
  {
    id: '3',
    name: 'Handcrafted Leather Tote',
    price: 195,
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    description: 'Vegetable tanned leather tote bag.',
    seller: 'Artisan Goods'
  },
  {
    id: '4',
    name: 'Gold Layered Necklace',
    price: 45,
    category: 'Jewelry',
    image: 'https://images.unsplash.com/photo-1599643478518-17488fbbcd75?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    description: '18k gold plated minimalist necklace.',
    seller: 'Gilded Dreams'
  },
  {
    id: '5',
    name: 'Wool Blend Coat',
    price: 250,
    category: 'Outerwear',
    image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    description: 'Classic cut coat for winter.',
    seller: 'Nordic Style'
  },
  {
    id: '6',
    name: 'Pleated Midi Skirt',
    price: 78,
    category: 'Bottoms',
    image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    description: 'Flowy midi skirt with pleats.',
    seller: 'Bloom & Co'
  }
];

/**
 * Main Application Component
 */
const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);

  /**
   * Renders the appropriate view based on current navigation state
   */
  const renderView = (): React.ReactNode => {
    switch (currentView) {
      case AppView.HOME:
        return (
          <>
            <Hero setView={setCurrentView} />
            <Marketplace 
              products={MOCK_PRODUCTS} 
              onSelectProduct={() => setCurrentView(AppView.OUTFIT_COMPOSER)} 
            />
          </>
        );
      
      case AppView.MARKETPLACE:
        return (
          <Marketplace 
            products={MOCK_PRODUCTS} 
            onSelectProduct={() => setCurrentView(AppView.OUTFIT_COMPOSER)} 
          />
        );
      
      case AppView.OUTFIT_COMPOSER:
        return <OutfitComposer products={MOCK_PRODUCTS} />;
      
      case AppView.TREND_DETECTOR:
        return <TrendDetector />;
      
      case AppView.VIRTUAL_TRY_ON:
        return <VirtualTryOn products={MOCK_PRODUCTS} />;
      
      case AppView.IMAGE_ENHANCER:
        return <ImageEnhancer />;
      
      default:
        return <Hero setView={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-rose-50/50">
      <Navbar currentView={currentView} setView={setCurrentView} />
      
      <main className="pb-16">
        {renderView()}
      </main>
      
      <footer className="bg-white border-t border-rose-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xl font-bold text-gray-900">Styfi</span>
              <p className="text-gray-500 text-sm mt-1">
                Empowering small businesses with AI-powered fashion technology.
              </p>
            </div>
            <div className="text-sm text-gray-400">
              © {new Date().getFullYear()} Styfi Inc. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
