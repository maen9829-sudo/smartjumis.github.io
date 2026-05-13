import api from '../api';

export const FreelancersService = {
  // Get paginated catalog of freelancers
  findAll: async (filters: any) => {
    const params = new URLSearchParams(filters).toString();
    const { data } = await api.get(`/api/freelancers?${params}`);
    return data;
  },

  // Get top rated freelancers for homepage
  findFeatured: async () => {
    const { data } = await api.get('/api/freelancers/featured');
    return data;
  },

  // Get full public profile of a freelancer
  findOne: async (id: string) => {
    const { data } = await api.get(`/api/freelancers/${id}`);
    return data;
  }
};
