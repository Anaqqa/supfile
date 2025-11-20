import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { fileService } from '../../services/fileService';

const MoveModal = ({ show, onHide, onMove, item, itemType }) => {
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show) {
      loadFolders();
    }
  }, [show]);

  const loadFolders = async () => {
    setLoading(true);
    setError('');
    try {
      
      const allFolders = await fetchAllFolders();
      
      
      const filteredFolders = itemType === 'dossier' 
        ? allFolders.filter(f => f.id !== item?.id)
        : allFolders;
      
      setFolders(filteredFolders);
    } catch (err) {
      console.error('Erreur lors du chargement des dossiers:', err);
      setError('Impossible de charger les dossiers');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllFolders = async (parentId = null, depth = 0) => {
    const folders = await fileService.getFolders(parentId);
    let allFolders = folders.map(f => ({ ...f, depth }));
    
    
    for (const folder of folders) {
      const subFolders = await fetchAllFolders(folder.id, depth + 1);
      allFolders = [...allFolders, ...subFolders];
    }
    
    return allFolders;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
        
    const targetFolder = (selectedFolderId === null || selectedFolderId === 'root') ? 0 : parseInt(selectedFolderId);
        
    onMove(targetFolder);
    setSelectedFolderId(null);
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Déplacer {itemType}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          {loading ? (
            <div className="text-center py-3">
              <span className="spinner-border spinner-border-sm me-2"></span>
              Chargement des dossiers...
            </div>
          ) : (
            <Form.Group>
              <Form.Label>Destination</Form.Label>
              <Form.Select
                value={selectedFolderId || 'root'} 
                onChange={(e) => setSelectedFolderId(e.target.value === 'root' ? null : e.target.value)}
                required
              >
                <option value="root">📁 Racine</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {'  '.repeat(folder.depth)}📁 {folder.name}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                Sélectionnez le dossier de destination
              </Form.Text>
            </Form.Group>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Annuler
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            Déplacer
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default MoveModal;