import React, { useState, useRef } from 'react';
import { enhanceProductImage } from '../services/geminiService';
import { LoadingState } from '../types';
import { Wand2, Upload, Download, ArrowRight, Image as ImageIcon, FileText } from 'lucide-react';

const ImageEnhancer: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [previewOriginal, setPreviewOriginal] = useState<string | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [enhancementGuide, setEnhancementGuide] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<LoadingState>('idle');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setOriginalImage(file);
      setPreviewOriginal(URL.createObjectURL(file));
      setEnhancedImage(null);
      setEnhancementGuide(null);
    }
  };

  const handleEnhance = async () => {
    if (!originalImage || !description) return;
    setStatus('loading');
    setEnhancedImage(null);
    setEnhancementGuide(null);
    
    const result = await enhanceProductImage(originalImage, description);
    
    if (result) {
      if (result.type === 'image') {
        setEnhancedImage(result.data);
        setStatus('success');
      } else if (result.type === 'guide') {
        setEnhancementGuide(result.data);
        setStatus('success');
      }
    } else {
      setStatus('error');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
       <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900">AI Studio Enhancer</h2>
        <p className="mt-2 text-gray-600">Turn amateur snaps into professional product photography instantly.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        
        {/* Input Side */}
        <div className="space-y-6">
            <div 
                className="bg-white rounded-2xl border-2 border-dashed border-gray-300 h-80 flex flex-col items-center justify-center cursor-pointer hover:border-rose-400 hover:bg-rose-50 transition-all relative overflow-hidden group"
                onClick={() => fileRef.current?.click()}
            >
                 {previewOriginal ? (
                    <img src={previewOriginal} alt="Original" className="w-full h-full object-contain p-4" />
                 ) : (
                    <div className="text-center p-6">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-rose-100 transition-colors">
                            <Upload className="w-8 h-8 text-gray-400 group-hover:text-rose-500" />
                        </div>
                        <p className="font-medium text-gray-900">Upload raw photo</p>
                        <p className="text-sm text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                    </div>
                 )}
                 <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleUpload} />
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Description</label>
                <textarea 
                    className="w-full border-gray-200 rounded-lg shadow-sm focus:ring-rose-500 focus:border-rose-500 min-h-[100px] resize-none p-3"
                    placeholder="e.g. Handmade ceramic vase with blue patterns..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                ></textarea>
                <button
                    onClick={handleEnhance}
                    disabled={!originalImage || !description || status === 'loading'}
                    className="mt-4 w-full bg-rose-600 text-white py-3 rounded-lg font-semibold shadow hover:bg-rose-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex justify-center items-center"
                >
                     {status === 'loading' ? (
                         <>
                            <Wand2 className="w-5 h-5 animate-spin mr-2" /> Analyzing & Enhancing...
                         </>
                     ) : (
                         <>Enhance Photo <ArrowRight className="w-4 h-4 ml-2" /></>
                     )}
                </button>
            </div>
        </div>

        {/* Output Side */}
        <div className="bg-gradient-to-br from-rose-50 to-white rounded-2xl border border-rose-100 p-8 flex flex-col items-center justify-center relative min-h-[400px]">
            {enhancedImage ? (
                <div className="relative w-full h-full flex flex-col items-center">
                     <img src={enhancedImage} alt="Enhanced" className="max-h-[450px] w-full object-contain rounded-lg shadow-lg mb-4" />
                     <a href={enhancedImage} download="styfi-enhanced.png" className="flex items-center text-rose-600 font-medium hover:text-rose-800">
                        <Download className="w-4 h-4 mr-2" /> Download Studio Quality
                     </a>
                </div>
            ) : enhancementGuide ? (
                <div className="w-full h-full overflow-y-auto">
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                        <div className="flex items-center mb-4 text-rose-600">
                            <FileText className="w-6 h-6 mr-2" />
                            <h3 className="font-bold text-lg">Professional Enhancement Guide</h3>
                        </div>
                        <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                            {enhancementGuide}
                        </div>
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-800">
                                <strong>Note:</strong> Image generation is temporarily unavailable. Use this professional guide to manually enhance your product photos or try again later.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center text-gray-400">
                    <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>Enhanced results will appear here</p>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default ImageEnhancer;
