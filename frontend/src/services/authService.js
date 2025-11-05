import { api } from './api';

export const authService = {
  register: async (email, password, fullName = '') => {
    const response = await api.post('/auth/register', {
      email,
      password,
      full_name: fullName,
    });
    return response.data;
  },
  
  login: async (email, password) => {
    const response = await api.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  },
  
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.warn('Déconnexion côté serveur échouée');
    }
    localStorage.removeItem('token');
  },
  
  validateToken: async () => {
    try {
      await api.get('/auth/me');
      return true;
    } catch (error) {
      return false;
    }
  },
};