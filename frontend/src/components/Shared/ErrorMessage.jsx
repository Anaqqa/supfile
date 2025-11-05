import React from 'react';
import { Alert, Container, Button } from 'react-bootstrap';

const ErrorMessage = ({ message, onRetry, retryLabel = "Réessayer" }) => {
  return (
    <Container className="py-5">
      <Alert variant="danger">
        <Alert.Heading>Une erreur est survenue</Alert.Heading>
        <p>{message || "Une erreur inattendue s'est produite. Veuillez réessayer plus tard."}</p>
        {onRetry && (
          <div className="d-flex justify-content-end">
            <Button onClick={onRetry} variant="outline-danger">
              {retryLabel}
            </Button>
          </div>
        )}
      </Alert>
    </Container>
  );
};

export default ErrorMessage;