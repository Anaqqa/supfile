import React from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

const CustomToast = ({ show, onClose, message, type = 'success', icon = 'check-circle-fill' }) => {
  const bgColor = {
    success: 'success',
    error: 'danger',
    warning: 'warning',
    info: 'info'
  }[type] || 'success';

  return (
    <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
      <Toast 
        show={show} 
        onClose={onClose} 
        delay={3000} 
        autohide
        bg={bgColor}
      >
        <Toast.Header closeButton={true}>
          <i className={`bi bi-${icon} me-2`}></i>
          <strong className="me-auto">
            {type === 'success' && 'Succès'}
            {type === 'error' && 'Erreur'}
            {type === 'warning' && 'Attention'}
            {type === 'info' && 'Information'}
          </strong>
        </Toast.Header>
        <Toast.Body className="text-white">
          {message}
        </Toast.Body>
      </Toast>
    </ToastContainer>
  );
};

export default CustomToast;