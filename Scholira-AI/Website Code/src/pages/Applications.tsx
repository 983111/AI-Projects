import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { geminiService } from '../lib/gemini';
import { Plus, MoreHorizontal, FileText, Calendar, Sparkles, X, Loader2, Copy, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';

export default function Applications() {
  const { applications, addApplication, updateApplicationStatus, userProfile } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newApp, setNewApp] = useState({ collegeName: '', deadline: '' });
  
  // Essay Drafting State
  const [draftingAppId, setDraftingAppId] = useState<string | null>(null);
  const [essayTopic, setEssayTopic] = useState('');
  const [generatedEssay, setGeneratedEssay] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addApplication({
      id: crypto.randomUUID(),
      collegeName: newApp.collegeName,
      deadline: newApp.deadline,
      status: 'researching',
      notes: ''
    });
    setNewApp({ collegeName: '', deadline: '' });
    setIsAdding(false);
  };

  const handleDraftEssay = async () => {
    if (!essayTopic) return;
    setIsGenerating(true);
    try {
      const draft = await geminiService.draftEssay(essayTopic, userProfile);
      setGeneratedEssay(draft || "Failed to generate draft.");
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedEssay);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const columns = [
    { id: 'researching', label: 'Researching', color: 'bg-slate-100 border-slate-200' },
    { id: 'essay-drafting', label: 'Drafting Essays', color: 'bg-blue-50 border-blue-100' },
    { id: 'submitted', label: 'Submitted', color: 'bg-emerald-50 border-emerald-100' },
  ];

  return (
    <div className="h-[calc(100vh-8rem)] relative">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Applications</h1>
          <p className="text-slate-500 mt-1">Track your college application progress.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors font-medium shadow-sm"
        >
          <Plus size={18} />
          Add College
        </button>
      </div>

      {/* Add Application Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl w-96 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold mb-4">Add New Application</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">College Name</label>
                <input 
                  value={newApp.collegeName}
                  onChange={(e) => setNewApp({...newApp, collegeName: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                  placeholder="e.g. Stanford University"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Deadline</label>
                <input 
                  type="date"
                  value={newApp.deadline}
                  onChange={(e) => setNewApp({...newApp, deadline: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Essay Drafting Modal */}
      {draftingAppId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sparkles className="text-emerald-500" size={20} />
                <h3 className="text-lg font-bold">AI Essay Drafter</h3>
              </div>
              <button onClick={() => { setDraftingAppId(null); setGeneratedEssay(''); setEssayTopic(''); }} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {!generatedEssay ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">What is the essay prompt?</label>
                    <textarea 
                      value={essayTopic}
                      onChange={(e) => setEssayTopic(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none h-32 resize-none"
                      placeholder="e.g., Describe a topic, idea, or concept you find so engaging that it makes you lose all track of time..."
                    />
                  </div>
                  <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-700">
                    The AI will use your profile (Major: {userProfile.major}, Achievements, etc.) to personalize this draft.
                  </div>
                </div>
              ) : (
                <div className="prose prose-slate max-w-none">
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-sm leading-relaxed whitespace-pre-wrap">
                    <ReactMarkdown>{generatedEssay}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
              {!generatedEssay ? (
                <button 
                  onClick={handleDraftEssay}
                  disabled={isGenerating || !essayTopic}
                  className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                  {isGenerating ? 'Drafting...' : 'Generate Draft'}
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => { setGeneratedEssay(''); }}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Try Again
                  </button>
                  <button 
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl hover:bg-slate-800 transition-colors font-medium"
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                    {copied ? 'Copied!' : 'Copy to Clipboard'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6 h-full overflow-x-auto pb-4">
        {columns.map((col) => (
          <div key={col.id} className={cn("rounded-xl border p-4 flex flex-col h-full", col.color)}>
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center justify-between">
              {col.label}
              <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs text-slate-500">
                {applications.filter(a => a.status === col.id).length}
              </span>
            </h3>
            
            <div className="space-y-3 overflow-y-auto flex-1 pr-2">
              {applications
                .filter(app => app.status === col.id)
                .map(app => (
                  <div key={app.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 group cursor-grab active:cursor-grabbing hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-slate-900">{app.collegeName}</h4>
                      <button className="text-slate-300 hover:text-slate-600">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                      <Calendar size={14} />
                      {app.deadline}
                    </div>

                    {col.id === 'essay-drafting' && (
                      <button
                        onClick={() => setDraftingAppId(app.id)}
                        className="w-full mb-3 flex items-center justify-center gap-2 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 py-2 rounded-lg transition-colors border border-purple-100"
                      >
                        <Sparkles size={12} />
                        Draft Essay with AI
                      </button>
                    )}

                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-50">
                      {col.id !== 'submitted' && (
                        <button 
                          onClick={() => updateApplicationStatus(app.id, col.id === 'researching' ? 'essay-drafting' : 'submitted')}
                          className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex-1 text-center"
                        >
                          Move Next →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

