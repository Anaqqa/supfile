import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { api } from '../services/api';
import { fileService } from '../services/fileService';

export const FileContext = createContext(null);

export const useFileContext = () => useContext(FileContext);

export const FileProvider = ({ children }) => {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  
  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  
  const fetchContents = useCallback(async (folderId = null) => {
    setLoading(true);
    setError(null);

    try {
      
      if (folderId) {
        const folderData = await fileService.getFolderDetails(folderId);
        setCurrentFolder(folderData);
      } else {
        setCurrentFolder(null);
      }

      
      const [filesData, foldersData] = await Promise.all([
        fileService.getFiles(folderId),
        fileService.getFolders(folderId)
      ]);

      setFiles(filesData);
      setFolders(foldersData);
    } catch (err) {
      console.error('Erreur lors du chargement des fichiers/dossiers:', err);
      setError(err.response?.data?.detail || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, []);

  
  const createFolder = useCallback(async (name, parentId = null) => {
    setLoading(true);
    setError(null);

    try {
      await fileService.createFolder(name, parentId);
      refresh();
      return true;
    } catch (err) {
      console.error('Erreur lors de la création du dossier:', err);
      setError(err.response?.data?.detail || 'Erreur lors de la création du dossier');
      return false;
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  
  const renameItem = useCallback(async (itemId, newName, isFolder = false) => {
    setLoading(true);
    setError(null);

    try {
      if (isFolder) {
        await fileService.renameFolder(itemId, newName);
      } else {
        await fileService.renameFile(itemId, newName);
      }
      refresh();
      return true;
    } catch (err) {
      console.error('Erreur lors du renommage:', err);
      setError(err.response?.data?.detail || 'Erreur lors du renommage');
      return false;
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  
  const moveItem = useCallback(async (itemId, newFolderId, isFolder = false) => {
    setLoading(true);
    setError(null);

    try {
      if (isFolder) {
        await fileService.moveFolder(itemId, newFolderId);
      } else {
        await fileService.moveFile(itemId, newFolderId);
      }
      refresh();
      return true;
    } catch (err) {
      console.error('Erreur lors du déplacement:', err);
      setError(err.response?.data?.detail || 'Erreur lors du déplacement');
      return false;
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  
  const deleteItem = useCallback(async (itemId, isFolder = false, permanent = false) => {
    setLoading(true);
    setError(null);

    try {
      if (isFolder) {
        await fileService.deleteFolder(itemId, permanent);
      } else {
        await fileService.deleteFile(itemId, permanent);
      }
      refresh();
      return true;
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError(err.response?.data?.detail || 'Erreur lors de la suppression');
      return false;
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  
  const restoreItem = useCallback(async (itemId, isFolder = false) => {
    setLoading(true);
    setError(null);

    try {
      if (isFolder) {
        await fileService.restoreFolder(itemId);
      } else {
        await fileService.restoreFile(itemId);
      }
      refresh();
      return true;
    } catch (err) {
      console.error('Erreur lors de la restauration:', err);
      setError(err.response?.data?.detail || 'Erreur lors de la restauration');
      return false;
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  
  const downloadFile = useCallback(async (fileId) => {
    try {
      await fileService.downloadFile(fileId);
      return true;
    } catch (err) {
      console.error('Erreur lors du téléchargement du fichier:', err);
      setError(err.response?.data?.detail || 'Erreur lors du téléchargement');
      return false;
    }
  }, []);

  
  const downloadFolder = useCallback(async (folderId) => {
    try {
      await fileService.downloadFolder(folderId);
      return true;
    } catch (err) {
      console.error('Erreur lors du téléchargement du dossier:', err);
      setError(err.response?.data?.detail || 'Erreur lors du téléchargement');
      return false;
    }
  }, []);

  
  const createShareLink = useCallback(async (fileId, expiresAt = null) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fileService.createShare(fileId, expiresAt);
      return response;
    } catch (err) {
      console.error('Erreur lors de la création du lien de partage:', err);
      setError(err.response?.data?.detail || 'Erreur lors de la création du lien de partage');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  
  const deleteShareLink = useCallback(async (shareId) => {
    setLoading(true);
    setError(null);

    try {
      await fileService.deleteShare(shareId);
      return true;
    } catch (err) {
      console.error('Erreur lors de la suppression du lien de partage:', err);
      setError(err.response?.data?.detail || 'Erreur lors de la suppression du lien de partage');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  
  const searchItems = useCallback(async (searchTerm, folderId = null) => {
    setLoading(true);
    setError(null);

    try {
      const results = await fileService.searchItems(searchTerm, folderId);
      return results;
    } catch (err) {
      console.error('Erreur lors de la recherche:', err);
      setError(err.response?.data?.detail || 'Erreur lors de la recherche');
      return { files: [], folders: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  
  const getTrashedItems = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [trashedFiles, trashedFolders] = await Promise.all([
        fileService.getTrashedFiles(),
        fileService.getTrashedFolders()
      ]);

      return { files: trashedFiles, folders: trashedFolders };
    } catch (err) {
      console.error('Erreur lors de la récupération des éléments supprimés:', err);
      setError(err.response?.data?.detail || 'Erreur lors de la récupération de la corbeille');
      return { files: [], folders: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  
  const emptyTrash = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await fileService.emptyTrash();
      refresh();
      return true;
    } catch (err) {
      console.error('Erreur lors du vidage de la corbeille:', err);
      setError(err.response?.data?.detail || 'Erreur lors du vidage de la corbeille');
      return false;
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  
  const uploadFile = useCallback(async (file, folderId = null, onProgress) => {
    setError(null);

    try {
      const response = await fileService.uploadFile(file, folderId, onProgress);
      refresh();
      return response;
    } catch (err) {
      console.error('Erreur lors du téléversement du fichier:', err);
      setError(err.response?.data?.detail || 'Erreur lors du téléversement');
      return null;
    }
  }, [refresh]);

  
  useEffect(() => {
    if (currentFolder) {
      fetchContents(currentFolder.id);
    } else {
      fetchContents(null);
    }
  }, [refreshTrigger, fetchContents, currentFolder]);

  const value = {
    files,
    folders,
    currentFolder,
    loading,
    error,
    fetchContents,
    refresh,
    createFolder,
    renameItem,
    moveItem,
    deleteItem,
    restoreItem,
    downloadFile,
    downloadFolder,
    createShareLink,
    deleteShareLink,
    searchItems,
    getTrashedItems,
    emptyTrash,
    uploadFile
  };

  return (
    <FileContext.Provider value={value}>
      {children}
    </FileContext.Provider>
  );
};