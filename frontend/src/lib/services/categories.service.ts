import api from '../api';

export const CategoriesService = {
  findAll: async () => {
    const { data } = await api.get('/api/categories');
    return data;
  }
};
