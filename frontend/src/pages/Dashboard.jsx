import React from 'react';
import { Container, Button, Row, Col, Card, Nav } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Tableau de bord</h1>
        <Button variant="outline-danger" onClick={handleLogout}>
          Se déconnecter
        </Button>
      </div>
      
      <div className="alert alert-success mb-4">
        <h4 className="alert-heading">Bienvenue, {user?.full_name || user?.email}!</h4>
        <p>Vous êtes maintenant connecté à votre compte SUPFile.</p>
      </div>
      
      <Row>
        <Col md={4}>
          <Card className="mb-4 text-center">
            <Card.Body>
              <h1 className="display-4 text-primary">0</h1>
              <Card.Title>Fichiers</Card.Title>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="mb-4 text-center">
            <Card.Body>
              <h1 className="display-4 text-primary">0</h1>
              <Card.Title>Dossiers</Card.Title>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="mb-4 text-center">
            <Card.Body>
              <h1 className="display-4 text-primary">0 MB</h1>
              <Card.Title>Espace utilisé</Card.Title>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Card>
        <Card.Body>
          <Card.Title>Activité récente</Card.Title>
          <div className="alert alert-info">
            Aucune activité récente. Commencez par uploader des fichiers !
          </div>
          <Button variant="primary">
            Uploader un fichier
          </Button>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Dashboard;