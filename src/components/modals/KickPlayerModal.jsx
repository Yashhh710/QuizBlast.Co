import React from 'react';
import Modal from '../common/Modal';

export default function KickPlayerModal({ show, playerName, onConfirm, onClose }) {
  return (
    <Modal show={show}>
      <h3>🚪 Kick Player?</h3>
      <p>Remove <strong style={{ color: '#FFC836' }}>{playerName}</strong> from the game?</p>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button className="btn btn-red btn-sm" style={{ flex: 1 }} onClick={onConfirm}>Kick</button>
        <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}
