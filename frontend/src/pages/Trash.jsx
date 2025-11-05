import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, Table, Alert, Modal } from 'react-bootstrap';
import { useFileContext } from '../contexts/FileContext';
import { formatFileSize, formatDate } from '../utils/formatters';
import Loading from '../components/Shared/Loading';
import ErrorMessage from '../components/Shared/ErrorMessage';
import { fileService } from '../services/fileService';

const Trash = () => {
  const { 
    loading, error, getTrashedItems, deleteItem, emptyTrash
  } = useFileContext();
  
  const [trashedFiles, setTrashedFiles] = useState([]);
  const [trashedFolders, setTrashedFolders] = useState([]);
  const [isEmpty, setIsEmpty] = useState(true);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);
  const [isEmptying, setIsEmptying] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);

  const loadTrashedItems = async () => {
    setLocalLoading(true);
    try {
      
      const files = await fileService.getTrashedFiles();
      const folders = await fileService.getTrashedFolders();
      
      
      const filteredFiles = files.filter(file => file.is_deleted === true);
      const filteredFolders = folders.filter(folder => folder.is_deleted === true);
      
      setTrashedFiles(filteredFiles);
      setTrashedFolders(filteredFolders);
      setIsEmpty(filteredFiles.length === 0 && filteredFolders.length === 0);
    } catch (err) {
      console.error('Erreur lors du chargement de la corbeille:', err);
    } finally {
      setLocalLoading(false);
    }
  };

  useEffect(() => {
    loadTrashedItems();
  }, []);

  const handleRestore = async (itemId, isFolder) => {
    try {
      if (isFolder) {
        await fileService.restoreFolder(itemId);
      } else {
        await fileService.restoreFile(itemId);
      }
      
      await loadTrashedItems();
    } catch (error) {
      console.error('Erreur lors de la restauration:', error);
    }
  };

  const handleDelete = async (itemId, isFolder) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer définitivement cet élément ?')) {
      await deleteItem(itemId, isFolder, true); 
      loadTrashedItems();
    }
  };

  const handleEmptyTrash = async () => {
    setIsEmptying(true);
    try {
      await emptyTrash();
      setShowEmptyConfirm(false);
      await loadTrashedItems();
    } catch (err) {
      console.error('Erreur lors du vidage de la corbeille:', err);
    } finally {
      setIsEmptying(false);
    }
  };

  if ((loading || localLoading) && trashedFiles.length === 0 && trashedFolders.length === 0) {
    return <Loading message="Chargement de la corbeille..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadTrashedItems} />;
  }

  return (
    <Container>
      <h1 className="mb-4">Corbeille</h1>

      {/* Action principale */}
      <Row className="mb-3">
        <Col>
          <Button 
            variant="danger" 
            onClick={() => setShowEmptyConfirm(true)}
            disabled={isEmpty}
          >
            <i className="bi bi-trash me-2"></i> Vider la corbeille
          </Button>
        </Col>
      </Row>

      {/* Contenu */}
      {isEmpty ? (
        <Alert variant="info">
          <Alert.Heading>Corbeille vide</Alert.Heading>
          <p>
            Aucun fichier dans la corbeille.
          </p>
        </Alert>
      ) : (
        <Card>
          <Card.Body>
            <Table hover responsive>
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Nom</th>
                  <th style={{ width: '15%' }}>Type</th>
                  <th style={{ width: '15%' }}>Taille</th>
                  <th style={{ width: '15%' }}>Supprimé le</th>
                  <th style={{ width: '15%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Dossiers */}
                {trashedFolders.map((folder) => (
                  <tr key={`folder-${folder.id}`}>
                    <td>
                      <div className="d-flex align-items-center">
                        <i className="bi bi-folder-fill text-warning me-2 fs-5"></i>
                        <span>{folder.name}</span>
                      </div>
                    </td>
                    <td>Dossier</td>
                    <td>-</td>
                    <td>{formatDate(folder.deleted_at)}</td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        className="me-1"
                        onClick={() => handleRestore(folder.id, true)}
                      >
                        <i className="bi bi-arrow-counterclockwise"></i>
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDelete(folder.id, true)}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </td>
                  </tr>
                ))}

                {/* Fichiers */}
                {trashedFiles.map((file) => (
                  <tr key={`file-${file.id}`}>
                    <td>
                      <div className="d-flex align-items-center">
                        <i className={`bi bi-file-earmark me-2 fs-5 ${getFileIcon(file.mime_type)}`}></i>
                        <span>{file.name}</span>
                      </div>
                    </td>
                    <td>{getFileType(file.mime_type)}</td>
                    <td>{formatFileSize(file.size)}</td>
                    <td>{formatDate(file.deleted_at)}</td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        className="me-1"
                        onClick={() => handleRestore(file.id, false)}
                      >
                        <i className="bi bi-arrow-counterclockwise"></i>
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDelete(file.id, false)}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Modal de confirmation pour vider la corbeille */}
      <Modal show={showEmptyConfirm} onHide={() => setShowEmptyConfirm(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Vider la corbeille</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-0">
            Êtes-vous sûr de vouloir vider la corbeille ? Cette action est irréversible et tous les fichiers seront définitivement supprimés.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEmptyConfirm(false)} disabled={isEmptying}>
            Annuler
          </Button>
          <Button 
            variant="danger" 
            onClick={handleEmptyTrash}
            disabled={isEmptying}
          >
            {isEmptying ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Suppression en cours...
              </>
            ) : (
              <>Vider la corbeille</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

const getFileIcon = (mimeType) => {
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

export default Trash;