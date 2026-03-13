import React from 'react';
import { useStore } from '../store/useStore';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  FileText, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export default function Dashboard() {
  const { userProfile, scholarships, applications } = useStore();
  
  const upcomingDeadlines = [
    ...scholarships.filter(s => s.status !== 'ignored').map(s => ({ ...s, type: 'Scholarship' })),
    ...applications.map(a => ({ ...a, name: a.collegeName, type: 'Application' }))
  ].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
   .slice(0, 5);

  const stats = [
    { 
      label: 'Scholarships Found', 
      value: scholarships.length, 
      icon: GraduationCap, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50' 
    },
    { 
      label: 'Applications Active', 
      value: applications.length, 
      icon: FileText, 
      color: 'text-purple-600', 
      bg: 'bg-purple-50' 
    },
    { 
      label: 'Essays Drafted', 
      value: applications.filter(a => a.status === 'essay-drafting' || a.status === 'submitted').length, 
      icon: CheckCircle2, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50' 
    },
  ];

  if (!userProfile.name) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4">Welcome to ScholarShip AI</h1>
        <p className="text-slate-500 mb-8">Let's get started by setting up your profile.</p>
        <Link 
          to="/profile" 
          className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-700 transition-colors"
        >
          Create Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {userProfile.name.split(' ')[0]}</h1>
          <p className="text-slate-500 mt-1">Here's what's happening with your applications today.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">Current GPA</p>
          <p className="text-2xl font-bold text-slate-900">{userProfile.gpa}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
              <stat.icon className={stat.color} size={24} />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Clock size={20} className="text-slate-400" />
            Upcoming Deadlines
          </h2>
          <div className="space-y-4">
            {upcomingDeadlines.length === 0 ? (
              <p className="text-slate-400 text-sm">No upcoming deadlines.</p>
            ) : (
              upcomingDeadlines.map((item: any, i) => (
                <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                  <div>
                    <p className="font-medium text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-emerald-600">{item.deadline}</p>
                    {/* Simple logic to show 'Due soon' */}
                    <p className="text-xs text-slate-400">
                      {Math.ceil((new Date(item.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
              <TrendingUp size={20} className="text-emerald-400" />
              AI Insight
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              Based on your profile, you have a strong chance with STEM-focused scholarships. 
              Consider drafting your "Why Major" essay early to reuse content across applications.
            </p>
            <Link 
              to="/chat" 
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-500 transition-colors"
            >
              Consult AI Agent
            </Link>
          </div>
          
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -ml-10 -mb-10"></div>
        </div>
      </div>
    </div>
  );
}
