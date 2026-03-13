import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { SearchForm } from './components/SearchForm';
import { ScholarshipCard } from './components/ScholarshipCard';
import { Footer } from './components/Footer';
import { findScholarships } from './services/gemini';
import { SearchParams, SearchResult } from './types';

function App() {
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'full' | 'partial'>('all');

  const handleSearch = async (params: SearchParams) => {
    setLoading(true);
    setError(null);
    setSearched(true);
    setResult(null);
    setActiveFilter('all');

    try {
      const data = await findScholarships(params);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching scholarships. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredScholarships = result?.scholarships.filter(s => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'full') return s.eligibility?.some(e =>
      e.toLowerCase().includes('full') || s.amount?.toLowerCase().includes('full')
    );
    return true;
  }) ?? [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <Hero />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-16">
        <SearchForm onSearch={handleSearch} isLoading={loading} />

        {error && (
          <div className="mt-8 bg-red-50 border-l-4 border-red-400 p-4 rounded-md shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {searched && !loading && !error && result && (
          <div className="mt-12 animate-fade-in">

            {/* Advisor Note from Gemini (if enabled) */}
            {result.advisorNote && (
              <div className="mb-8 bg-indigo-50 border border-indigo-100 rounded-xl p-5 flex gap-4 items-start">
                <div className="flex-shrink-0 h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-1">AI Advisor Note</p>
                  <p className="text-sm text-indigo-900">{result.advisorNote}</p>
                </div>
              </div>
            )}

            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {result.scholarships.length > 0
                    ? `${result.scholarships.length} Scholarships Found`
                    : "No Results"}
                </h2>
                <p className="text-sm text-slate-500 mt-1">Sorted by profile match score</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 mr-1">Filter:</span>
                {(['all', 'full', 'partial'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeFilter === f
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    {f === 'all' ? 'All' : f === 'full' ? '💰 Full Funding' : '📋 Partial'}
                  </button>
                ))}
                <span className="ml-3 text-xs text-slate-400 bg-white px-3 py-1.5 rounded-full border border-slate-200">
                  RAG Engine
                </span>
              </div>
            </div>

            {/* Stats bar */}
            {result.scholarships.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { label: 'Total Matches', value: result.scholarships.length },
                  { label: 'Avg Match Score', value: `${Math.round(result.scholarships.reduce((a,s) => a + (s.matchScore || 0), 0) / result.scholarships.length)}%` },
                  { label: 'Top Match', value: `${result.scholarships[0]?.matchScore ?? 0}%` },
                ].map(stat => (
                  <div key={stat.label} className="bg-white rounded-lg border border-slate-100 p-4 text-center">
                    <div className="text-xl font-bold text-indigo-600">{stat.value}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Scholarship Grid */}
            {result.scholarships.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredScholarships.map((scholarship, index) => (
                  <ScholarshipCard key={index} scholarship={scholarship} />
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-center">
                <svg className="h-12 w-12 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-slate-500 mb-2 font-medium">No scholarships matched your exact criteria.</p>
                <p className="text-slate-400 text-sm">{result.rawText}</p>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!searched && !loading && (
          <div className="mt-16 text-center">
            <h3 className="text-lg font-medium text-slate-900 mb-2">Why use Scholara?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 max-w-4xl mx-auto">
              <div className="bg-white p-6 rounded-lg border border-slate-100 shadow-sm">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" /></svg>
                </div>
                <h4 className="font-semibold text-slate-800">RAG-Powered</h4>
                <p className="text-sm text-slate-500 mt-2">Local vector search — instant results, no API cost, no hallucinations.</p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-slate-100 shadow-sm">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h4 className="font-semibold text-slate-800">Score Matching</h4>
                <p className="text-sm text-slate-500 mt-2">GPA, IELTS, TOEFL, and SAT filters applied precisely to remove ineligible options.</p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-slate-100 shadow-sm">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h4 className="font-semibold text-slate-800">25+ Scholarships</h4>
                <p className="text-sm text-slate-500 mt-2">Curated database of verified global scholarships for Central & Southeast Asian students.</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
