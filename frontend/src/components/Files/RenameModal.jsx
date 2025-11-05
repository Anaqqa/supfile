import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { validateFileName } from '../../utils/validators';

const RenameModal = ({ show, onHide, onRename, initialName, itemType }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (show) {
      setName(initialName);
      setError('');
    }
  }, [show, initialName]);

  const handleNameChange = (e) => {
    setName(e.target.value);
    if (e.target.value) {
      setError('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError(`Veuillez saisir un nom pour ${itemType}`);
      return;
    }
    
    const validation = validateFileName(name);
    if (!validation.isValid) {
      setError(validation.message);
      return;
    }
    
    onRename(name.trim());
    setError('');
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Renommer {itemType}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Nouveau nom</Form.Label>
            <Form.Control
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder={`Nom du ${itemType}`}
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
            Renommer
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default RenameModal;