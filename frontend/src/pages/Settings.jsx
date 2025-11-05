import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';

const Settings = () => {
  const { user, refreshUser } = useAuth();
  
  const [profile, setProfile] = useState({
    full_name: '',
  });
  
  const [password, setPassword] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  
  const [oauthConnections, setOauthConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  useEffect(() => {
    if (user) {
      setProfile({
        full_name: user.full_name || '',
      });
      
      loadOAuthConnections();
    }
  }, [user]);
  
  const loadOAuthConnections = async () => {
    try {
      const connections = await userService.getOAuthConnections();
      setOauthConnections(connections);
      setLoading(false);
    } catch (err) {
      console.error('Erreur de chargement des connexions OAuth:', err);
      setLoading(false);
    }
  };
  
  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };
  
  const handlePasswordChange = (e) => {
    setPassword({ ...password, [e.target.name]: e.target.value });
  };
  
  const updateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      await userService.updateProfile(profile);
      await refreshUser();
      setSuccess('Profil mis à jour avec succès');
    } catch (err) {
      setError('Échec de la mise à jour: ' + (err.response?.data?.detail || err.message));
    }
  };
  
  const changePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (password.new_password !== password.confirm_password) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (password.new_password.length < 8) {
      setError('Le mot de passe doit comporter au moins 8 caractères');
      return;
    }
    
    try {
      await userService.changePassword(password.current_password, password.new_password);
      setPassword({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      setSuccess('Mot de passe modifié avec succès');
    } catch (err) {
      setError('Échec du changement de mot de passe: ' + (err.response?.data?.detail || err.message));
    }
  };
  
  const disconnectOAuth = async (provider) => {
    try {
      await userService.disconnectOAuth(provider);
      setSuccess(`Déconnexion de ${provider} réussie`);
      loadOAuthConnections();
    } catch (err) {
      setError(`Déconnexion impossible: ` + (err.response?.data?.detail || err.message));
    }
  };
  
  if (loading && !user) {
    return (
      <Container className="py-4">
        <div className="text-center">Chargement...</div>
      </Container>
    );
  }
  
  return (
    <Container className="py-4">
      <h1 className="mb-4">Paramètres du compte</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      
      <Row>
        <Col md={6} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Profil</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={updateProfile}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control 
                    type="email" 
                    value={user?.email || ''} 
                    disabled 
                  />
                  <Form.Text className="text-muted">
                    L'email ne peut pas être modifié
                  </Form.Text>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Nom complet</Form.Label>
                  <Form.Control
                    type="text"
                    name="full_name"
                    value={profile.full_name}
                    onChange={handleProfileChange}
                    placeholder="Votre nom complet"
                  />
                </Form.Group>
                
                <Button variant="primary" type="submit">
                  Mettre à jour le profil
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Mot de passe</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={changePassword}>
                <Form.Group className="mb-3">
                  <Form.Label>Mot de passe actuel</Form.Label>
                  <Form.Control
                    type="password"
                    name="current_password"
                    value={password.current_password}
                    onChange={handlePasswordChange}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Nouveau mot de passe</Form.Label>
                  <Form.Control
                    type="password"
                    name="new_password"
                    value={password.new_password}
                    onChange={handlePasswordChange}
                    required
                  />
                  <Form.Text className="text-muted">
                    Au moins 8 caractères
                  </Form.Text>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Confirmer le mot de passe</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirm_password"
                    value={password.confirm_password}
                    onChange={handlePasswordChange}
                    required
                  />
                </Form.Group>
                
                <Button variant="primary" type="submit">
                  Changer le mot de passe
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col md={12}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Connexions externes</h5>
            </Card.Header>
            <Card.Body>
              {oauthConnections.length > 0 ? (
                oauthConnections.map((connection) => (
                  <div key={connection.provider} className="d-flex justify-content-between align-items-center mb-2">
                    <div>
                      <strong>{connection.provider.charAt(0).toUpperCase() + connection.provider.slice(1)}</strong>
                      <span className="text-muted ms-2">Connecté</span>
                    </div>
                    <Button 
                      variant="outline-danger" 
                      size="sm" 
                      onClick={() => disconnectOAuth(connection.provider)}
                    >
                      Déconnecter
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-muted mb-0">Aucune connexion externe active</p>
              )}
              
              {!oauthConnections.some(c => c.provider === 'google') && (
                <Button 
                  variant="outline-primary" 
                  className="mt-3"
                  href={`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/auth/google`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-google me-2" viewBox="0 0 16 16">
                    <path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.431H8v-3.08h7.545z"/>
                  </svg>
                  Connecter avec Google
                </Button>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Settings;