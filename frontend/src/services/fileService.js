import { api } from './api';
import { API_URL } from '../config';


export const fileService = {
  
  getFiles: async (folderId = null) => {
    try {
      const response = await api.get('/files/', {
        params: { folder_id: folderId }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des fichiers:', error);
      throw error;
    }
  },

  getFileDetails: async (fileId) => {
    try {
      const response = await api.get(`/files/${fileId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des détails du fichier:', error);
      throw error;
    }
  },

  uploadFile: async (file, folderId = null, onProgress) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (folderId) {
        formData.append('folder_id', folderId);
      }
      
      const response = await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors du téléversement du fichier:', error);
      throw error;
    }
  },

  renameFile: async (fileId, newName) => {
    try {
      const response = await api.put(`/files/${fileId}`, {
        name: newName
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors du renommage du fichier:', error);
      throw error;
    }
  },

  moveFile: async (fileId, newFolderId) => {
    try {
      const response = await api.put(`/files/${fileId}`, {
        folder_id: newFolderId
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors du déplacement du fichier:', error);
      throw error;
    }
  },

  deleteFile: async (fileId, permanent = false) => {
    try {
      const response = await api.delete(`/files/${fileId}`, {
        params: { permanent }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
      throw error;
    }
  },

  restoreFile: async (fileId) => {
    try {
      const response = await api.post(`/files/${fileId}/restore`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la restauration du fichier:', error);
      throw error;
    }
  },

  downloadFile: (fileId) => {
    try {
      
      const downloadUrl = `${API_URL}/files/${fileId}/download`;
      console.log("Téléchargement depuis:", downloadUrl);
      window.open(downloadUrl, '_blank');
      return true;
    } catch (error) {
      console.error('Erreur lors du téléchargement du fichier:', error);
      return false;
    }
  },

  
  getFolders: async (parentId = null) => {
    try {
      const response = await api.get('/folders/', {
        params: { parent_id: parentId }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des dossiers:', error);
      throw error;
    }
  },

  getFolderDetails: async (folderId) => {
    try {
      const response = await api.get(`/folders/${folderId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des détails du dossier:', error);
      throw error;
    }
  },

  createFolder: async (name, parentId = null) => {
    try {
      const response = await api.post('/folders/', {
        name,
        parent_id: parentId
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du dossier:', error);
      throw error;
    }
  },

  renameFolder: async (folderId, newName) => {
    try {
      const response = await api.put(`/folders/${folderId}`, {
        name: newName
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors du renommage du dossier:', error);
      throw error;
    }
  },

  moveFolder: async (folderId, newParentId) => {
    try {
      const response = await api.put(`/folders/${folderId}`, {
        parent_id: newParentId
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors du déplacement du dossier:', error);
      throw error;
    }
  },

  deleteFolder: async (folderId, permanent = false) => {
    try {
      const response = await api.delete(`/folders/${folderId}`, {
        params: { permanent, recursive: true }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression du dossier:', error);
      throw error;
    }
  },

  restoreFolder: async (folderId) => {
    try {
      const response = await api.post(`/folders/${folderId}/restore`, {
        params: { recursive: true }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la restauration du dossier:', error);
      throw error;
    }
  },

  downloadFolder: (folderId) => {
    try {
      
      const downloadUrl = `${API_URL}/folders/${folderId}/download`;
      console.log("Téléchargement du dossier depuis:", downloadUrl);
      window.open(downloadUrl, '_blank');
      return true;
    } catch (error) {
      console.error('Erreur lors du téléchargement du dossier:', error);
      return false;
    }
  },

  
  createShare: async (fileId, expiresAt = null) => {
    try {
      const response = await api.post(`/shares/${fileId}`, {
        expires_at: expiresAt
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du lien de partage:', error);
      throw error;
    }
  },

  getShares: async (fileId = null) => {
    try {
      const response = await api.get('/shares/', {
        params: { file_id: fileId }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des liens de partage:', error);
      throw error;
    }
  },

  deleteShare: async (shareId) => {
    try {
      const response = await api.delete(`/shares/${shareId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression du lien de partage:', error);
      throw error;
    }
  },

  
  searchItems: async (searchTerm, folderId = null) => {
    try {
      const response = await api.get('/search', {
        params: { q: searchTerm, folder_id: folderId }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      throw error;
    }
  },

  
  getTrashedFiles: async () => {
    try {
      
      const response = await api.get('/files/', {
        params: { show_deleted: true }
      });
      
      return response.data.filter(file => file.is_deleted === true);
    } catch (error) {
      console.error('Erreur lors de la récupération des fichiers supprimés:', error);
      throw error;
    }
  },

  getTrashedFolders: async () => {
    try {
      
      const response = await api.get('/folders/', {
        params: { show_deleted: true }
      });
      
      return response.data.filter(folder => folder.is_deleted === true);
    } catch (error) {
      console.error('Erreur lors de la récupération des dossiers supprimés:', error);
      throw error;
    }
  },

  emptyTrash: async () => {
  try {
    const trashedFiles = await fileService.getTrashedFiles();
    for (const file of trashedFiles) {
      await fileService.deleteFile(file.id, true); 
    }
    
    const trashedFolders = await fileService.getTrashedFolders();
    for (const folder of trashedFolders) {
      await fileService.deleteFolder(folder.id, true); 
    }
    
    return { message: 'Corbeille vidée avec succès' };
  } catch (error) {
    console.error('Erreur lors du vidage de la corbeille:', error);
    throw error;
  }
}
};