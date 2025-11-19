import React, { useState, useEffect } from 'react';
import { Modal, Button, Spinner, Alert } from 'react-bootstrap';
import { api } from '../../services/api';
import { PREVIEW_TYPES } from '../../config';
import { fileService } from '../../services/fileService';

const FilePreview = ({ show, onHide, file, onDownload }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewContent, setPreviewContent] = useState(null);
  const [isPreviewable, setIsPreviewable] = useState(false);
  const [previewType, setPreviewType] = useState(null);

  useEffect(() => {
    if (file && show) {
      loadPreview();
    } else {
      resetPreview();
    }
  }, [file, show]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const resetPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPreviewContent(null);
    setLoading(false);
    setError(null);
    setIsPreviewable(false);
    setPreviewType(null);
  };

  const loadPreview = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const type = determinePreviewType(file.mime_type);
      setPreviewType(type);

      if (type === 'none') {
        setIsPreviewable(false);
        setLoading(false);
        return;
      }

      setIsPreviewable(true);

      if (type === 'image') {
        try {
          const response = await api.get(`/files/${file.id}/preview`, {
            responseType: 'blob'
          });
          
          const blob = new Blob([response.data], { type: file.mime_type });
          const blobUrl = URL.createObjectURL(blob);
          setPreviewUrl(blobUrl);
          setLoading(false);
          return;
        } catch (err) {
          console.error('Erreur image:', err);
          setError('Impossible de charger l\'image.');
          setLoading(false);
          return;
        }
      }

      if (type === 'video') {
        try {
          const response = await api.get(`/files/${file.id}/preview`, {
            responseType: 'blob'
          });
          
          const blob = new Blob([response.data], { type: file.mime_type });
          const blobUrl = URL.createObjectURL(blob);
          setPreviewUrl(blobUrl);
          setLoading(false);
          return;
        } catch (err) {
          console.error('Erreur vidéo:', err);
          setError('Impossible de charger la vidéo.');
          setLoading(false);
          return;
        }
      }

      if (type === 'pdf') {
        try {
          const response = await api.get(`/files/${file.id}/preview`, {
            responseType: 'blob'
          });
          
          const blob = new Blob([response.data], { type: 'application/pdf' });
          const blobUrl = URL.createObjectURL(blob);
          setPreviewUrl(blobUrl);
          setLoading(false);
          return;
        } catch (err) {
          console.error('Erreur PDF:', err);
          setError('Impossible de charger le PDF.');
          setLoading(false);
          return;
        }
      }

      if (type === 'text') {
        try {
          const response = await api.get(`/files/${file.id}/preview`, {
            responseType: 'blob'
          });

          const text = await response.data.text();
          setPreviewContent(text);
          setLoading(false);
          return;
        } catch (err) {
          console.error('Erreur texte:', err);
          setError('Impossible de charger le fichier texte.');
          setLoading(false);
          return;
        }
      }

      setIsPreviewable(false);

    } catch (err) {
      console.error('Erreur lors du chargement de la prévisualisation:', err);
      setError('Impossible de charger la prévisualisation.');
      setLoading(false);
    }
  };

  const determinePreviewType = (mimeType) => {
    if (!mimeType) return 'none';

    if (PREVIEW_TYPES.IMAGES.includes(mimeType)) return 'image';
    if (PREVIEW_TYPES.VIDEOS.includes(mimeType)) return 'video';
    if (PREVIEW_TYPES.DOCUMENTS.includes(mimeType)) return 'pdf';
    if (PREVIEW_TYPES.TEXT.includes(mimeType)) return 'text';

    return 'none';
  };

  const handleDownload = () => {
    if (file && file.id) {
      if (onDownload) {
        onDownload(file.id);
      } else {
        fileService.downloadFile(file.id);
      }
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {file ? file.name : 'Prévisualisation'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Chargement de la prévisualisation...</p>
          </div>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : !isPreviewable ? (
          <div className="text-center py-5">
            <i className="bi bi-file-earmark-x text-muted fs-1"></i>
            <p className="mt-2">Impossible de prévisualiser ce type de fichier.</p>
            <p className="text-muted">Veuillez le télécharger pour le consulter.</p>
          </div>
        ) : (
          <div className="preview-container">
            {previewType === 'image' && previewUrl && (
              <div className="text-center">
                <img
                  src={previewUrl}
                  alt={file.name}
                  className="img-fluid"
                  style={{ maxHeight: '60vh' }}
                />
              </div>
            )}

            {previewType === 'video' && previewUrl && (
              <div className="text-center">
                <video
                  src={previewUrl}
                  controls
                  className="w-100"
                  style={{ maxHeight: '60vh' }}
                >
                  Votre navigateur ne prend pas en charge la lecture de vidéos.
                </video>
              </div>
            )}

            {previewType === 'pdf' && previewUrl && (
              <div className="text-center">
                <iframe
                  src={previewUrl}
                  width="100%"
                  height="500px"
                  title={file.name}
                >
                  Ce navigateur ne prend pas en charge l'affichage des PDF.
                </iframe>
              </div>
            )}

            {previewType === 'text' && previewContent && (
              <div className="border p-3 bg-light" style={{ maxHeight: '60vh', overflow: 'auto' }}>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {previewContent}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Fermer
        </Button>
        {file && (
          <Button variant="primary" onClick={handleDownload}>
            <i className="bi bi-download me-1"></i> Télécharger
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default FilePreview;