import React, { memo } from 'react';

const Modal = memo(function Modal({ show, children }) {
  if (!show) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        {children}
      </div>
    </div>
  );
});

export default Modal;
