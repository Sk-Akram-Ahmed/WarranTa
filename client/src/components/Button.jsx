import React from 'react';

const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  loading = false,
  className = '',
  disabled = false,
  type = 'button',
  ...props
}) => (
  <button
    type={type}
    className={`button button-${variant} button-${size}${className ? ` ${className}` : ''}`}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    {...props}
  >
    {loading && <span className="button-spinner" aria-hidden="true" />}
    <span>{children}</span>
  </button>
);

export default Button;
