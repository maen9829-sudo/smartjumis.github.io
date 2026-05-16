'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { ProposalsService } from '@/lib/services/proposals.service';

export default function ProjectProposalsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [proposals, setProposals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const data = await ProposalsService.findByProject(id as string);
        setProposals(data.data || data);
      } catch (err) {
        console.error('Failed to load proposals', err);
      } finally {
        setIsLoading(false);
      }
    };
    if (user?.role === 'CLIENT') fetchProposals();
  }, [id, user]);

  const handleAccept = async (proposalId: string) => {
    try {
      const result = await ProposalsService.accept(proposalId);
      // Backend transaction returns { order, chatRoom } on success
      alert('Proposal Accepted! Order Created.');
      router.push(`/orders/${result.order.id}`); // Navigate to workspace
    } catch (error) {
      alert('Failed to accept proposal');
    }
  };

  if (isLoading) return <div className="p-12 text-center text-slate-500">Loading proposals...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Review Proposals</h1>
      {proposals.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-300">
          <p className="text-slate-500">No proposals yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {proposals.map(prop => (
            <div key={prop.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">{prop.freelancer?.name || 'Unknown Freelancer'}</h3>
                  <p className="text-sm text-slate-500">Proposed Price: <span className="font-bold text-green-600">${prop.proposedPrice}</span></p>
                </div>
                <button 
                  onClick={() => handleAccept(prop.id)}
                  disabled={prop.status !== 'PENDING'}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-slate-300 text-sm font-medium transition-colors whitespace-nowrap"
                >
                  {prop.status === 'PENDING' ? 'Accept & Hire' : prop.status}
                </button>
              </div>
              <p className="text-slate-700 bg-slate-50 p-4 rounded-md whitespace-pre-wrap border border-slate-100">
                {prop.coverLetter}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
