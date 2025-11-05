import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Container } from 'react-bootstrap';

const Home = () => {
  return (
    <div className="d-flex flex-column justify-content-center align-items-center min-vh-100 bg-light">
      <div className="text-center">
        <h1 className="text-primary mb-2">
          <i className="bi bi-cloud-arrow-up"></i> SUPFile
        </h1>
        <p className="text-muted">Cloud Storage Platform</p>
        
        <div className="alert alert-success mt-4" role="alert">
          <i className="bi bi-check-circle me-2"></i> 
          Application en cours de développement
        </div>
        
        <p className="text-muted small">Architecture 3-tiers opérationnelle</p>
        
        <div className="mt-4">
          <Link to="/login">
            <Button variant="primary" className="me-2">Se connecter</Button>
          </Link>
          <Link to="/register">
            <Button variant="outline-primary">S'inscrire</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;