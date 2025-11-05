import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useFileContext } from '../contexts/FileContext';
import { formatFileSize } from '../utils/formatters';
import FileExplorer from '../components/Files/FileExplorer';

const Dashboard = () => {
  const { user } = useAuth();
  const { files, folders, loading } = useFileContext();
  const [storageStats, setStorageStats] = useState({
    used: user?.storage_used || 0,
    quota: user?.storage_quota || 0,
    percentage: 0
  });

  useEffect(() => {
    if (user) {
      const used = user.storage_used || 0;
      const quota = user.storage_quota || 32212254720; 
      const percentage = quota > 0 ? Math.round((used / quota) * 100) : 0;

      setStorageStats({
        used,
        quota,
        percentage
      });
    }
  }, [user]);

  return (
    <Container fluid>
      <h1 className="mb-4">Tableau de bord</h1>
      
      {/* Cartes statistiques */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="mb-4 text-center">
            <Card.Body>
              <h1 className="display-4 text-primary">{files?.length || 0}</h1>
              <Card.Title>Fichiers</Card.Title>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="mb-4 text-center">
            <Card.Body>
              <h1 className="display-4 text-primary">{folders?.length || 0}</h1>
              <Card.Title>Dossiers</Card.Title>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="mb-4 text-center">
            <Card.Body>
              <h1 className="display-4 text-primary">{formatFileSize(storageStats.used)}</h1>
              <Card.Title>Espace utilisé</Card.Title>
              <div className="mt-2">
                <div className="progress">
                  <div 
                    className={`progress-bar ${storageStats.percentage > 90 ? 'bg-danger' : storageStats.percentage > 70 ? 'bg-warning' : 'bg-success'}`}
                    role="progressbar" 
                    style={{ width: `${storageStats.percentage}%` }} 
                    aria-valuenow={storageStats.percentage} 
                    aria-valuemin="0" 
                    aria-valuemax="100"
                  >
                    {storageStats.percentage}%
                  </div>
                </div>
                <small className="text-muted mt-1 d-block">
                  {formatFileSize(storageStats.used)} / {formatFileSize(storageStats.quota)}
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Explorateur de fichiers */}
      <FileExplorer />
    </Container>
  );
};

export default Dashboard;