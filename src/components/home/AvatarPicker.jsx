import React, { memo } from 'react';
import { AVATARS } from '../../utils/constants';

const AvatarPicker = memo(function AvatarPicker({ selected, onSelect }) {
  return (
    <div className="field">
      <label>Avatar</label>
      <div className="avatar-grid">
        {AVATARS.map(a => (
          <button
            key={a}
            type="button"
            className={`avatar-btn${selected === a ? ' selected' : ''}`}
            onClick={() => onSelect(a)}
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  );
});

export default AvatarPicker;
