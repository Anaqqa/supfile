import { api } from './api';

export const userService = {
  getProfile: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },
  
  updateProfile: async (profileData) => {
    const response = await api.put('/users/me', profileData);
    return response.data;
  },
  
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/users/me/password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },
  
  getOAuthConnections: async () => {
    const response = await api.get('/users/me/oauth');
    return response.data;
  },
  
  disconnectOAuth: async (provider) => {
    const response = await api.post('/users/me/oauth/disconnect', {
      provider: provider,
    });
    return response.data;
  }
};