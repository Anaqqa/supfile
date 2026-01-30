import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Button, Card, Table, Breadcrumb, Dropdown, Badge, Alert } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFileContext } from '../../contexts/FileContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatFileSize, formatDate } from '../../utils/formatters';
import FilePreview from './FilePreview';
import FileUpload from './FileUpload';
import Loading from '../Shared/Loading';
import ErrorMessage from '../Shared/ErrorMessage';
import CreateFolderModal from './CreateFolderModal';
import RenameModal from './RenameModal';
import MoveModal from './MoveModal';
import ShareModal from './ShareModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import CustomToast from '../Shared/CustomToast';



const FileExplorer = ({ searchQuery = '' }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    files, folders, currentFolder, loading, error, 
    fetchContents, createFolder, deleteItem, renameItem, moveItem,
    uploadFile, downloadFile, downloadFolder
  } = useFileContext();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [itemToRename, setItemToRename] = useState(null);
  const [filteredItems, setFilteredItems] = useState({ files: [], folders: [] });
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [itemToMove, setItemToMove] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [fileToShare, setFileToShare] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverFolder, setDragOverFolder] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [currentQuota, setCurrentQuota] = useState(0);
  const { user, refreshUser } = useAuth();

  const openShareModal = (file) => {
    setFileToShare(file);
    setShowShareModal(true);
  };

  const openDeleteModal = (item, isFolder) => {
    setItemToDelete({ ...item, isFolder });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    
    setIsDeleting(true);
    
    try {
      const success = await deleteItem(itemToDelete.id, itemToDelete.isFolder);
      
      if (success) {
        showToastNotification(
          `${itemToDelete.isFolder ? 'Dossier' : 'Fichier'} "${itemToDelete.name}" supprimé`,
          'success'
        );
        await fetchContents(currentFolder?.id || null);
      }
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      showToastNotification('Erreur lors de la suppression', 'error');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

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

  // Re-render automatique quand le quota change
  useEffect(() => {
    console.log('Quota mis à jour:', user?.storage_used);
  }, [user?.storage_used]);

  
  const handleDragStart = (e, item, isFolder) => {
    e.stopPropagation();
    
    const dragData = {
      id: item.id,
      name: item.name,
      isFolder: isFolder,
      folder_id: item.folder_id || item.parent_id
    };
    
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
    
    setDraggedItem(dragData);
    
    setTimeout(() => {
      e.target.style.opacity = '0.4';
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.stopPropagation();
    e.target.style.opacity = '1';
    setDraggedItem(null);
    setDragOverFolder(null);
  };

  const handleDragOver = (e, folder) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedItem) return;
    
    if (draggedItem.isFolder && draggedItem.id === folder.id) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }
    
    e.dataTransfer.dropEffect = 'move';
    setDragOverFolder(folder.id);
  };

  const handleDragLeave = (e, folder) => {
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      if (dragOverFolder === folder.id) {
        setDragOverFolder(null);
      }
    }
  };

  const handleDrop = async (e, targetFolder) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragOverFolder(null);
    
    let dragData;
    try {
      dragData = JSON.parse(e.dataTransfer.getData('application/json'));
    } catch (err) {
      console.error('Erreur de parsing:', err);
      return;
    }
    
    if (!dragData) return;
    
    if (dragData.isFolder && dragData.id === targetFolder.id) {
      showToastNotification('Impossible de déplacer un dossier sur lui-même', 'warning');
      return;
    }
    
    const currentFolderId = dragData.folder_id || null;
    if (currentFolderId === targetFolder.id) {
      showToastNotification(`L'élément est déjà dans "${targetFolder.name}"`, 'info');
      return;
    }
    
    try {
      const success = await moveItem(
        dragData.id, 
        targetFolder.id, 
        dragData.isFolder
      );
      
      if (success) {
        showToastNotification(
          `"${dragData.name}" déplacé vers "${targetFolder.name}"`,
          'success'
        );
        await fetchContents(currentFolder?.id || null);
      }
    } catch (err) {
      console.error('Erreur lors du déplacement:', err);
      showToastNotification('Erreur lors du déplacement', 'error');
    }
    
    setDraggedItem(null);
  };

  const handleDropOnRoot = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    let dragData;
    try {
      dragData = JSON.parse(e.dataTransfer.getData('application/json'));
    } catch (err) {
      return;
    }
    
    if (!dragData) return;
    
    const currentFolderId = dragData.folder_id || null;
    const targetFolderId = currentFolder?.id || null;
    
    if (currentFolderId === targetFolderId) {
      showToastNotification('L\'élément est déjà à cet emplacement', 'info');
      return;
    }
    
    try {
      const success = await moveItem(
        dragData.id, 
        targetFolderId || 0,
        dragData.isFolder
      );
      
      if (success) {
        const destination = currentFolder ? `"${currentFolder.name}"` : 'la racine';
        showToastNotification(
          `"${dragData.name}" déplacé vers ${destination}`,
          'success'
        );
        await fetchContents(currentFolder?.id || null);
      }
    } catch (err) {
      console.error('Erreur lors du déplacement:', err);
      showToastNotification('Erreur lors du déplacement', 'error');
    }
    
    setDraggedItem(null);
  };

  const showToastNotification = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

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

  const handleUploadComplete = () => {
    fetchContents(currentFolder?.id || null);
    window.location.reload();
  };

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <Container fluid>
      {/* Barre de navigation (breadcrumb uniquement) */}
      <Row className="mb-3 align-items-center">
        <Col md={12}>
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
      </Row>

      {/* Info Drag & Drop */}
      {draggedItem && (
        <Row className="mb-3">
          <Col>
            <Alert variant="info" className="mb-0 d-flex align-items-center">
              <i className="bi bi-arrow-left-right me-2"></i>
              <strong>Déplacement :</strong>
              <span className="ms-2">Glissez "{draggedItem.name}" sur un dossier ou dans la zone vide</span>
            </Alert>
          </Col>
        </Row>
      )}

      {/* Indicateur de recherche active */}
      {searchQuery && (
        <Row className="mb-3">
          <Col>
            <Alert variant="info" className="mb-0 d-flex align-items-center justify-content-between">
              <div>
                <i className="bi bi-search me-2"></i>
                <strong>Recherche active :</strong>
                <span className="ms-2">"{searchQuery}"</span>
                <Badge bg="primary" className="ms-2">
                  {filteredItems.files.length + filteredItems.folders.length} résultat(s)
                </Badge>
              </div>
            </Alert>
          </Col>
        </Row>
      )}

      {/* Actions avec quota */}
      <Row className="mb-3">
        <Col className="d-flex justify-content-between align-items-center">
          <div>
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
          </div>
          
          {/* Badge de quota */}
          {user && (
            <div className="storage-badge" key={`storage-${user.storage_used}`}>
              <div className="storage-badge-header">
                <i className="bi bi-hdd-fill"></i>
                <span className="storage-badge-text">
                  Stockage : <span className="used">{formatFileSize(user.storage_used)}</span> / {formatFileSize(user.storage_quota)}
                </span>
              </div>
              <div className="storage-progress-bar">
                <div 
                  className={`storage-progress-fill ${
                    (user.storage_used / user.storage_quota) * 100 > 90 ? 'danger' : 
                    (user.storage_used / user.storage_quota) * 100 > 75 ? 'warning' : ''
                  }`}
                  style={{ width: `${Math.min((user.storage_used / user.storage_quota) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          )}
        </Col>
      </Row>

      {/* Liste des fichiers et dossiers */}
      <Card>
        <Card.Body>
          <div 
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={handleDropOnRoot}
            style={{ minHeight: '300px' }}
          >
            <Table hover responsive className="mb-0">
              <thead>
                <tr>
                  <th style={{ width: '5%' }}></th>
                  <th style={{ width: '35%' }}>Nom</th>
                  <th style={{ width: '15%' }}>Type</th>
                  <th style={{ width: '15%' }}>Taille</th>
                  <th style={{ width: '15%' }}>Date</th>
                  <th style={{ width: '15%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Message si aucun résultat */}
                {filteredItems.folders.length === 0 && filteredItems.files.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      {searchQuery.trim() !== '' ? (
                        <>
                          <i className="bi bi-search text-muted fs-1 d-block mb-2"></i>
                          <p className="text-muted mb-0">Aucun résultat pour "{searchQuery}"</p>
                          <small className="text-muted">Essayez avec d'autres mots-clés</small>
                        </>
                      ) : (
                        <>
                          <i className="bi bi-folder2-open text-muted fs-1 d-block mb-2"></i>
                          <p className="text-muted mb-0">Ce dossier est vide</p>
                          <small className="text-muted">Glissez des fichiers ici ou utilisez le bouton "Importer"</small>
                        </>
                      )}
                    </td>
                  </tr>
                )}

                {/* Dossiers */}
                {filteredItems.folders.map((folder) => (
                  <tr 
                    key={`folder-${folder.id}`}
                    draggable="true"
                    onDragStart={(e) => handleDragStart(e, folder, true)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, folder)}
                    onDragLeave={(e) => handleDragLeave(e, folder)}
                    onDrop={(e) => handleDrop(e, folder)}
                    className={dragOverFolder === folder.id ? 'bg-primary bg-opacity-10' : ''}
                    style={{ 
                      cursor: 'grab',
                      transition: 'all 0.2s ease',
                      userSelect: 'none'
                    }}
                  >
                    <td className="text-center">
                      <i className="bi bi-grip-vertical text-muted" style={{ cursor: 'grab' }}></i>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <i className="bi bi-folder-fill text-warning me-2 fs-5"></i>
                        <span 
                          onClick={() => handleFolderClick(folder.id)}
                          style={{ cursor: 'pointer' }}
                          className="text-decoration-none"
                        >
                          {folder.name}
                        </span>
                        {dragOverFolder === folder.id && (
                          <Badge bg="primary" className="ms-2">
                            <i className="bi bi-box-arrow-in-down me-1"></i>
                            Déposer ici
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td>Dossier</td>
                    <td>-</td>
                    <td>{formatDate(folder.created_at)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <Dropdown>
                        <Dropdown.Toggle variant="light" size="sm">
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
                            onClick={() => openDeleteModal(folder, true)}
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
                  <tr 
                    key={`file-${file.id}`}
                    draggable="true"
                    onDragStart={(e) => handleDragStart(e, file, false)}
                    onDragEnd={handleDragEnd}
                    style={{ 
                      cursor: 'grab',
                      transition: 'opacity 0.2s ease',
                      userSelect: 'none'
                    }}
                  >
                    <td className="text-center">
                      <i className="bi bi-grip-vertical text-muted" style={{ cursor: 'grab' }}></i>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <i className={`bi bi-file-earmark me-2 fs-5 ${getFileIcon(file.mime_type)}`}></i>
                        <span 
                          onClick={() => handleFileClick(file)}
                          style={{ cursor: 'pointer' }}
                          className="text-decoration-none"
                        >
                          {file.name}
                        </span>
                      </div>
                    </td>
                    <td>{getFileType(file.mime_type)}</td>
                    <td>{formatFileSize(file.size)}</td>
                    <td>{formatDate(file.created_at)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <Dropdown>
                        <Dropdown.Toggle variant="light" size="sm">
                          <i className="bi bi-three-dots"></i>
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => handleFileClick(file)}>
                            <i className="bi bi-eye me-2"></i> Prévisualiser
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => downloadFile(file.id)}>
                            <i className="bi bi-download me-2"></i> Télécharger
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => openShareModal(file)}>
                            <i className="bi bi-share me-2"></i> Partager
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
                            onClick={() => openDeleteModal(file, false)}
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
          </div>
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

      <ShareModal
        show={showShareModal}
        onHide={() => setShowShareModal(false)}
        file={fileToShare}
      />

      <DeleteConfirmModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        item={itemToDelete}
        itemType={itemToDelete?.isFolder ? 'dossier' : 'fichier'}
        loading={isDeleting}
      />

      {/* Toast de notification */}
      <CustomToast
        show={showToast}
        onClose={() => setShowToast(false)}
        message={toastMessage}
        type={toastType}
        icon={toastType === 'success' ? 'check-circle-fill' : toastType === 'error' ? 'x-circle-fill' : 'info-circle-fill'}
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