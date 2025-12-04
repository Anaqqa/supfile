import React, { useState } from 'react';
import { Modal, Button, Form, Alert, InputGroup, FormControl } from 'react-bootstrap';
import { fileService } from '../../services/fileService';
import CustomToast from '../Shared/CustomToast';

const ShareModal = ({ show, onHide, file }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [copied, setCopied] = useState(false);

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
        setCopied(true);
        setShowToast(true);
        setTimeout(() => setCopied(false), 3000);
      })
      .catch(err => {
        console.error('Impossible de copier le lien:', err);
        setError('Impossible de copier le lien dans le presse-papiers');
      });
  };

  const handleClose = () => {
    setShareLink('');
    setSuccess(false);
    setError(null);
    setExpiresAt('');
    setCopied(false);
    onHide();
  };

  return (
    <>
      <Modal show={show} onHide={handleClose} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title>
            <i className="bi bi-share me-2 text-primary"></i>
            Partager {file?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
          
          {!success ? (
            <Form>
              <div className="mb-4">
                <div className="bg-light p-3 rounded border">
                  <div className="d-flex align-items-center mb-2">
                    <i className="bi bi-file-earmark text-primary fs-4 me-3"></i>
                    <div>
                      <strong className="d-block">{file?.name}</strong>
                      <small className="text-muted">Créer un lien de partage public</small>
                    </div>
                  </div>
                </div>
              </div>

              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold">
                  <i className="bi bi-calendar-event me-2"></i>
                  Date d'expiration (optionnelle)
                </Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  placeholder="Laisser vide pour un lien permanent"
                />
                <Form.Text className="text-muted">
                  <i className="bi bi-info-circle me-1"></i>
                  Laissez vide pour créer un lien sans date d'expiration.
                </Form.Text>
              </Form.Group>
              
              <div className="d-grid">
                <Button 
                  variant="primary" 
                  onClick={handleShare} 
                  disabled={loading}
                  size="lg"
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Création du lien...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-link-45deg me-2"></i>
                      Créer le lien de partage
                    </>
                  )}
                </Button>
              </div>
            </Form>
          ) : (
            <div>
              <Alert variant="success" className="mb-4">
                <div className="d-flex align-items-center">
                  <i className="bi bi-check-circle-fill fs-4 me-3"></i>
                  <div>
                    <Alert.Heading className="h6 mb-1">Lien créé avec succès !</Alert.Heading>
                    <p className="mb-0 small">Votre fichier est maintenant accessible via le lien ci-dessous.</p>
                  </div>
                </div>
              </Alert>
              
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">
                  <i className="bi bi-link-45deg me-2"></i>
                  Lien de partage
                </Form.Label>
                <InputGroup>
                  <FormControl
                    value={shareLink}
                    readOnly
                    onClick={(e) => e.target.select()}
                    className="bg-light"
                  />
                  <Button 
                    variant={copied ? "success" : "outline-primary"}
                    onClick={handleCopyLink}
                  >
                    <i className={`bi ${copied ? 'bi-check-lg' : 'bi-clipboard'} me-1`}></i>
                    {copied ? 'Copié !' : 'Copier'}
                  </Button>
                </InputGroup>
              </Form.Group>
              
              {expiresAt && (
                <Alert variant="info" className="mb-3">
                  <i className="bi bi-clock-history me-2"></i>
                  <small>
                    Ce lien expirera le <strong>{new Date(expiresAt).toLocaleString('fr-FR')}</strong>
                  </small>
                </Alert>
              )}

              <div className="bg-primary bg-opacity-10 p-3 rounded border border-primary">
                <div className="d-flex align-items-start">
                  <i className="bi bi-info-circle text-primary fs-5 me-3 mt-1"></i>
                  <div>
                    <strong className="d-block mb-1 text-primary">Comment utiliser ce lien ?</strong>
                    <ul className="mb-0 small text-muted ps-3">
                      <li>Partagez ce lien avec n'importe qui</li>
                      <li>Aucune connexion requise pour y accéder</li>
                      <li>Le fichier peut être téléchargé ou prévisualisé</li>
                      {!expiresAt && <li>Ce lien n'expire jamais</li>}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="d-grid gap-2 mt-4">
                <Button 
                  variant="outline-primary" 
                  onClick={() => window.open(shareLink, '_blank')}
                >
                  <i className="bi bi-box-arrow-up-right me-2"></i>
                  Ouvrir le lien dans un nouvel onglet
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" onClick={handleClose}>
            Fermer
          </Button>
          {success && (
            <Button variant="primary" onClick={handleCopyLink}>
              <i className="bi bi-clipboard me-2"></i>
              Copier à nouveau
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Toast notification */}
      <CustomToast 
        show={showToast}
        onClose={() => setShowToast(false)}
        message="Lien copié dans le presse-papiers !"
        type="success"
        icon="clipboard-check"
      />
    </>
  );
};

export default ShareModal;