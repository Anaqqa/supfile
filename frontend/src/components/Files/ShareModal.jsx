import React, { useState } from 'react';
import { Modal, Button, Form, Alert, InputGroup, FormControl } from 'react-bootstrap';
import { fileService } from '../../services/fileService';

const ShareModal = ({ show, onHide, file }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const handleShare = async () => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      
      let expirationDate = null;
      if (expiresAt) {
        expirationDate = new Date(expiresAt).toISOString();
      }
      
      const response = await fileService.createShare(file.id, expirationDate);
      
      
      const baseUrl = window.location.origin;
      const shareUrl = `${baseUrl}/share/${response.token}`;
      
      setShareLink(shareUrl);
      setSuccess(true);
    } catch (err) {
      console.error('Erreur lors du partage:', err);
      setError(err.response?.data?.detail || 'Une erreur est survenue lors de la création du lien de partage.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink)
      .then(() => {
        alert('Lien copié dans le presse-papiers!');
      })
      .catch(err => {
        console.error('Impossible de copier le lien:', err);
      });
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Partager {file?.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        {!success ? (
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Date d'expiration (optionnelle)</Form.Label>
              <Form.Control
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                placeholder="Laisser vide pour un lien permanent"
              />
              <Form.Text className="text-muted">
                Laissez vide pour un lien sans date d'expiration.
              </Form.Text>
            </Form.Group>
            
            <Button 
              variant="primary" 
              onClick={handleShare} 
              disabled={loading}
              className="w-100"
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Création du lien...
                </>
              ) : (
                'Créer un lien de partage'
              )}
            </Button>
          </Form>
        ) : (
          <div>
            <Alert variant="success">
              <Alert.Heading>Lien de partage créé!</Alert.Heading>
              <p>
                Votre fichier est maintenant accessible via le lien ci-dessous:
              </p>
            </Alert>
            
            <InputGroup className="mb-3">
              <FormControl
                value={shareLink}
                readOnly
                onClick={(e) => e.target.select()}
              />
              <Button variant="outline-secondary" onClick={handleCopyLink}>
                <i className="bi bi-clipboard"></i>
              </Button>
            </InputGroup>
            
            {expiresAt && (
              <p className="text-muted small">
                Ce lien expirera le {new Date(expiresAt).toLocaleString()}.
              </p>
            )}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Fermer
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ShareModal;