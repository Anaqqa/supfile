import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Container, Card, Alert, Button, Spinner, Row, Col, Badge } from 'react-bootstrap';
import { api } from '../services/api';
import FilePreview from '../components/Files/FilePreview';
import { formatFileSize } from '../utils/formatters';

const SharedFile = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const view = searchParams.get('view') === '1';

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchSharedFile = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/shares/public/${token}`);
        setFile(response.data);
        
        if (view) {
          setPreviewMode(true);
        }
      } catch (err) {
        console.error('Erreur lors de la récupération du fichier partagé:', err);
        
        if (err.response) {
          if (err.response.status === 404) {
            setError('Le lien de partage est invalide ou a expiré.');
          } else if (err.response.status === 410) {
            setError('Ce lien de partage a expiré.');
          } else {
            setError('Erreur lors de la récupération du fichier.');
          }
        } else {
          setError('Erreur de connexion au serveur.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSharedFile();
  }, [token, view]);

  const handleDownload = async () => {
    if (file) {
      setDownloading(true);
      try {
        window.open(`${api.defaults.baseURL}/shares/public/${token}/download`, '_blank');
      } catch (err) {
        console.error('Erreur lors du téléchargement:', err);
      } finally {
        setTimeout(() => setDownloading(false), 2000);
      }
    }
  };

  const handlePreview = () => {
    setPreviewMode(true);
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex flex-column">
        {/* Header */}
        <div className="bg-primary text-white py-3">
          <Container>
            <h4 className="mb-0">
              <i className="bi bi-cloud-arrow-up me-2"></i>
              SUPFile
            </h4>
          </Container>
        </div>

        {/* Loading */}
        <Container className="flex-grow-1 d-flex justify-content-center align-items-center">
          <div className="text-center">
            <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
            <p className="mt-3 text-muted">Chargement du fichier partagé...</p>
          </div>
        </Container>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-vh-100 d-flex flex-column">
        {/* Header */}
        <div className="bg-primary text-white py-3">
          <Container>
            <h4 className="mb-0">
              <i className="bi bi-cloud-arrow-up me-2"></i>
              SUPFile
            </h4>
          </Container>
        </div>

        {/* Error */}
        <Container className="flex-grow-1 d-flex justify-content-center align-items-center">
          <Card className="shadow border-0" style={{ maxWidth: '600px' }}>
            <Card.Body className="p-5 text-center">
              <i className="bi bi-exclamation-triangle text-danger display-1 mb-4"></i>
              <h3 className="mb-3">Fichier introuvable</h3>
              <p className="text-muted mb-4">{error}</p>
              <Alert variant="info" className="text-start">
                <Alert.Heading className="h6">Que s'est-il passé ?</Alert.Heading>
                <ul className="mb-0 small">
                  <li>Le lien de partage a peut-être expiré</li>
                  <li>Le fichier a peut-être été supprimé par son propriétaire</li>
                  <li>Le lien n'est pas valide</li>
                </ul>
              </Alert>
            </Card.Body>
          </Card>
        </Container>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="min-vh-100 d-flex flex-column">
        {/* Header */}
        <div className="bg-primary text-white py-3">
          <Container>
            <h4 className="mb-0">
              <i className="bi bi-cloud-arrow-up me-2"></i>
              SUPFile
            </h4>
          </Container>
        </div>

        {/* Not Found */}
        <Container className="flex-grow-1 d-flex justify-content-center align-items-center">
          <Alert variant="warning" className="text-center">
            <Alert.Heading>Fichier non trouvé</Alert.Heading>
            <p>Le fichier demandé n'existe pas ou n'est plus disponible.</p>
          </Alert>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex flex-column bg-light">
      {/* Header */}
      <div className="bg-primary text-white py-3 shadow-sm">
        <Container>
          <Row className="align-items-center">
            <Col>
              <h4 className="mb-0">
                <i className="bi bi-cloud-arrow-up me-2"></i>
                SUPFile
              </h4>
            </Col>
            <Col xs="auto">
              <Badge bg="light" text="dark" className="px-3 py-2">
                <i className="bi bi-share-fill me-1"></i>
                Fichier Partagé
              </Badge>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Main Content */}
      <Container className="flex-grow-1 py-5">
        <Row className="justify-content-center">
          <Col lg={8} xl={6}>
            <Card className="shadow-lg border-0">
              {/* File Icon Header */}
              <div className="bg-primary bg-opacity-10 text-center py-5">
                <i 
                  className={`bi ${getFileIconClass(file.mime_type)} display-1`}
                  style={{ fontSize: '5rem' }}
                ></i>
              </div>

              <Card.Body className="p-4 p-md-5">
                {/* File Name */}
                <h2 className="mb-4 text-center">{file.name}</h2>
                
                {/* File Info */}
                <Row className="g-3 mb-4">
                  <Col md={6}>
                    <div className="d-flex align-items-center p-3 bg-light rounded">
                      <i className="bi bi-file-earmark-text fs-4 text-primary me-3"></i>
                      <div>
                        <small className="text-muted d-block">Type</small>
                        <strong>{getFileType(file.mime_type)}</strong>
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="d-flex align-items-center p-3 bg-light rounded">
                      <i className="bi bi-hdd fs-4 text-primary me-3"></i>
                      <div>
                        <small className="text-muted d-block">Taille</small>
                        <strong>{formatFileSize(file.size)}</strong>
                      </div>
                    </div>
                  </Col>
                </Row>

                {/* Action Buttons */}
                <div className="d-grid gap-3">
                  <Button 
                    variant="primary" 
                    size="lg"
                    onClick={handleDownload}
                    disabled={downloading}
                  >
                    {downloading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Téléchargement...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-download me-2"></i>
                        Télécharger le fichier
                      </>
                    )}
                  </Button>
                  
                  {isPreviewable(file.mime_type) && (
                    <Button 
                      variant="outline-secondary" 
                      size="lg"
                      onClick={handlePreview}
                    >
                      <i className="bi bi-eye me-2"></i>
                      Prévisualiser
                    </Button>
                  )}
                </div>

                {/* Security Info */}
                <div className="mt-4 p-3 bg-success bg-opacity-10 rounded border border-success">
                  <div className="d-flex align-items-start">
                    <i className="bi bi-shield-check text-success fs-4 me-3"></i>
                    <div>
                      <strong className="text-success d-block mb-1">Partage sécurisé</strong>
                      <small className="text-muted">
                        Ce fichier a été partagé via SUPFile de manière sécurisée. 
                        Le lien de partage est unique et peut expirer.
                      </small>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* CTA Card */}
            <Card className="mt-4 border-0 shadow-sm bg-primary text-white">
              <Card.Body className="p-4 text-center">
                <h5 className="mb-3">Vous aussi, stockez et partagez vos fichiers</h5>
                <p className="mb-3">
                  Créez votre compte SUPFile gratuitement et profitez de 30 Go d'espace de stockage.
                </p>
                <Button 
                  variant="light" 
                  href="/"
                  className="px-4"
                >
                  <i className="bi bi-cloud-arrow-up me-2"></i>
                  Découvrir SUPFile
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Footer */}
      <footer className="bg-dark text-white py-3 mt-auto">
        <Container>
          <Row className="align-items-center">
            <Col md={6} className="text-center text-md-start mb-2 mb-md-0">
              <small className="text-muted">
                <i className="bi bi-shield-lock me-1"></i>
                Partagé via SUPFile - Cloud Storage Platform
              </small>
            </Col>
            <Col md={6} className="text-center text-md-end">
              <small className="text-muted">
                Sécurisé | Rapide | Fiable
              </small>
            </Col>
          </Row>
        </Container>
      </footer>
      
      {/* Preview Modal */}
      {previewMode && (
        <FilePreview 
          show={previewMode} 
          onHide={() => setPreviewMode(false)} 
          file={file} 
          onDownload={handleDownload}
          isSharedFile={true}
          shareToken={token}
        />
      )}
    </div>
  );
};

const getFileIconClass = (mimeType) => {
  if (!mimeType) return 'bi-file-earmark text-secondary';
  
  if (mimeType.startsWith('image/')) return 'bi-file-earmark-image text-success';
  if (mimeType.startsWith('video/')) return 'bi-file-earmark-play text-danger';
  if (mimeType.startsWith('audio/')) return 'bi-file-earmark-music text-info';
  if (mimeType.startsWith('text/')) return 'bi-file-earmark-text text-primary';
  if (mimeType.includes('pdf')) return 'bi-file-earmark-pdf text-danger';
  if (mimeType.includes('word')) return 'bi-file-earmark-word text-primary';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'bi-file-earmark-excel text-success';
  if (mimeType.includes('presentation')) return 'bi-file-earmark-slides text-warning';
  if (mimeType.includes('zip') || mimeType.includes('archive')) return 'bi-file-earmark-zip text-warning';
  
  return 'bi-file-earmark text-secondary';
};

const getFileType = (mimeType) => {
  if (!mimeType) return 'Fichier';
  
  if (mimeType.startsWith('image/')) return 'Image';
  if (mimeType.startsWith('video/')) return 'Vidéo';
  if (mimeType.startsWith('audio/')) return 'Audio';
  if (mimeType.startsWith('text/')) return 'Texte';
  if (mimeType.includes('pdf')) return 'PDF';
  if (mimeType.includes('word')) return 'Document Word';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'Tableur';
  if (mimeType.includes('presentation')) return 'Présentation';
  if (mimeType.includes('zip') || mimeType.includes('archive')) return 'Archive';
  
  return 'Fichier';
};

const isPreviewable = (mimeType) => {
  if (!mimeType) return false;
  
  return mimeType.startsWith('image/') || 
         mimeType.startsWith('video/') || 
         mimeType.startsWith('text/') || 
         mimeType.includes('pdf');
};

export default SharedFile;