'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FreelancersService } from '@/lib/services/freelancers.service';

export default function FreelancersCatalog() {
  const [freelancers, setFreelancers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFreelancers = async () => {
      try {
        const data = await FreelancersService.findAll({ limit: 50 });
        setFreelancers(data.data || data);
      } catch (err) {
        setError('Failed to load freelancers');
      } finally {
        setIsLoading(false);
      }
    };
    fetchFreelancers();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 border-b border-slate-200 pb-5 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold leading-tight text-slate-900">Hire Top Talent</h1>
          <p className="mt-2 text-sm text-slate-500">
            Browse through our highly-rated freelancers and find the perfect match for your project.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white p-6 rounded-xl border border-slate-200 h-24"></div>
          ))}
        </div>
      ) : freelancers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
          <p className="text-slate-500">No freelancers found.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {freelancers.map((freelancer) => (
            <Link key={freelancer.id} href={`/freelancers/${freelancer.id}`}>
              <div className="group bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer h-full flex flex-col items-center text-center">
                <div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-3xl mb-4">
                  {freelancer.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <h2 className="text-xl font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {freelancer.name}
                </h2>
                <div className="flex items-center gap-1 mt-2 text-amber-500">
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm font-medium text-slate-700">{freelancer.rating || '5.0'}</span>
                  <span className="text-sm text-slate-400 ml-1">({freelancer.reviewsCount || 0} reviews)</span>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-6 justify-center">
                  {freelancer.skills?.slice(0, 3).map((skill: any) => (
                    <span key={skill.id} className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
