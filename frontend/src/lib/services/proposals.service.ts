import api from '../api';

export const ProposalsService = {
  // Submit a new proposal
  create: async (projectId: string, payload: { coverLetter: string; proposedPrice: number }) => {
    const { data } = await api.post(`/api/proposals/${projectId}`, payload);
    return data;
  },

  // Get proposals for a specific project (Client only)
  findByProject: async (projectId: string) => {
    const { data } = await api.get(`/api/proposals/project/${projectId}`);
    return data;
  },

  // Get current freelancer's submitted proposals
  findMyProposals: async () => {
    const { data } = await api.get('/api/proposals/my');
    return data;
  }
};
