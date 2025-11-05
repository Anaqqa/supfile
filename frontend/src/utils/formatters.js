/**
 * Formatte une taille en octets en une chaîne lisible (Ko, Mo, Go)
 * @param {number} bytes - Taille en octets
 * @param {number} decimals - Nombre de décimales (défaut: 2)
 * @returns {string} Chaîne formatée
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Octets';

  const k = 1024;
  const sizes = ['Octets', 'Ko', 'Mo', 'Go', 'To', 'Po'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
};

/**
 * Formatte une date en chaîne lisible (français)
 * @param {string} dateString - Date au format ISO
 * @returns {string} Date formatée
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  
  if (isNaN(date.getTime())) {
    return '';
  }
  
  
  const options = { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return new Intl.DateTimeFormat('fr-FR', options).format(date);
};

/**
 * Tronque une chaîne à une longueur spécifiée
 * @param {string} str - Chaîne à tronquer
 * @param {number} maxLength - Longueur maximale
 * @param {string} suffix - Suffixe à ajouter si tronqué (défaut: '...')
 * @returns {string} Chaîne tronquée
 */
export const truncateString = (str, maxLength = 20, suffix = '...') => {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Génère une couleur basée sur le nom du fichier (pour les avatars)
 * @param {string} fileName - Nom du fichier
 * @returns {string} Code couleur au format hexadécimal
 */
export const generateColorFromFileName = (fileName) => {
  if (!fileName) return '#6c757d'; 
  
  let hash = 0;
  for (let i = 0; i < fileName.length; i++) {
    hash = fileName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  
  return color;
};

/**
 * Extrait l'extension d'un nom de fichier
 * @param {string} fileName - Nom du fichier
 * @returns {string} Extension du fichier (sans le point)
 */
export const getFileExtension = (fileName) => {
  if (!fileName) return '';
  
  const parts = fileName.split('.');
  if (parts.length === 1) return '';
  return parts[parts.length - 1].toLowerCase();
};

/**
 * Calcule le pourcentage d'un nombre par rapport à un total
 * @param {number} value - Valeur
 * @param {number} total - Total
 * @param {number} decimals - Nombre de décimales (défaut: 0)
 * @returns {number} Pourcentage
 */
export const calculatePercentage = (value, total, decimals = 0) => {
  if (total === 0) return 0;
  return parseFloat(((value / total) * 100).toFixed(decimals));
};