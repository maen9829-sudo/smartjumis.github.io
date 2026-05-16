'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { ProjectsService } from '@/lib/services/projects.service';
import { ProposalsService } from '@/lib/services/proposals.service';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Wait until auth is resolved
    if (authLoading) return;
    
    // If not authenticated, let the AuthProvider or router handle redirect
    if (!isAuthenticated || !user) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (user.role === 'CLIENT') {
          // Fetch client's projects
          const res = await ProjectsService.findMyProjects();
          setData(res.data || res);
        } else if (user.role === 'FREELANCER') {
          // Fetch freelancer's proposals
          const res = await ProposalsService.findMyProposals();
          setData(res.data || res);
        }
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, isAuthenticated, authLoading]);

  if (authLoading || isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4 mb-8"></div>
          <div className="h-24 bg-slate-200 rounded w-full"></div>
          <div className="h-24 bg-slate-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null; // handled by redirect

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">
            Welcome back, {user?.name}. You are logged in as a <span className="font-semibold text-indigo-600">{user?.role}</span>.
          </p>
        </div>
        {user?.role === 'CLIENT' && (
          <Link href="/projects/new" className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors">
            Post New Project
          </Link>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-md mb-6">{error}</div>
      )}

      {/* Client View: My Projects */}
      {user?.role === 'CLIENT' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-slate-900 border-b border-slate-200 pb-2">My Posted Projects</h2>
          {data.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
              <p className="text-slate-500 mb-4">You haven't posted any projects yet.</p>
              <Link href="/projects/new" className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                Post your first project
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {data.map((project) => (
                <div key={project.id} className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <Link href={`/projects/${project.id}`} className="text-lg font-semibold text-slate-900 hover:text-indigo-600 transition-colors">
                      {project.title}
                    </Link>
                    <div className="flex gap-3 mt-2 text-sm text-slate-500">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">
                        {project.status}
                      </span>
                      <span>Budget: ${project.budget}</span>
                      <span>{project.proposals?.length || 0} proposals</span>
                    </div>
                  </div>
                  <Link href={`/projects/${project.id}/proposals`} className="inline-block text-indigo-600 font-medium hover:text-indigo-800 text-sm bg-indigo-50 px-4 py-2 rounded-md">
                    View Proposals
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Freelancer View: My Proposals */}
      {user?.role === 'FREELANCER' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-slate-900 border-b border-slate-200 pb-2">My Applications</h2>
          {data.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
              <p className="text-slate-500 mb-4">You haven't applied to any projects yet.</p>
              <Link href="/projects" className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                Find Work
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {data.map((proposal) => (
                <div key={proposal.id} className="bg-white p-6 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {proposal.project?.title || 'Project deleted'}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">
                        Applied on {new Date(proposal.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      proposal.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                      proposal.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {proposal.status}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-md">
                    <div className="flex justify-between text-sm font-medium mb-2 text-slate-700">
                      <span>Proposed Price:</span>
                      <span className="text-green-600">${proposal.proposedPrice}</span>
                    </div>
                    <p className="text-sm text-slate-600 italic line-clamp-2">
                      "{proposal.coverLetter}"
                    </p>
                  </div>
                  {proposal.project && (
                    <div className="mt-4 text-right">
                      <Link href={`/projects/${proposal.project.id}`} className="text-sm text-indigo-600 font-medium hover:underline">
                        View Project →
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
