import React from 'react';
import { Modal, Button, Alert } from 'react-bootstrap';

const DeleteConfirmModal = ({ show, onHide, onConfirm, item, itemType, loading = false }) => {
  const isDangerous = itemType === 'dossier';
  
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title>
          <i className={`bi ${isDangerous ? 'bi-exclamation-triangle text-warning' : 'bi-trash text-danger'} me-2`}></i>
          Confirmer la suppression
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="pt-2">
        {/* Informations sur l'élément */}
        <div className="mb-3">
          <div className="bg-light p-3 rounded border">
            <div className="d-flex align-items-center">
              <i className={`bi ${itemType === 'dossier' ? 'bi-folder-fill text-warning' : 'bi-file-earmark text-primary'} fs-3 me-3`}></i>
              <div className="flex-grow-1">
                <strong className="d-block">{item?.name}</strong>
                <small className="text-muted">
                  {itemType === 'dossier' ? 'Dossier' : 'Fichier'}
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* Message de confirmation */}
        <p className="mb-3">
          Êtes-vous sûr de vouloir supprimer {itemType === 'dossier' ? 'ce dossier' : 'ce fichier'} ?
        </p>

        {/* Avertissement pour les dossiers */}
        {isDangerous && (
          <Alert variant="warning" className="mb-3">
            <div className="d-flex align-items-start">
              <i className="bi bi-exclamation-triangle-fill fs-5 me-3"></i>
              <div>
                <strong className="d-block mb-1">Attention</strong>
                <small>
                  La suppression d'un dossier entraînera également la suppression de tous les fichiers et sous-dossiers qu'il contient.
                </small>
              </div>
            </div>
          </Alert>
        )}

        {/* Information sur la corbeille */}
        <Alert variant="info" className="mb-0">
          <div className="d-flex align-items-start">
            <i className="bi bi-info-circle-fill fs-5 me-3"></i>
            <div>
              <strong className="d-block mb-1">Récupération possible</strong>
              <small>
                {itemType === 'dossier' ? 'Le dossier' : 'Le fichier'} sera déplacé dans la corbeille et pourra être restauré ultérieurement.
              </small>
            </div>
          </div>
        </Alert>
      </Modal.Body>
      <Modal.Footer className="border-0">
        <Button 
          variant="secondary" 
          onClick={onHide}
          disabled={loading}
        >
          Annuler
        </Button>
        <Button 
          variant="danger" 
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Suppression...
            </>
          ) : (
            <>
              <i className="bi bi-trash me-2"></i>
              Supprimer
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteConfirmModal;