import React from 'react';
import { Product } from '../types';
import ProductCard from './ProductCard';

interface MarketplaceProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

const Marketplace: React.FC<MarketplaceProps> = ({ products, onSelectProduct }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Featured Collections</h2>
          <p className="text-gray-600 mt-2">Unique finds from small businesses worldwide.</p>
        </div>
        <button className="text-rose-600 font-medium hover:text-rose-800">View All</button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            onSelect={onSelectProduct}
          />
        ))}
      </div>
    </div>
  );
};

export default Marketplace;