import React, { useState, useRef } from 'react';
import { Button, Modal, ProgressBar, Alert, ListGroup, Form } from 'react-bootstrap';
import { api } from '../../services/api';
import { formatFileSize } from '../../utils/formatters';
import { MAX_FILE_SIZE } from '../../config';

const FileUpload = ({ currentFolderId, onUploadComplete }) => {
  const [showModal, setShowModal] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState(null);
  const [uploadResults, setUploadResults] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Vérifier la taille des fichiers
    const validFiles = selectedFiles.filter(file => file.size <= MAX_FILE_SIZE);
    const invalidFiles = selectedFiles.filter(file => file.size > MAX_FILE_SIZE);
    
    if (invalidFiles.length > 0) {
      setError(`${invalidFiles.length} fichier(s) dépassent la taille maximale autorisée (${formatFileSize(MAX_FILE_SIZE)}).`);
    } else {
      setError(null);
    }
    
    setFiles(validFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    setUploadProgress({});
    setUploadResults([]);
    
    const uploadPromises = files.map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      
      if (currentFolderId) {
        formData.append('folder_id', currentFolderId);
      }
      
      try {
        const response = await api.post('/files/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(prev => ({
              ...prev,
              [file.name]: percentCompleted
            }));
          }
        });
        
        return { 
          name: file.name, 
          success: true, 
          message: 'Fichier téléversé avec succès', 
          data: response.data 
        };
      } catch (err) {
        console.error(`Erreur lors du téléversement de ${file.name}:`, err);
        return { 
          name: file.name, 
          success: false, 
          message: err.response?.data?.detail || 'Échec du téléversement' 
        };
      }
    });
    
    const results = await Promise.all(uploadPromises);
    setUploadResults(results);
    setUploading(false);
    
    // Vérifier si tous les uploads sont réussis
    const allSuccess = results.every(result => result.success);
    
    if (allSuccess) {
      setTimeout(() => {
        resetUpload();
        onUploadComplete();
      }, 1500);
    }
  };

  const resetUpload = () => {
    setFiles([]);
    setUploadProgress({});
    setError(null);
    setUploadResults([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    
    if (e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      
      // Vérifier la taille des fichiers
      const validFiles = droppedFiles.filter(file => file.size <= MAX_FILE_SIZE);
      const invalidFiles = droppedFiles.filter(file => file.size > MAX_FILE_SIZE);
      
      if (invalidFiles.length > 0) {
        setError(`${invalidFiles.length} fichier(s) dépassent la taille maximale autorisée (${formatFileSize(MAX_FILE_SIZE)}).`);
      } else {
        setError(null);
      }
      
      setFiles(validFiles);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <>
      <Button variant="primary" onClick={() => setShowModal(true)}>
        <i className="bi bi-cloud-upload me-1"></i> Importer des fichiers
      </Button>

      <Modal 
        show={showModal} 
        onHide={() => !uploading && setShowModal(false)} 
        backdrop={uploading ? 'static' : true}
        keyboard={!uploading}
        size="lg"
      >
        <Modal.Header closeButton={!uploading}>
          <Modal.Title>Importer des fichiers</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          {!uploading && uploadResults.length === 0 && (
            <div 
              className="dropzone border rounded p-5 text-center mb-3"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              style={{ 
                backgroundColor: '#f8f9fa', 
                cursor: 'pointer',
                minHeight: '200px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <i className="bi bi-cloud-upload text-primary" style={{ fontSize: '3rem' }}></i>
              <p className="mt-3">Glissez-déposez vos fichiers ici ou cliquez pour sélectionner</p>
              <Form.Control 
                type="file" 
                onChange={handleFileChange}
                multiple
                className="d-none"
                ref={fileInputRef}
              />
              <Button 
                variant="outline-primary" 
                onClick={() => fileInputRef.current.click()}
              >
                Sélectionner des fichiers
              </Button>
              <p className="text-muted mt-2 small">
                Taille maximale par fichier: {formatFileSize(MAX_FILE_SIZE)}
              </p>
            </div>
          )}
          
          {files.length > 0 && (
            <div className="mb-3">
              <h5>Fichiers sélectionnés ({files.length})</h5>
              <ListGroup>
                {files.map((file, index) => (
                  <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                    <div className="text-truncate" style={{ maxWidth: '50%' }}>
                      <i className="bi bi-file-earmark me-2"></i> {file.name}
                    </div>
                    <div className="text-muted">{formatFileSize(file.size)}</div>
                    {uploading && (
                      <div className="ms-auto" style={{ width: '40%' }}>
                        <ProgressBar 
                          now={uploadProgress[file.name] || 0} 
                          label={`${uploadProgress[file.name] || 0}%`} 
                          variant={uploadProgress[file.name] === 100 ? "success" : "primary"}
                        />
                      </div>
                    )}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
          )}
          
          {uploadResults.length > 0 && (
            <div className="mt-3">
              <h5>Résultats</h5>
              <ListGroup>
                {uploadResults.map((result, index) => (
                  <ListGroup.Item 
                    key={index}
                    variant={result.success ? "success" : "danger"}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <i className={`bi ${result.success ? 'bi-check-circle' : 'bi-x-circle'} me-2`}></i>
                        {result.name}
                      </div>
                      <div>{result.message}</div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          {!uploading && (
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Fermer
            </Button>
          )}
          
          {!uploading && files.length > 0 && uploadResults.length === 0 && (
            <Button variant="primary" onClick={handleUpload}>
              Téléverser {files.length} fichier{files.length > 1 ? 's' : ''}
            </Button>
          )}
          
          {!uploading && uploadResults.length > 0 && (
            <Button variant="primary" onClick={resetUpload}>
              Téléverser d'autres fichiers
            </Button>
          )}
          
          {uploading && (
            <Button variant="primary" disabled>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Téléversement en cours...
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default FileUpload;