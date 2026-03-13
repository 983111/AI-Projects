import React, { useState } from 'react';
import { getTrends } from '../services/geminiService';
import { TrendReport, LoadingState } from '../types';
import { TrendingUp, Search, Loader2, ArrowUpRight } from 'lucide-react';

const TrendDetector: React.FC = () => {
  const [category, setCategory] = useState('');
  const [trends, setTrends] = useState<TrendReport[]>([]);
  const [status, setStatus] = useState<LoadingState>('idle');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category.trim()) return;
    
    setStatus('loading');
    const results = await getTrends(category);
    setTrends(results);
    setStatus('success');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Market Trend Detector</h2>
        <p className="text-gray-600 mb-8">
          Use AI to analyze real-time market data and discover what's hot. Perfect for sellers deciding what to list next.
        </p>
        
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Enter a category (e.g., 'Summer Dresses', 'Handmade Jewelry')"
            className="w-full px-6 py-4 pr-12 rounded-full border border-gray-200 shadow-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none text-lg"
          />
          <button 
            type="submit"
            className="absolute right-2 top-2 p-2 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-colors"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {status === 'success' && trends.map((trend, index) => (
          <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-rose-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-rose-50 p-2 rounded-lg">
                <TrendingUp className="w-6 h-6 text-rose-600" />
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                trend.popularityScore > 80 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                Score: {trend.popularityScore}
              </span>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">{trend.trendName}</h3>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">{trend.description}</p>
            
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Top Keywords</p>
              <div className="flex flex-wrap gap-2">
                {trend.keyKeywords.map((keyword, kIdx) => (
                  <span key={kIdx} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                    #{keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {status === 'idle' && (
        <div className="text-center text-gray-400 mt-12">
            <div className="inline-block p-4 rounded-full bg-rose-50 mb-4">
                <TrendingUp className="w-8 h-8 text-rose-300" />
            </div>
            <p>Start a search to see real-time trends</p>
        </div>
      )}
    </div>
  );
};

export default TrendDetector;