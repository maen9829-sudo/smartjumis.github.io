import api from '../api';

export const AiService = {
  // Enhance project description
  enhanceProject: async (title: string, description: string) => {
    const { data } = await api.post('/api/ai/enhance-project', { title, description });
    return data; // { enhancedTitle, enhancedDescription, suggestedSkills }
  },

  // Suggest category
  suggestCategory: async (title: string, description: string) => {
    const { data } = await api.post('/api/ai/suggest-category', { title, description });
    return data; // { suggestedSlug }
  },

  // Match top freelancers for a project
  matchFreelancers: async (projectId: string) => {
    const { data } = await api.get(`/api/ai/match-freelancers/${projectId}`);
    return data; // Array of freelancers with matchReason
  }
};
