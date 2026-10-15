import React from 'react';

const Label = ({ children, className = '', ...props }) => (
  <label className={`field-label${className ? ` ${className}` : ''}`} {...props}>
    {children}
  </label>
);

export default Label;
