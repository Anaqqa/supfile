export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
export const STORAGE_QUOTA = 30 * 1024 * 1024 * 1024; // 30GB

export const PREVIEW_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  VIDEOS: ['video/mp4', 'video/webm'],
  DOCUMENTS: ['application/pdf'],
  TEXT: ['text/plain', 'text/markdown'],
};