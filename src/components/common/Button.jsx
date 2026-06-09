import React, { memo } from 'react';

const Button = memo(function Button({ children, variant = 'purple', size = 'md', className = '', style = {}, ...props }) {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </button>
  );
});

export default Button;
