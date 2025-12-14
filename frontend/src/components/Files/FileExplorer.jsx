import React, { useState, useEffect } from 'react';
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
import ShareModal from './ShareModal';

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
  const [showShareModal, setShowShareModal] = useState(false);
  const [fileToShare, setFileToShare] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' ou 'grid'
  
  // États pour le drag & drop
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverFolder, setDragOverFolder] = useState(null);

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
        { id: null, name: 'Mes fichiers', path: '/dashboard' },
        { id: currentFolder.id, name: currentFolder.name, path: `/dashboard?folder=${currentFolder.id}` }
      ];
      setBreadcrumbs(breadcrumbsList);
    } else {
      setBreadcrumbs([{ id: null, name: 'Mes fichiers', path: '/dashboard' }]);
    }
  }, [currentFolder]);

  // ====================================
  // DRAG & DROP HANDLERS
  // ====================================

  const handleDragStart = (e, item, isFolder) => {
    setDraggedItem({ ...item, isFolder });
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => e.currentTarget.classList.add('dragging'), 0);
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('dragging');
    setDraggedItem(null);
    setDragOverFolder(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, folderId) => {
    e.preventDefault();
    if (draggedItem && (!draggedItem.isFolder || draggedItem.id !== folderId)) {
      setDragOverFolder(folderId);
    }
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverFolder(null);
    }
  };

  const handleDrop = async (e, targetFolderId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedItem) return;

    if (draggedItem.isFolder && draggedItem.id === targetFolderId) {
      setDragOverFolder(null);
      return;
    }

    try {
      await moveItem(draggedItem.id, targetFolderId, draggedItem.isFolder);
      await fetchContents(currentFolder?.id || null);
    } catch (error) {
      console.error('Erreur lors du déplacement:', error);
    } finally {
      setDraggedItem(null);
      setDragOverFolder(null);
    }
  };

  // ====================================
  // AUTRES HANDLERS
  // ====================================

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

  const openShareModal = (file) => {
    setFileToShare(file);
    setShowShareModal(true);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleUploadComplete = () => {
    fetchContents(currentFolder?.id || null);
  };

  // ====================================
  // HELPER FUNCTIONS - ICÔNES COLORÉES
  // ====================================

  const getFileIconClass = (mimeType) => {
    if (!mimeType) return 'bi-file-earmark icon-default';
    if (mimeType.startsWith('image/')) return 'bi-file-earmark-image-fill icon-image';
    if (mimeType.startsWith('video/')) return 'bi-camera-video-fill icon-video';
    if (mimeType.startsWith('audio/')) return 'bi-file-earmark-music-fill icon-audio';
    if (mimeType.includes('pdf')) return 'bi-file-earmark-pdf-fill icon-pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'bi-file-earmark-word-fill icon-word';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'bi-file-earmark-excel-fill icon-excel';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'bi-file-earmark-slides-fill icon-powerpoint';
    if (mimeType.startsWith('text/')) return 'bi-file-earmark-text-fill icon-text';
    return 'bi-file-earmark icon-default';
  };

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <>
      {/* COMMAND BAR */}
      <div className="command-bar">
        <FileUpload 
          currentFolderId={currentFolder?.id || null}
          onUploadComplete={handleUploadComplete}
        />
        <button 
          className="cmd-btn"
          onClick={() => setShowCreateModal(true)}
        >
          <i className="bi bi-folder-plus"></i>
          <span>Nouveau dossier</span>
        </button>
      </div>

      <Container fluid>
        {/* HEADER : BREADCRUMB + STATS + VIEW TOGGLE */}
        <div className="explorer-header-bar">
          <div className="header-left">
            <Breadcrumb className="compact-breadcrumb">
              {breadcrumbs.map((item, index) => (
                <Breadcrumb.Item 
                  key={index}
                  href={item.path}
                  active={index === breadcrumbs.length - 1}
                >
                  {index === 0 && <i className="bi bi-house-door me-1"></i>}
                  {item.name}
                </Breadcrumb.Item>
              ))}
            </Breadcrumb>
          </div>

          <div className="header-center">
            {/* STATS EN BADGES */}
            <div className="compact-stats">
              <div className="stat-badge">
                <i className="bi bi-file-earmark"></i>
                <span className="stat-number">{files?.length || 0}</span>
                <span>fichiers</span>
              </div>
              <div className="stat-badge">
                <i className="bi bi-folder"></i>
                <span className="stat-number">{folders?.length || 0}</span>
                <span>dossiers</span>
              </div>
            </div>
          </div>

          <div className="header-right">
            {/* VIEW TOGGLE */}
            <div className="view-toggle-compact">
              <button 
                className={`view-btn-compact ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="Vue liste"
              >
                <i className="bi bi-list-ul"></i>
              </button>
              <button 
                className={`view-btn-compact ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Vue grille"
              >
                <i className="bi bi-grid"></i>
              </button>
            </div>
          </div>
        </div>

        {/* FILES TABLE */}
        <Card className="files-card">
          <Card.Body className="p-0">
            <Table className="modern-table" hover responsive>
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Nom</th>
                  <th style={{ width: '18%' }}>Modifié</th>
                  <th style={{ width: '12%' }}>Modifié par</th>
                  <th style={{ width: '18%' }}>Taille</th>
                  <th style={{ width: '12%' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.folders.length === 0 && filteredItems.files.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-5">
                      <i className="bi bi-folder2-open" style={{ fontSize: '4rem', color: '#dee2e6' }}></i>
                      <p className="text-muted mt-3">Ce dossier est vide</p>
                    </td>
                  </tr>
                )}

                {/* DOSSIERS */}
                {filteredItems.folders.map((folder) => (
                  <tr 
                    key={`folder-${folder.id}`}
                    className={`draggable-item drop-zone ${dragOverFolder === folder.id ? 'drag-over' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, folder, true)}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => handleDragEnter(e, folder.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, folder.id)}
                  >
                    <td>
                      <div className="folder-item" onClick={() => handleFolderClick(folder.id)}>
                        <i className="bi bi-folder-fill item-icon icon-folder"></i>
                        <span className="item-name">{folder.name}</span>
                      </div>
                    </td>
                    <td>{formatDate(folder.created_at)}</td>
                    <td>Vous</td>
                    <td>—</td>
                    <td>
                      <Dropdown className="actions-dropdown">
                        <Dropdown.Toggle variant="light" size="sm">
                          <i className="bi bi-three-dots"></i>
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => openRenameModal(folder, true)}>
                            <i className="bi bi-pencil"></i> Renommer
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => openMoveModal(folder, true)}>
                            <i className="bi bi-folder-symlink"></i> Déplacer
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => downloadFolder(folder.id)}>
                            <i className="bi bi-download"></i> Télécharger (ZIP)
                          </Dropdown.Item>
                          <Dropdown.Divider />
                          <Dropdown.Item 
                            className="text-danger"
                            onClick={() => handleDelete(folder, true)}
                          >
                            <i className="bi bi-trash"></i> Supprimer
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </td>
                  </tr>
                ))}

                {/* FICHIERS */}
                {filteredItems.files.map((file) => (
                  <tr 
                    key={`file-${file.id}`}
                    className="draggable-item"
                    draggable
                    onDragStart={(e) => handleDragStart(e, file, false)}
                    onDragEnd={handleDragEnd}
                  >
                    <td>
                      <div className="file-item" onClick={() => handleFileClick(file)}>
                        <i className={`bi ${getFileIconClass(file.mime_type)} item-icon`}></i>
                        <span className="item-name">{file.name}</span>
                      </div>
                    </td>
                    <td>{formatDate(file.created_at)}</td>
                    <td>Vous</td>
                    <td>{formatFileSize(file.size)}</td>
                    <td>
                      <Dropdown className="actions-dropdown">
                        <Dropdown.Toggle variant="light" size="sm">
                          <i className="bi bi-three-dots"></i>
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => handleFileClick(file)}>
                            <i className="bi bi-eye"></i> Prévisualiser
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => downloadFile(file.id)}>
                            <i className="bi bi-download"></i> Télécharger
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => openShareModal(file)}>
                            <i className="bi bi-share"></i> Partager
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => openRenameModal(file, false)}>
                            <i className="bi bi-pencil"></i> Renommer
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => openMoveModal(file, false)}>
                            <i className="bi bi-folder-symlink"></i> Déplacer
                          </Dropdown.Item>
                          <Dropdown.Divider />
                          <Dropdown.Item 
                            className="text-danger"
                            onClick={() => handleDelete(file, false)}
                          >
                            <i className="bi bi-trash"></i> Supprimer
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

        {/* MODALES */}
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
      </Container>
    </>
  );
};

export default FileExplorer;