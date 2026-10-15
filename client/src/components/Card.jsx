import React from 'react';

const Card = ({ children, className = '', as: Component = 'section', ...props }) => (
  <Component className={`card${className ? ` ${className}` : ''}`} {...props}>
    {children}
  </Component>
);

export default Card;
