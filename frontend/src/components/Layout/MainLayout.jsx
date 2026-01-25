import React, { useState } from 'react';
import { Container, Navbar, Nav } from 'react-bootstrap';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/dashboard?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/dashboard');
    }
  };

  const isDashboard = location.pathname === '/dashboard';

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar className="modern-navbar" variant="dark" expand="lg">
        <Container fluid>
          <Navbar.Brand as={Link} to="/dashboard">
            <i className="bi bi-cloud-arrow-up"></i>
            SUPFile
          </Navbar.Brand>

          {/* RECHERCHE INTÉGRÉE */}
          {isDashboard && (
            <div className="navbar-search-wrapper d-none d-lg-block">
              <form onSubmit={handleSearchSubmit} className="navbar-search">
                <input
                  type="text"
                  placeholder="Rechercher des fichiers..."
                  value={searchQuery}
                  onChange={handleSearch}
                />
                <i className="bi bi-search search-icon"></i>
              </form>
            </div>
          )}

          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link 
                as={NavLink} 
                to="/dashboard"
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                <i className="bi bi-grid me-1"></i>
                Fichiers
              </Nav.Link>
              <Nav.Link 
                as={NavLink} 
                to="/trash"
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                <i className="bi bi-trash me-1"></i>
                Corbeille
              </Nav.Link>
              <Nav.Link 
                as={NavLink} 
                to="/settings"
                className={({ isActive }) => isActive ? 'active' : ''}
              >
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
      
      <div className="flex-grow-1">
        {children}
      </div>
      
      <footer className="bg-light text-center p-3 mt-auto border-top">
        <p className="text-muted mb-0 small">SUPFile - Cloud Storage Platform</p>
      </footer>
    </div>
  );
};

export default MainLayout;