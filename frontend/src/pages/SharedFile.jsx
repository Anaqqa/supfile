import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Container, Card, Alert, Button, Spinner } from 'react-bootstrap';
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

  const handleDownload = () => {
    if (file) {
      window.open(`${api.defaults.baseURL}/shares/public/${token}`, '_blank');
    }
  };

  const handlePreview = () => {
    setPreviewMode(true);
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Chargement du fichier partagé...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <Alert variant="danger" className="text-center">
          <Alert.Heading>Erreur</Alert.Heading>
          <p>{error}</p>
        </Alert>
      </Container>
    );
  }

  if (!file) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <Alert variant="warning" className="text-center">
          <Alert.Heading>Fichier non trouvé</Alert.Heading>
          <p>Le fichier demandé n'existe pas ou n'est plus disponible.</p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Card className="shadow">
        <Card.Header className="bg-primary text-white">
          <div className="d-flex align-items-center">
            <i className="bi bi-share-fill me-2 fs-4"></i>
            <h4 className="mb-0">Fichier Partagé</h4>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="text-center mb-4">
            <i className={`bi bi-file-earmark fs-1 ${getFileIconClass(file.mime_type)}`}></i>
          </div>
          
          <div className="mb-4">
            <h3 className="mb-3">{file.name}</h3>
            
            <div className="d-flex flex-wrap text-muted mb-4">
              <div className="me-4 mb-2">
                <i className="bi bi-file-earmark me-2"></i>
                {getFileType(file.mime_type)}
              </div>
              <div className="me-4 mb-2">
                <i className="bi bi-hdd me-2"></i>
                {formatFileSize(file.size)}
              </div>
            </div>
          </div>
          
          <div className="d-flex justify-content-center gap-3">
            <Button 
              variant="primary" 
              size="lg"
              onClick={handleDownload}
            >
              <i className="bi bi-download me-2"></i>
              Télécharger
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
        </Card.Body>
        <Card.Footer className="text-center text-muted">
          <i className="bi bi-shield-lock me-2"></i>
          Partagé via SUPFile
        </Card.Footer>
      </Card>
      
      {/* Prévisualisation */}
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
    </Container>
  );
};


const getFileIconClass = (mimeType) => {
  if (!mimeType) return 'text-secondary';
  
  if (mimeType.startsWith('image/')) return 'text-success';
  if (mimeType.startsWith('video/')) return 'text-danger';
  if (mimeType.startsWith('audio/')) return 'text-info';
  if (mimeType.startsWith('text/')) return 'text-primary';
  if (mimeType.includes('pdf')) return 'text-danger';
  if (mimeType.includes('word')) return 'text-primary';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'text-success';
  if (mimeType.includes('presentation')) return 'text-warning';
  
  return 'text-secondary';
};

const getFileType = (mimeType) => {
  if (!mimeType) return 'Fichier';
  
  if (mimeType.startsWith('image/')) return 'Image';
  if (mimeType.startsWith('video/')) return 'Vidéo';
  if (mimeType.startsWith('audio/')) return 'Audio';
  if (mimeType.startsWith('text/')) return 'Texte';
  if (mimeType.includes('pdf')) return 'PDF';
  if (mimeType.includes('word')) return 'Document';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'Tableur';
  if (mimeType.includes('presentation')) return 'Présentation';
  
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