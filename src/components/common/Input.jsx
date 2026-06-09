import React, { memo } from 'react';

const Input = memo(function Input({ label, error, className = '', inputClassName = '', ...props }) {
  return (
    <div className={`field ${className}`}>
      {label && <label>{label}</label>}
      <input className={inputClassName} {...props} />
      {error && <div className="err">{error}</div>}
    </div>
  );
});

export default Input;
