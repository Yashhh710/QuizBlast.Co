import React, { memo } from 'react';

const ProgressBar = memo(function ProgressBar({ value }) {
  return (
    <div className="q-progress-wrap">
      <div className="q-progress-fill" style={{ width: `${value}%` }} />
    </div>
  );
});

export default ProgressBar;
