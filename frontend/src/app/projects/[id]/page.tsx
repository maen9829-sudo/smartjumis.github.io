'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { ProjectsService } from '@/lib/services/projects.service';
import { ProposalsService } from '@/lib/services/proposals.service';

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  
  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Proposal form state
  const [isApplying, setIsApplying] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [proposedPrice, setProposedPrice] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const data = await ProjectsService.findOne(id as string);
        setProject(data);
      } catch (err) {
        setError('Failed to load project details');
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchProject();
  }, [id]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    setIsApplying(true);
    setSubmitError('');

    try {
      await ProposalsService.create(id as string, {
        coverLetter,
        proposedPrice: Number(proposedPrice),
      });
      setSubmitSuccess(true);
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Failed to submit proposal');
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-3/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="h-32 bg-slate-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-slate-500">
        {error || 'Project not found'}
      </div>
    );
  }

  const isClient = user?.role === 'CLIENT';
  const isFreelancer = user?.role === 'FREELANCER';
  const isOwner = project.client?.id === user?.id;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-slate-200">
          <div className="flex justify-between items-start">
            <h1 className="text-3xl font-bold text-slate-900">{project.title}</h1>
            <div className="text-2xl font-bold text-green-600">${project.budget}</div>
          </div>
          <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
            <span>Posted by: {project.client?.name || 'Unknown'}</span>
            <span>•</span>
            <span className="capitalize text-indigo-600 font-medium bg-indigo-50 px-2 py-1 rounded">
              {project.status.toLowerCase()}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-8 space-y-8">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Description</h3>
            <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
              {project.description}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Required Skills</h3>
            <div className="flex flex-wrap gap-2">
              {project.skillsRequired?.map((skill: string) => (
                <span key={skill} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Apply Section */}
        {isFreelancer && project.status === 'OPEN' && (
          <div className="bg-slate-50 p-8 border-t border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Submit a Proposal</h3>
            
            {submitSuccess ? (
              <div className="bg-green-50 text-green-700 p-6 rounded-lg border border-green-200 text-center">
                <h4 className="font-bold text-lg mb-2">Proposal Submitted Successfully!</h4>
                <p>The client will review your application soon.</p>
              </div>
            ) : (
              <form onSubmit={handleApply} className="space-y-6">
                {submitError && (
                  <div className="bg-red-50 text-red-500 p-3 rounded text-sm">{submitError}</div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Proposed Price ($)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="block w-full sm:w-1/3 rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                    value={proposedPrice}
                    onChange={(e) => setProposedPrice(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Cover Letter
                  </label>
                  <textarea
                    required
                    rows={6}
                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 border"
                    placeholder="Why are you the best fit for this project?"
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isApplying}
                  className="w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
                >
                  {isApplying ? 'Submitting...' : 'Submit Proposal'}
                </button>
              </form>
            )}
          </div>
        )}

        {!isAuthenticated && (
          <div className="bg-slate-50 p-8 border-t border-slate-200 text-center">
            <p className="text-slate-600 mb-4">You must be logged in as a freelancer to apply.</p>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Log In to Apply
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
