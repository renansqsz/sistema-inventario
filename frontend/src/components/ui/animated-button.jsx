import React from 'react';

const Button = ({ children, className = '', ...props }) => {
  return (
    <button className={`btn ${className}`} {...props}>
      <svg className="btn-border" width="100%" height="100%">
        <rect x="0" y="0" width="100%" height="100%" rx="6" ry="6" pathLength="100" />
      </svg>
      {children}
    </button>
  );
};

export default Button;
