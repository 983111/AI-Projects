import React from 'react';
import { useForm } from 'react-hook-form';
import { useStore } from '../store/useStore';
import { Save } from 'lucide-react';

export default function Profile() {
  const { userProfile, updateProfile } = useStore();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: userProfile
  });

  const onSubmit = (data: any) => {
    updateProfile({
      ...data,
      interests: data.interests.split(',').map((i: string) => i.trim())
    });
    alert('Profile updated! The AI agent will now use this for matching.');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Student Profile</h1>
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input 
                {...register("name", { required: true })}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Target Major</label>
              <input 
                {...register("major", { required: true })}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                placeholder="Computer Science"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">GPA (4.0 Scale)</label>
              <input 
                {...register("gpa", { required: true })}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                placeholder="3.8"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">SAT Score</label>
              <input 
                {...register("satScore")}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                placeholder="1450"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ACT Score</label>
              <input 
                {...register("actScore")}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                placeholder="32"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Demographics / Background</label>
            <textarea 
              {...register("demographics")}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none h-24 resize-none"
              placeholder="e.g., First-generation college student, Hispanic, Female, from rural area..."
            />
            <p className="text-xs text-slate-500 mt-1">Used for finding specific minority or background-based scholarships.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Key Achievements & Honors</label>
            <textarea 
              {...register("achievements")}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none h-24 resize-none"
              placeholder="e.g., Debate Club President, State Math Champion, Volunteer at local shelter..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Interests & Hobbies (Comma separated)</label>
            <input 
              {...register("interests")}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              placeholder="Robotics, Painting, Soccer, Coding"
            />
          </div>

          <div className="pt-4">
            <button 
              type="submit"
              className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-sm"
            >
              <Save size={18} />
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
