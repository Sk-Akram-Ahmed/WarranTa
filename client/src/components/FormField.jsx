import React, { Children, cloneElement, isValidElement } from 'react';
import Label from './Label';

const markInvalid = (child, errorId) => {
  if (!isValidElement(child)) return child;

  if (child.type === 'div') {
    return cloneElement(child, {}, Children.map(child.props.children, (nestedChild) => markInvalid(nestedChild, errorId)));
  }

  return cloneElement(child, {
    invalid: true,
    'aria-describedby': [child.props['aria-describedby'], errorId].filter(Boolean).join(' '),
  });
};

const FormField = ({ label, htmlFor, error, hint, children, className = '' }) => (
  <div className={`form-field${className ? ` ${className}` : ''}`}>
    {label && <Label htmlFor={htmlFor}>{label}</Label>}
    {error ? Children.map(children, (child) => markInvalid(child, `${htmlFor}-error`)) : children}
    {hint && <small className="field-hint">{hint}</small>}
    {error && <span className="field-error" id={`${htmlFor}-error`} role="alert">{error}</span>}
  </div>
);

export default FormField;
