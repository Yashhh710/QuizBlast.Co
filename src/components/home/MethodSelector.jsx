import React, { memo } from 'react';

const MethodSelector = memo(function MethodSelector({ method, onSelect }) {
  return (
    <div className="method-tabs">
      <button
        className={`method-tab${method === 'ai' ? ' active' : ''}`}
        onClick={() => onSelect('ai')}
      >
        🤖 AI Generate
      </button>
      <button
        className={`method-tab${method === 'manual' ? ' active' : ''}`}
        onClick={() => onSelect('manual')}
      >
        ✏️ Manual
      </button>
    </div>
  );
});

export default MethodSelector;
