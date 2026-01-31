import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { api } from '../services/api';

export const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Chargement utilisateur au montage (restauration session JWT)
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await api.get('/auth/me');
        setCurrentUser(response.data);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Erreur de chargement utilisateur:', error);
        // Token expiré/invalide → nettoyage
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);
  
  // Inscription avec connexion automatique (retourne token immédiatement)
  const register = async (email, password, fullName = '') => {
    try {
      const response = await authService.register(email, password, fullName);
      
      const { access_token, user } = response;
      localStorage.setItem('token', access_token);
      
      setCurrentUser(user);
      setIsAuthenticated(true);
      
      return user;
    } catch (error) {
      throw error;
    }
  };
  
  // Connexion double usage : classique (email/pass) ou OAuth (token direct)
  const login = async (emailOrToken, password = null) => {
    try {
      // Mode OAuth : token passé directement (callback Google)
      if (password === null) {
        localStorage.setItem('token', emailOrToken);
        
        const response = await api.get('/auth/me');
        setCurrentUser(response.data);
        setIsAuthenticated(true);
        return response.data;
      }
      
      // Mode classique : email + password
      const response = await authService.login(emailOrToken, password);
      
      const { access_token, user } = response;
      localStorage.setItem('token', access_token);
      
      setCurrentUser(user);
      setIsAuthenticated(true);
      
      return user;
    } catch (error) {
      throw error;
    }
  };
  
  const logout = async () => {
    await authService.logout();
    setCurrentUser(null);
    setIsAuthenticated(false);
  };
  
  // Rechargement profil utilisateur (après update quota, settings, etc.)
  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setCurrentUser(response.data);
      return response.data;
    } catch (error) {
      throw error;
    }
  };
  
  // Valeur contexte exposée à toute l'app
  const value = {
    user: currentUser,
    isAuthenticated,
    loading,
    register,
    login,
    logout,
    refreshUser
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};