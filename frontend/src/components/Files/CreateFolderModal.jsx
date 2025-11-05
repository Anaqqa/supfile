import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { validateFileName } from '../../utils/validators';

const CreateFolderModal = ({ show, onHide, onCreate }) => {
  const [folderName, setFolderName] = useState('');
  const [error, setError] = useState('');

  const handleNameChange = (e) => {
    setFolderName(e.target.value);
    if (e.target.value) {
      setError('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!folderName.trim()) {
      setError('Veuillez saisir un nom de dossier');
      return;
    }
    
    // Valider le nom du dossier
    const validation = validateFileName(folderName);
    if (!validation.isValid) {
      setError(validation.message);
      return;
    }
    
    onCreate(folderName.trim());
    setFolderName('');
    setError('');
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Créer un nouveau dossier</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Nom du dossier</Form.Label>
            <Form.Control
              type="text"
              value={folderName}
              onChange={handleNameChange}
              placeholder="Nom du dossier"
              autoFocus
              isInvalid={!!error}
            />
            <Form.Control.Feedback type="invalid">
              {error}
            </Form.Control.Feedback>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Annuler
          </Button>
          <Button variant="primary" type="submit">
            Créer
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CreateFolderModal;