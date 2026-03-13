import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { geminiService } from '../lib/gemini';
import { Search, ExternalLink, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Scholarships() {
  const { scholarships, addScholarship, userProfile, updateScholarshipStatus } = useStore();
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!userProfile.gpa || !userProfile.major) {
      alert("Please complete your profile first!");
      return;
    }
    
    setLoading(true);
    try {
      const results = await geminiService.findScholarships(userProfile);
      results.forEach((s: any) => {
        // Avoid duplicates based on name
        if (!scholarships.find(existing => existing.name === s.name)) {
          addScholarship({ ...s, id: crypto.randomUUID(), status: 'new' });
        }
      });
    } catch (error) {
      console.error(error);
      alert("Failed to find scholarships. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Scholarship Search</h1>
          <p className="text-slate-500 mt-1">AI-matched opportunities based on your profile.</p>
        </div>
        <button 
          onClick={handleSearch}
          disabled={loading}
          className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-sm disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
          {loading ? 'Scraping...' : 'Find Matches'}
        </button>
      </div>

      <div className="grid gap-4">
        {scholarships.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
            <Search className="mx-auto text-slate-300 mb-4" size={48} />
            <h3 className="text-lg font-medium text-slate-900">No scholarships found yet</h3>
            <p className="text-slate-500">Complete your profile and click "Find Matches" to start.</p>
          </div>
        ) : (
          scholarships.map((scholarship) => (
            <div key={scholarship.id} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold text-slate-900">{scholarship.name}</h3>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      scholarship.matchScore >= 80 ? "bg-emerald-100 text-emerald-700" :
                      scholarship.matchScore >= 50 ? "bg-yellow-100 text-yellow-700" :
                      "bg-slate-100 text-slate-600"
                    )}>
                      {scholarship.matchScore}% Match
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm mb-4">{scholarship.requirements}</p>
                  
                  <div className="flex gap-6 text-sm text-slate-600">
                    <div className="font-medium text-emerald-600">{scholarship.amount}</div>
                    <div>Due: {scholarship.deadline}</div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <a 
                    href={scholarship.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <ExternalLink size={20} />
                  </a>
                  <button 
                    onClick={() => updateScholarshipStatus(scholarship.id, 'applied')}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      scholarship.status === 'applied' ? "text-emerald-600 bg-emerald-50" : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                    )}
                    title="Mark as Applied"
                  >
                    <CheckCircle size={20} />
                  </button>
                  <button 
                    onClick={() => updateScholarshipStatus(scholarship.id, 'ignored')}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Ignore"
                  >
                    <XCircle size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
