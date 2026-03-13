import React from 'react';
import { Product } from '../types';
import { Plus } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onSelect?: (product: Product) => void;
  variant?: 'compact' | 'full';
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect, variant = 'full' }) => {
  return (
    <div className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col h-full">
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
        />
        {onSelect && (
          <button
            onClick={() => onSelect(product)}
            className="absolute bottom-3 right-3 bg-white/90 backdrop-blur text-rose-600 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-rose-600 hover:text-white"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>
      <div className={`p-4 ${variant === 'compact' ? 'py-3' : ''} flex-1 flex flex-col`}>
        <p className="text-xs font-medium text-rose-600 mb-1">{product.category}</p>
        <h3 className="font-semibold text-gray-900 leading-tight mb-1">{product.name}</h3>
        <p className="text-sm text-gray-500 mb-2 truncate">by {product.seller}</p>
        <div className="mt-auto flex justify-between items-center">
          <span className="text-lg font-bold text-gray-900">${product.price}</span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;