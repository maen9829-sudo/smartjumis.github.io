'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { ProjectsService } from '@/lib/services/projects.service';
import { CategoriesService } from '@/lib/services/categories.service';
import { useEffect } from 'react';

export default function CreateProjectPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [skills, setSkills] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    CategoriesService.findAll().then(setCategories).catch(console.error);
  }, []);

  if (!isAuthenticated || user?.role !== 'CLIENT') {
    return <div className="p-12 text-center text-slate-500">Unauthorized. Only clients can post projects.</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Create draft project
      const project = await ProjectsService.create({
        title,
        description,
        budget: Number(budget),
        categoryId,
        skills: skills.split(',').map(s => s.trim()).filter(Boolean)
      });
      
      // Auto-publish for MVP
      await ProjectsService.updateStatus(project.id, 'OPEN');
      
      router.push(`/projects/${project.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Post a New Project</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
        {error && <div className="bg-red-50 text-red-500 p-4 rounded-md">{error}</div>}
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Project Title</label>
          <input required type="text" className="w-full border border-slate-300 p-3 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Build a React Native App" />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
          <textarea required rows={5} className="w-full border border-slate-300 p-3 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the scope of work..." />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
          <select required className="w-full border border-slate-300 p-3 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
            <option value="" disabled>Select a category</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Бюджет (KZT)</label>
            <input required type="number" min="5000" className="w-full border border-slate-300 p-3 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" value={budget} onChange={e => setBudget(e.target.value)} placeholder="5000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Необходимые навыки (через запятую)</label>
            <input required type="text" className="w-full border border-slate-300 p-3 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" value={skills} onChange={e => setSkills(e.target.value)} placeholder="React, Node.js, UI/UX" />
          </div>
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors">
          {isSubmitting ? 'Posting...' : 'Post Project'}
        </button>
      </form>
    </div>
  );
}
