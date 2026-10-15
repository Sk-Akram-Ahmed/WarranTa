import React from 'react';

const Input = ({ className = '', invalid = false, ...props }) => (
  <input
    className={`input${invalid ? ' input-invalid' : ''}${className ? ` ${className}` : ''}`}
    aria-invalid={invalid || undefined}
    {...props}
  />
);

export const Select = ({ className = '', invalid = false, ...props }) => (
  <select
    className={`input select${invalid ? ' input-invalid' : ''}${className ? ` ${className}` : ''}`}
    aria-invalid={invalid || undefined}
    {...props}
  />
);

export const Textarea = ({ className = '', invalid = false, ...props }) => (
  <textarea
    className={`input textarea${invalid ? ' input-invalid' : ''}${className ? ` ${className}` : ''}`}
    aria-invalid={invalid || undefined}
    {...props}
  />
);

export default Input;
