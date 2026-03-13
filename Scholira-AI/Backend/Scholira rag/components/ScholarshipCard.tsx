import React from 'react';

export interface Scholarship {
  name: string;
  provider: string;
  amount: string;
  deadline: string;
  description: string;
  eligibility: string[];
  location: string;
  matchScore?: number;
  matchReasons?: string[];
  tags?: string[];
}

export const ScholarshipCard: React.FC<{ scholarship: Scholarship }> = ({ scholarship }) => {
  const score = scholarship.matchScore ?? 0;

  // Color the match bar based on score
  const barColor =
    score >= 70 ? "bg-emerald-500" :
    score >= 45 ? "bg-amber-500" :
    "bg-slate-300";

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 flex flex-col h-full group">
      <div className="p-6 flex-1">
        {/* Header row */}
        <div className="flex justify-between items-start mb-4">
          <div className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 max-w-[65%] truncate">
            {scholarship.provider}
          </div>
          <span className="text-xs text-slate-500 font-medium flex items-center flex-shrink-0 ml-2">
            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {scholarship.location}
          </span>
        </div>

        {/* Match Score Bar */}
        {scholarship.matchScore !== undefined && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-500">Profile Match</span>
              <span className={`text-xs font-bold ${score >= 70 ? 'text-emerald-600' : score >= 45 ? 'text-amber-600' : 'text-slate-400'}`}>
                {score}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${Math.min(score, 100)}%` }}
              />
            </div>
          </div>
        )}

        <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-indigo-700 transition-colors line-clamp-2">
          {scholarship.name}
        </h3>

        <div className="mb-5">
          <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">{scholarship.description}</p>
        </div>

        {/* Amount / Deadline */}
        <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t border-slate-50">
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Value</p>
            <p className="text-sm font-medium text-slate-800">{scholarship.amount}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Deadline</p>
            <p className="text-sm font-medium text-red-600">{scholarship.deadline}</p>
          </div>
        </div>

        {/* Eligibility Tags */}
        {scholarship.eligibility && scholarship.eligibility.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {scholarship.eligibility.slice(0, 3).map((item, idx) => (
              <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs text-slate-600 bg-slate-50 border border-slate-100">
                {item}
              </span>
            ))}
          </div>
        )}

        {/* Match Reasons (RAG output) */}
        {scholarship.matchReasons && scholarship.matchReasons.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {scholarship.matchReasons.slice(0, 3).map((r, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700 border border-emerald-100">
                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                {r}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-xl flex justify-between items-center group-hover:bg-indigo-50/30 transition-colors">
        <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
          <svg className="w-3 h-3 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          RAG Matched
        </span>
        <a
          href={`https://www.google.com/search?q=${encodeURIComponent(`${scholarship.name} ${scholarship.provider} scholarship official site`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center transition-colors"
        >
          View Program
          <svg className="ml-1.5 h-4 w-4 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>
      </div>
    </div>
  );
};
