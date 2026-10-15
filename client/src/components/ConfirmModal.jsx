import React from 'react';
import Button from './Button';
import Modal from './Modal';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Delete', loading = false }) => {
  return (
    <Modal
      open={isOpen}
      title={title}
      onClose={onCancel}
      actions={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>{confirmText}</Button>
        </>
      }
    >
      <p className="modal-copy">{message}</p>
    </Modal>
  );
};

export default ConfirmModal;
