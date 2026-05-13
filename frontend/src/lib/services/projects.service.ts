import api from '../api';

export const ProjectsService = {
  // Get paginated projects catalog with filters
  findAll: async (filters: any) => {
    const params = new URLSearchParams(filters).toString();
    const { data } = await api.get(`/api/projects?${params}`);
    return data;
  },

  // Get project by ID
  findOne: async (id: string) => {
    const { data } = await api.get(`/api/projects/${id}`);
    return data;
  },

  // Create new project (draft)
  create: async (projectData: any) => {
    const { data } = await api.post('/api/projects', projectData);
    return data;
  },

  // Update project status (e.g. DRAFT -> OPEN)
  updateStatus: async (id: string, status: string) => {
    const { data } = await api.patch(`/api/projects/${id}/status`, { status });
    return data;
  },

  // Get logged-in client's projects
  findMyProjects: async (status?: string) => {
    const params = status ? `?status=${status}` : '';
    const { data } = await api.get(`/api/projects/my${params}`);
    return data;
  },

  // Accept a proposal
  acceptProposal: async (proposalId: string) => {
    const { data } = await api.post(`/api/proposals/${proposalId}/accept`);
    return data;
  }
};
