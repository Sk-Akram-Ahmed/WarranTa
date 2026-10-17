import React from 'react';
const Skeleton = ({ className = '', label = 'Loading content' }) => <span className={`skeleton${className ? ` ${className}` : ''}`} role="status" aria-label={label} />;
export default Skeleton;
