import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';

export default function RenamePlayerModal({ show, playerName, onConfirm, onClose }) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (show) setValue(playerName || '');
  }, [show, playerName]);

  return (
    <Modal show={show}>
      <h3>✏️ Rename Player</h3>
      <div className="field">
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="New name…"
          maxLength={20}
          style={{ fontSize: '16px' }}
        />
      </div>
      <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
        <button className="btn btn-purple btn-sm" style={{ flex: 1 }} onClick={() => onConfirm(value)}>Save</button>
        <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}
