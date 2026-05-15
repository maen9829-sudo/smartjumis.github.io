'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { FreelancersService } from '@/lib/services/freelancers.service';

export default function FreelancerProfilePage() {
  const { id } = useParams();
  const [freelancer, setFreelancer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFreelancer = async () => {
      try {
        const data = await FreelancersService.findOne(id as string);
        setFreelancer(data);
      } catch (err) {
        setError('Failed to load freelancer profile');
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchFreelancer();
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse flex items-center gap-6 mb-8">
          <div className="h-24 w-24 bg-slate-200 rounded-full"></div>
          <div className="space-y-4 flex-1">
            <div className="h-8 bg-slate-200 rounded w-1/3"></div>
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !freelancer) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-slate-500">
        {error || 'Freelancer not found'}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Profile Header */}
        <div className="p-8 border-b border-slate-200 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-4xl shrink-0">
            {freelancer.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-3xl font-bold text-slate-900">{freelancer.name}</h1>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
              <svg className="h-5 w-5 text-amber-500 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-medium text-slate-700">{freelancer.rating || '5.0'}</span>
              <span className="text-slate-400">({freelancer.reviewsCount || 0} reviews)</span>
            </div>
            {freelancer.bio && (
              <p className="mt-4 text-slate-600 leading-relaxed max-w-2xl">
                {freelancer.bio}
              </p>
            )}
          </div>
        </div>

        {/* Skills Section */}
        {freelancer.skills && freelancer.skills.length > 0 && (
          <div className="p-8 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Skills & Expertise</h3>
            <div className="flex flex-wrap gap-2">
              {freelancer.skills.map((skill: any) => (
                <span key={skill.id} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium">
                  {skill.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="p-8 bg-slate-50">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Recent Reviews</h3>
          {freelancer.reviews && freelancer.reviews.length > 0 ? (
            <div className="space-y-6">
              {freelancer.reviews.map((review: any) => (
                <div key={review.id} className="bg-white p-6 rounded-lg border border-slate-200">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-slate-900">{review.client?.name || 'Anonymous Client'}</div>
                    <div className="flex text-amber-500">
                      {[...Array(review.rating)].map((_, i) => (
                        <svg key={i} className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-600 text-sm">{review.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 italic">No reviews yet.</p>
          )}
        </div>

      </div>
    </div>
  );
}
