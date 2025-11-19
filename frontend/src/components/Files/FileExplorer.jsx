import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Button, Card, Table, Breadcrumb, Dropdown, Form, InputGroup } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFileContext } from '../../contexts/FileContext';
import { formatFileSize, formatDate } from '../../utils/formatters';
import FilePreview from './FilePreview';
import FileUpload from './FileUpload';
import Loading from '../Shared/Loading';
import ErrorMessage from '../Shared/ErrorMessage';
import CreateFolderModal from './CreateFolderModal';
import RenameModal from './RenameModal';
import MoveModal from './MoveModal'; 

const FileExplorer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    files, folders, currentFolder, loading, error, 
    fetchContents, createFolder, deleteItem, renameItem, moveItem,
    uploadFile, downloadFile, downloadFolder
  } = useFileContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [itemToRename, setItemToRename] = useState(null);
  const [filteredItems, setFilteredItems] = useState({ files: [], folders: [] });
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [showMoveModal, setShowMoveModal] = useState(false);        
  const [itemToMove, setItemToMove] = useState(null);  

  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const folderId = params.get('folder') ? parseInt(params.get('folder')) : null;
    fetchContents(folderId);
  }, [location.search, fetchContents]);

  
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredItems({ files, folders });
    } else {
      const term = searchQuery.toLowerCase();
      const filteredFiles = files.filter(file => file.name.toLowerCase().includes(term));
      const filteredFolders = folders.filter(folder => folder.name.toLowerCase().includes(term));
      setFilteredItems({ files: filteredFiles, folders: filteredFolders });
    }
  }, [files, folders, searchQuery]);

  
  useEffect(() => {
    if (currentFolder) {
      
      
      const breadcrumbsList = [
        { id: null, name: 'Racine', path: '/dashboard' },
        { id: currentFolder.id, name: currentFolder.name, path: `/dashboard?folder=${currentFolder.id}` }
      ];
      setBreadcrumbs(breadcrumbsList);
    } else {
      setBreadcrumbs([{ id: null, name: 'Racine', path: '/dashboard' }]);
    }
  }, [currentFolder]);

  const handleFolderClick = (folderId) => {
    navigate(`/dashboard?folder=${folderId}`);
  };

  const handleFileClick = (file) => {
    setSelectedFile(file);
    setShowPreview(true);
  };

  const handleCreateFolder = async (folderName) => {
    await createFolder(folderName, currentFolder?.id || null);
    setShowCreateModal(false);
  };

  const handleDelete = async (item, isFolder) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${isFolder ? 'ce dossier' : 'ce fichier'} ?`)) {
      await deleteItem(item.id, isFolder);
      await fetchContents(currentFolder?.id || null);
    }
  };

  const handleRename = async (newName) => {
    if (itemToRename) {
      await renameItem(itemToRename.id, newName, itemToRename.isFolder);
      setShowRenameModal(false);
      setItemToRename(null);
    }
  };

  const handleMove = async (newFolderId) => {
    if (itemToMove) {
      await moveItem(itemToMove.id, newFolderId, itemToMove.isFolder);
      setShowMoveModal(false);
      setItemToMove(null);
      await fetchContents(currentFolder?.id || null);
    }
  };

  const openRenameModal = (item, isFolder) => {
    setItemToRename({ ...item, isFolder });
    setShowRenameModal(true);
  };

  const openMoveModal = (item, isFolder) => {
    setItemToMove({ ...item, isFolder });
    setShowMoveModal(true);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleUploadComplete = () => {
    fetchContents(currentFolder?.id || null);
  };

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <Container fluid>
      {/* Barre de navigation et recherche */}
      <Row className="mb-3 align-items-center">
        <Col md={6}>
          <Breadcrumb>
            {breadcrumbs.map((item, index) => (
              <Breadcrumb.Item 
                key={index}
                href={item.path}
                active={index === breadcrumbs.length - 1}
              >
                {item.name}
              </Breadcrumb.Item>
            ))}
          </Breadcrumb>
        </Col>
        <Col md={6}>
          <InputGroup>
            <Form.Control
              placeholder="Rechercher des fichiers..."
              value={searchQuery}
              onChange={handleSearch}
            />
            <Button variant="outline-secondary" onClick={() => setSearchQuery('')}>
              <i className="bi bi-x-circle"></i>
            </Button>
          </InputGroup>
        </Col>
      </Row>

      {/* Actions */}
      <Row className="mb-3">
        <Col>
          <FileUpload 
            currentFolderId={currentFolder?.id || null}
            onUploadComplete={handleUploadComplete}
          />
          <Button 
            variant="outline-primary" 
            className="ms-2"
            onClick={() => setShowCreateModal(true)}
          >
            <i className="bi bi-folder-plus me-1"></i> Nouveau dossier
          </Button>
        </Col>
      </Row>

      {/* Liste des fichiers et dossiers */}
      <Card>
        <Card.Body>
          <Table hover responsive>
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Nom</th>
                <th style={{ width: '15%' }}>Type</th>
                <th style={{ width: '15%' }}>Taille</th>
                <th style={{ width: '15%' }}>Date</th>
                <th style={{ width: '15%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.folders.length === 0 && filteredItems.files.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    <i className="bi bi-folder2-open text-muted fs-1 d-block mb-2"></i>
                    <p className="text-muted">Ce dossier est vide</p>
                  </td>
                </tr>
              )}

              {/* Dossiers */}
              {filteredItems.folders.map((folder) => (
                <tr key={`folder-${folder.id}`}>
                  <td>
                    <div className="d-flex align-items-center">
                      <i className="bi bi-folder-fill text-warning me-2 fs-5"></i>
                      <span 
                        className="folder-name cursor-pointer"
                        onClick={() => handleFolderClick(folder.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        {folder.name}
                      </span>
                    </div>
                  </td>
                  <td>Dossier</td>
                  <td>-</td>
                  <td>{formatDate(folder.created_at)}</td>
                  <td>
                    <Dropdown>
                      <Dropdown.Toggle variant="light" size="sm" id={`dropdown-${folder.id}`}>
                        <i className="bi bi-three-dots"></i>
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => openRenameModal(folder, true)}>
                          <i className="bi bi-pencil me-2"></i> Renommer
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => openMoveModal(folder, true)}> 
                          <i className="bi bi-folder-symlink me-2"></i> Déplacer
                        </Dropdown.Item>  
                        <Dropdown.Item onClick={() => downloadFolder(folder.id)}>
                          <i className="bi bi-download me-2"></i> Télécharger (ZIP)
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item 
                          className="text-danger"
                          onClick={() => handleDelete(folder, true)}
                        >
                          <i className="bi bi-trash me-2"></i> Supprimer
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </td>
                </tr>
              ))}

              {/* Fichiers */}
              {filteredItems.files.map((file) => (
                <tr key={`file-${file.id}`}>
                  <td>
                    <div className="d-flex align-items-center">
                      <i className={`bi bi-file-earmark me-2 fs-5 ${getFileIcon(file.mime_type)}`}></i>
                      <span 
                        className="file-name cursor-pointer"
                        onClick={() => handleFileClick(file)}
                        style={{ cursor: 'pointer' }}
                      >
                        {file.name}
                      </span>
                    </div>
                  </td>
                  <td>{getFileType(file.mime_type)}</td>
                  <td>{formatFileSize(file.size)}</td>
                  <td>{formatDate(file.created_at)}</td>
                  <td>
                    <Dropdown>
                      <Dropdown.Toggle variant="light" size="sm" id={`dropdown-${file.id}`}>
                        <i className="bi bi-three-dots"></i>
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => handleFileClick(file)}>
                          <i className="bi bi-eye me-2"></i> Prévisualiser
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => downloadFile(file.id)}>
                          <i className="bi bi-download me-2"></i> Télécharger
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => openRenameModal(file, false)}>
                          <i className="bi bi-pencil me-2"></i> Renommer
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => openMoveModal(file, false)}> 
                          <i className="bi bi-folder-symlink me-2"></i> Déplacer
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item 
                          className="text-danger"
                          onClick={() => handleDelete(file, false)}
                        >
                          <i className="bi bi-trash me-2"></i> Supprimer
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Modales */}
      <CreateFolderModal 
        show={showCreateModal} 
        onHide={() => setShowCreateModal(false)} 
        onCreate={handleCreateFolder} 
      />

      <RenameModal 
        show={showRenameModal} 
        onHide={() => setShowRenameModal(false)} 
        onRename={handleRename} 
        initialName={itemToRename?.name || ''} 
        itemType={itemToRename?.isFolder ? 'dossier' : 'fichier'} 
      />
      <MoveModal
        show={showMoveModal}
        onHide={() => setShowMoveModal(false)}
        onMove={handleMove}
        item={itemToMove}
        itemType={itemToMove?.isFolder ? 'dossier' : 'fichier'}
      />
      <FilePreview 
        show={showPreview} 
        onHide={() => setShowPreview(false)} 
        file={selectedFile} 
        onDownload={downloadFile}
      />
    </Container>
  );
};


const getFileIcon = (mimeType) => {
  if (!mimeType) return 'text-secondary';
  if (mimeType.startsWith('image/')) return 'text-success';
  if (mimeType.startsWith('video/')) return 'text-danger';
  if (mimeType.startsWith('audio/')) return 'text-info';
  if (mimeType.startsWith('text/')) return 'text-primary';
  if (mimeType.includes('pdf')) return 'text-danger';
  if (mimeType.includes('word')) return 'text-primary';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'text-success';
  if (mimeType.includes('presentation')) return 'text-warning';
  
  return 'text-secondary';
};

const getFileType = (mimeType) => {
  if (!mimeType) return 'Fichier';
  
  if (mimeType.startsWith('image/')) return 'Image';
  if (mimeType.startsWith('video/')) return 'Vidéo';
  if (mimeType.startsWith('audio/')) return 'Audio';
  if (mimeType.startsWith('text/')) return 'Texte';
  if (mimeType.includes('pdf')) return 'PDF';
  if (mimeType.includes('word')) return 'Document';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'Tableur';
  if (mimeType.includes('presentation')) return 'Présentation';
  
  return 'Fichier';
};

export default FileExplorer;