import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const errorParam = params.get('error');
        
        if (errorParam) {
          setError(decodeURIComponent(errorParam));
          setLoading(false);
          return;
        }
        
        if (!token) {
          setError('Aucun token reçu');
          setLoading(false);
          return;
        }
        
        await login(token);
        navigate('/dashboard');
      } catch (err) {
        setError('Échec de connexion: ' + (err.response?.data?.detail || err.message));
        setLoading(false);
      }
    };
    
    handleCallback();
  }, [location.search, navigate, login]);
  
  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Authentification en cours...</p>
        </div>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          <Alert.Heading>Erreur d'authentification</Alert.Heading>
          <p>{error}</p>
          <hr />
          <div className="d-flex justify-content-end">
            <button 
              onClick={() => navigate('/login')} 
              className="btn btn-outline-danger"
            >
              Retour à la connexion
            </button>
          </div>
        </Alert>
      </Container>
    );
  }
  
  return null;
};

export default AuthCallback;