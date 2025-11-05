import React from 'react';
import { Container, Alert, Button } from 'react-bootstrap';

const Trash = () => {
  return (
    <Container>
      <h1 className="mb-4">Corbeille</h1>
      
      <Alert variant="info">
        <Alert.Heading>Corbeille vide</Alert.Heading>
        <p>
          Aucun fichier dans la corbeille.
        </p>
      </Alert>
      
      <Button variant="outline-secondary" disabled>
        Vider la corbeille
      </Button>
    </Container>
  );
};

export default Trash;