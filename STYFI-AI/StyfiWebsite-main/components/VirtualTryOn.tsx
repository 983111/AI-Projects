import React, { useState, useRef } from 'react';
import { Product, LoadingState } from '../types';
import { tryOnVirtual } from '../services/geminiService';
import { Camera, Upload, RefreshCw, FileText } from 'lucide-react';
import ProductCard from './ProductCard';

interface VirtualTryOnProps {
  products: Product[];
}

const VirtualTryOn: React.FC<VirtualTryOnProps> = ({ products }) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [userImage, setUserImage] = useState<File | null>(null);
  const [userImagePreview, setUserImagePreview] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [visualizationGuide, setVisualizationGuide] = useState<string | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUserImage(file);
      setUserImagePreview(URL.createObjectURL(file));
      setGeneratedImage(null);
      setVisualizationGuide(null);
    }
  };

  const handleGenerate = async () => {
    if (!userImage || !selectedProduct) return;
    setStatus('loading');
    setGeneratedImage(null);
    setVisualizationGuide(null);
    
    const result = await tryOnVirtual(userImage, selectedProduct.image);
    
    if (result) {
      if (result.type === 'image') {
        setGeneratedImage(result.data);
        setStatus('success');
      } else if (result.type === 'guide') {
        setVisualizationGuide(result.data);
        setStatus('success');
      }
    } else {
      setStatus('error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900">Virtual Try-On</h2>
        <p className="mt-2 text-gray-600">Upload a photo to see how our products look on you.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Step 1: Inputs */}
        <div className="space-y-8">
          
          {/* Product Selection */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">1. Select Product</h3>
             <div className="flex overflow-x-auto space-x-4 pb-4 no-scrollbar">
                {products.map(p => (
                    <div 
                        key={p.id} 
                        className={`flex-shrink-0 w-32 cursor-pointer transition-all ${selectedProduct?.id === p.id ? 'ring-2 ring-rose-500 rounded-xl' : 'opacity-70'}`}
                        onClick={() => setSelectedProduct(p)}
                    >
                         <img src={p.image} className="w-32 h-40 object-cover rounded-lg mb-2" alt={p.name} />
                         <p className="text-xs font-medium truncate">{p.name}</p>
                    </div>
                ))}
             </div>
          </div>

          {/* User Photo */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">2. Upload Your Photo</h3>
            <div 
                className="border-2 border-dashed border-rose-200 rounded-xl h-64 flex flex-col items-center justify-center cursor-pointer hover:bg-rose-50 transition-colors bg-gray-50 relative overflow-hidden"
                onClick={() => fileInputRef.current?.click()}
            >
                {userImagePreview ? (
                    <img src={userImagePreview} className="w-full h-full object-contain" alt="User upload" />
                ) : (
                    <>
                        <Upload className="w-10 h-10 text-rose-300 mb-2" />
                        <p className="text-sm text-gray-500">Click to upload full-body photo</p>
                    </>
                )}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!selectedProduct || !userImage || status === 'loading'}
            className="w-full py-4 bg-rose-600 text-white rounded-xl font-bold shadow-lg hover:bg-rose-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex justify-center items-center"
          >
            {status === 'loading' ? (
                <>
                    <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                    Generating Preview...
                </>
            ) : (
                'Try It On'
            )}
          </button>
        </div>

        {/* Step 2: Output */}
        <div className="bg-white rounded-2xl shadow-lg border border-rose-100 p-8 flex flex-col items-center justify-center min-h-[600px] relative">
            <h3 className="absolute top-6 left-6 text-lg font-semibold text-gray-800">Preview</h3>
            
            {generatedImage ? (
                <div className="relative w-full h-full flex flex-col items-center">
                    <img src={generatedImage} alt="Try On Result" className="max-h-[550px] rounded-lg shadow-md object-contain" />
                    <span className="mt-4 text-xs text-rose-500 font-medium bg-rose-50 px-3 py-1 rounded-full">AI Generated Preview</span>
                </div>
            ) : visualizationGuide ? (
                <div className="w-full h-full overflow-y-auto pt-12">
                    <div className="bg-gradient-to-br from-rose-50 to-white rounded-lg p-6 border border-rose-200">
                        <div className="flex items-center mb-4 text-rose-600">
                            <FileText className="w-6 h-6 mr-2" />
                            <h4 className="font-bold text-lg">Visualization Description</h4>
                        </div>
                        <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap mb-6">
                            {visualizationGuide}
                        </div>
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-800">
                                <strong>Note:</strong> Image generation is temporarily unavailable. This description shows how the outfit would look. Try again later for visual preview.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center text-gray-400">
                    <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Camera className="w-10 h-10 text-rose-300" />
                    </div>
                    <p className="max-w-xs mx-auto">Select a product and upload your photo to generate a virtual try-on preview.</p>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default VirtualTryOn;
