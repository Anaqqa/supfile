/**
 * Valide un nom de fichier/dossier
 * @param {string} fileName - Nom à valider
 * @returns {Object} { isValid: boolean, message: string }
 */
export const validateFileName = (fileName) => {
  if (!fileName || fileName.trim() === '') {
    return {
      isValid: false,
      message: 'Le nom ne peut pas être vide'
    };
  }

  
  if (fileName.length < 1) {
    return {
      isValid: false,
      message: 'Le nom doit comporter au moins 1 caractère'
    };
  }

  if (fileName.length > 255) {
    return {
      isValid: false,
      message: 'Le nom ne doit pas dépasser 255 caractères'
    };
  }

  
  const invalidCharsRegex = /[<>:"\/\\|?*\x00-\x1F]/g;
  if (invalidCharsRegex.test(fileName)) {
    return {
      isValid: false,
      message: 'Le nom contient des caractères non autorisés (< > : " / \\ | ? *)'
    };
  }

  
  const reservedNames = [
    'CON', 'PRN', 'AUX', 'NUL', 
    'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
  ];
  
  if (reservedNames.includes(fileName.toUpperCase())) {
    return {
      isValid: false,
      message: 'Le nom est réservé par le système'
    };
  }

  
  if (fileName.startsWith(' ') || fileName.endsWith(' ') || 
      fileName.startsWith('.') || fileName.endsWith('.')) {
    return {
      isValid: false,
      message: 'Le nom ne peut pas commencer ou finir par un espace ou un point'
    };
  }

  return { isValid: true, message: '' };
};

/**
 * Valide un email
 * @param {string} email - Email à valider
 * @returns {boolean} true si l'email est valide
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valide la complexité d'un mot de passe
 * @param {string} password - Mot de passe à valider
 * @returns {Object} { isValid: boolean, message: string }
 */
export const validatePassword = (password) => {
  if (!password) {
    return {
      isValid: false,
      message: 'Le mot de passe est requis'
    };
  }

  if (password.length < 8) {
    return {
      isValid: false,
      message: 'Le mot de passe doit comporter au moins 8 caractères'
    };
  }

  
  const hasNumber = /\d/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);

  if (!hasNumber || !hasLetter) {
    return {
      isValid: false,
      message: 'Le mot de passe doit contenir au moins une lettre et un chiffre'
    };
  }

  return { isValid: true, message: '' };
};

/**
 * Valide si deux mots de passe correspondent
 * @param {string} password - Mot de passe
 * @param {string} confirmPassword - Confirmation du mot de passe
 * @returns {Object} { isValid: boolean, message: string }
 */
export const validatePasswordMatch = (password, confirmPassword) => {
  if (password !== confirmPassword) {
    return {
      isValid: false,
      message: 'Les mots de passe ne correspondent pas'
    };
  }

  return { isValid: true, message: '' };
};

/**
 * Vérifie si un nom de fichier a une extension autorisée
 * @param {string} fileName - Nom du fichier
 * @param {Array} allowedExtensions - Extensions autorisées (ex: ['jpg', 'png'])
 * @returns {boolean} true si l'extension est autorisée
 */
export const hasAllowedExtension = (fileName, allowedExtensions) => {
  if (!fileName || !allowedExtensions || !allowedExtensions.length) {
    return false;
  }

  const extension = fileName.split('.').pop().toLowerCase();
  return allowedExtensions.includes(extension);
};

/**
 * Vérifie si le type MIME est autorisé
 * @param {string} mimeType - Type MIME du fichier
 * @param {Array} allowedMimeTypes - Types MIME autorisés
 * @returns {boolean} true si le type MIME est autorisé
 */
export const hasAllowedMimeType = (mimeType, allowedMimeTypes) => {
  if (!mimeType || !allowedMimeTypes || !allowedMimeTypes.length) {
    return false;
  }
  
  return allowedMimeTypes.includes(mimeType);
};