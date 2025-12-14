import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Container, Row, Col } from 'react-bootstrap';

const Home = () => {
  return (
    <div>
      {/* Hero Section */}
      <section className="home-hero">
        <Container>
          <Row className="align-items-center">
            <Col lg={8} className="text-lg-start text-center">
              <div className="home-brand">
                <i className="bi bi-cloud-arrow-up"></i>
                <span>SUPFile</span>
              </div>
              
              <h1 className="home-title">
                Stockez vos fichiers en toute sécurité
              </h1>
              
              <p className="home-subtitle">
                Une plateforme de stockage cloud moderne, sécurisée et intuitive. 
                Accédez à vos fichiers partout, à tout moment.
              </p>
              
              <div className="home-cta-buttons">
                <Link to="/register" className="home-btn-primary">
                  Commencer gratuitement
                  <i className="bi bi-arrow-right ms-2"></i>
                </Link>
                <Link to="/login" className="home-btn-secondary">
                  Se connecter
                </Link>
              </div>
              
              <div className="home-features">
                <div className="home-feature-badge">
                  <i className="bi bi-check-circle-fill"></i>
                  <span>30 Go gratuits</span>
                </div>
                <div className="home-feature-badge">
                  <i className="bi bi-check-circle-fill"></i>
                  <span>Chiffrement sécurisé</span>
                </div>
                <div className="home-feature-badge">
                  <i className="bi bi-check-circle-fill"></i>
                  <span>Partage facile</span>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section className="home-features-section">
        <Container>
          <h2 className="home-section-title">Pourquoi choisir SUPFile ?</h2>
          <p className="home-section-subtitle">
            Une solution complète pour tous vos besoins de stockage
          </p>
          
          <Row className="g-4">
            <Col md={4}>
              <div className="home-feature-card">
                <div className="home-feature-icon">
                  <i className="bi bi-shield-check"></i>
                </div>
                <h3 className="home-feature-title">Sécurité maximale</h3>
                <p className="home-feature-description">
                  Vos fichiers sont chiffrés et protégés avec les dernières technologies de sécurité.
                </p>
              </div>
            </Col>
            
            <Col md={4}>
              <div className="home-feature-card">
                <div className="home-feature-icon">
                  <i className="bi bi-lightning-charge"></i>
                </div>
                <h3 className="home-feature-title">Rapide et fiable</h3>
                <p className="home-feature-description">
                  Upload et téléchargement ultra-rapides avec une infrastructure hautement disponible.
                </p>
              </div>
            </Col>
            
            <Col md={4}>
              <div className="home-feature-card">
                <div className="home-feature-icon">
                  <i className="bi bi-share"></i>
                </div>
                <h3 className="home-feature-title">Partage simple</h3>
                <p className="home-feature-description">
                  Partagez vos fichiers en un clic avec des liens sécurisés et personnalisables.
                </p>
              </div>
            </Col>
            
            <Col md={4}>
              <div className="home-feature-card">
                <div className="home-feature-icon">
                  <i className="bi bi-folder-check"></i>
                </div>
                <h3 className="home-feature-title">Organisation facile</h3>
                <p className="home-feature-description">
                  Gérez vos fichiers et dossiers avec une interface intuitive et moderne.
                </p>
              </div>
            </Col>
            
            <Col md={4}>
              <div className="home-feature-card">
                <div className="home-feature-icon">
                  <i className="bi bi-eye"></i>
                </div>
                <h3 className="home-feature-title">Prévisualisation</h3>
                <p className="home-feature-description">
                  Visualisez vos images, vidéos et documents directement dans le navigateur.
                </p>
              </div>
            </Col>
            
            <Col md={4}>
              <div className="home-feature-card">
                <div className="home-feature-icon">
                  <i className="bi bi-phone"></i>
                </div>
                <h3 className="home-feature-title">Multi-plateforme</h3>
                <p className="home-feature-description">
                  Accédez à vos fichiers depuis n'importe quel appareil, où que vous soyez.
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="home-cta-section">
        <Container>
          <h2 className="home-cta-title">Prêt à commencer ?</h2>
          <p className="home-cta-description">
            Rejoignez des milliers d'utilisateurs qui font confiance à SUPFile pour stocker leurs fichiers.
          </p>
          <Link to="/register" className="home-btn-primary">
            Créer un compte gratuit
            <i className="bi bi-arrow-right ms-2"></i>
          </Link>
        </Container>
      </section>

      {/* Footer */}
      <footer className="bg-light text-center p-4 border-top">
        <Container>
          <div className="mb-3">
            <i className="bi bi-cloud-arrow-up text-gradient" style={{ fontSize: '2rem' }}></i>
            <h5 className="mt-2">SUPFile</h5>
          </div>
          <p className="text-muted mb-0">Cloud Storage Platform - Stockage sécurisé et fiable</p>
        </Container>
      </footer>
    </div>
  );
};

export default Home;