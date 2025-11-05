import React from 'react';
import { Container, Navbar, Nav, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar bg="primary" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand as={Link} to="/dashboard">
            <i className="bi bi-cloud-arrow-up me-2"></i>
            SUPFile
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/dashboard">Tableau de bord</Nav.Link>
              <Nav.Link as={Link} to="/trash">Corbeille</Nav.Link>
            </Nav>
            <Nav>
              <Nav.Link as={Link} to="/settings">
                <i className="bi bi-gear me-1"></i>
                Paramètres
              </Nav.Link>
              <Nav.Link onClick={handleLogout}>
                <i className="bi bi-box-arrow-right me-1"></i>
                Déconnexion
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      
      <div className="flex-grow-1 py-4">
        <Container>
          {children}
        </Container>
      </div>
      
      <footer className="bg-light text-center p-3 mt-auto">
        <p className="text-muted mb-0">SUPFile - Cloud Storage Platform</p>
      </footer>
    </div>
  );
};

export default MainLayout;