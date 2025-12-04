import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Container, Row, Col, Card } from 'react-bootstrap';

const Home = () => {
  return (
    <div className="min-vh-100">
      {/* Hero Section */}
      <section className="bg-primary text-white py-5">
        <Container>
          <Row className="align-items-center py-5">
            <Col lg={6} className="text-center text-lg-start mb-4 mb-lg-0">
              <h1 className="display-3 fw-bold mb-4">
                <i className="bi bi-cloud-arrow-up me-3"></i>
                SUPFile
              </h1>
              <h2 className="h3 mb-4">Votre espace de stockage cloud sécurisé</h2>
              <p className="lead mb-4">
                Stockez, gérez et partagez vos fichiers en toute sécurité. 
                30 Go d'espace gratuit pour démarrer.
              </p>
              <div className="d-flex gap-3 justify-content-center justify-content-lg-start">
                <Link to="/register">
                  <Button variant="light" size="lg" className="px-4">
                    <i className="bi bi-person-plus me-2"></i>
                    Commencer gratuitement
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline-light" size="lg" className="px-4">
                    Se connecter
                  </Button>
                </Link>
              </div>
            </Col>
            <Col lg={6} className="text-center">
              <i className="bi bi-cloud-check display-1" style={{ fontSize: '12rem', opacity: 0.9 }}></i>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-5 bg-light">
        <Container>
          <h2 className="text-center mb-5">Fonctionnalités principales</h2>
          <Row className="g-4">
            <Col md={4}>
              <Card className="h-100 border-0 shadow-sm text-center p-4">
                <Card.Body>
                  <i className="bi bi-shield-check text-primary display-4 mb-3"></i>
                  <Card.Title>Sécurisé</Card.Title>
                  <Card.Text className="text-muted">
                    Vos données sont chiffrées et protégées. Authentification OAuth2 disponible.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 border-0 shadow-sm text-center p-4">
                <Card.Body>
                  <i className="bi bi-folder-fill text-primary display-4 mb-3"></i>
                  <Card.Title>Organisation</Card.Title>
                  <Card.Text className="text-muted">
                    Créez des dossiers, déplacez vos fichiers et retrouvez-les facilement.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 border-0 shadow-sm text-center p-4">
                <Card.Body>
                  <i className="bi bi-share text-primary display-4 mb-3"></i>
                  <Card.Title>Partage</Card.Title>
                  <Card.Text className="text-muted">
                    Partagez vos fichiers avec des liens sécurisés en un clic.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 border-0 shadow-sm text-center p-4">
                <Card.Body>
                  <i className="bi bi-eye text-primary display-4 mb-3"></i>
                  <Card.Title>Prévisualisation</Card.Title>
                  <Card.Text className="text-muted">
                    Visualisez vos images, vidéos, PDF et documents directement en ligne.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 border-0 shadow-sm text-center p-4">
                <Card.Body>
                  <i className="bi bi-search text-primary display-4 mb-3"></i>
                  <Card.Title>Recherche</Card.Title>
                  <Card.Text className="text-muted">
                    Trouvez instantanément vos fichiers grâce à la recherche intelligente.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 border-0 shadow-sm text-center p-4">
                <Card.Body>
                  <i className="bi bi-trash text-primary display-4 mb-3"></i>
                  <Card.Title>Corbeille</Card.Title>
                  <Card.Text className="text-muted">
                    Restaurez vos fichiers supprimés depuis la corbeille.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Storage Section */}
      <section className="py-5">
        <Container>
          <Row className="align-items-center">
            <Col lg={6} className="mb-4 mb-lg-0">
              <h2 className="mb-4">30 Go d'espace gratuit</h2>
              <p className="lead text-muted mb-4">
                Commencez dès maintenant avec 30 Go d'espace de stockage gratuit. 
                Uploadez vos photos, vidéos, documents et bien plus encore.
              </p>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                  Upload de fichiers jusqu'à 5 Go
                </li>
                <li className="mb-2">
                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                  Dossiers et sous-dossiers illimités
                </li>
                <li className="mb-2">
                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                  Téléchargement de dossiers en ZIP
                </li>
                <li className="mb-2">
                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                  Partage sécurisé par lien
                </li>
              </ul>
            </Col>
            <Col lg={6} className="text-center">
              <div className="bg-primary bg-opacity-10 rounded p-5">
                <i className="bi bi-hdd-stack display-1 text-primary mb-3"></i>
                <h3 className="text-primary">30 GB</h3>
                <p className="text-muted">Espace de stockage gratuit</p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-5 bg-primary text-white">
        <Container className="text-center">
          <h2 className="mb-4">Prêt à commencer ?</h2>
          <p className="lead mb-4">
            Créez votre compte gratuitement en quelques secondes
          </p>
          <Link to="/register">
            <Button variant="light" size="lg" className="px-5">
              <i className="bi bi-person-plus me-2"></i>
              S'inscrire maintenant
            </Button>
          </Link>
        </Container>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-white py-4">
        <Container>
          <Row>
            <Col md={6} className="text-center text-md-start mb-3 mb-md-0">
              <h5>
                <i className="bi bi-cloud-arrow-up me-2"></i>
                SUPFile
              </h5>
              <p className="text-muted mb-0">Cloud Storage Platform</p>
            </Col>
            <Col md={6} className="text-center text-md-end">
              <p className="text-muted mb-0">
                Architecture 3-tiers | Sécurisé | Open Source
              </p>
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  );
};

export default Home;