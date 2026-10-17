import React from 'react';
const ProgressBar = ({ value = 0, status = 'active', label = 'Warranty progress' }) => { const safeValue = Math.max(0, Math.min(100, value)); return <div className={`progress progress-${status}`} role="progressbar" aria-label={label} aria-valuemin="0" aria-valuemax="100" aria-valuenow={safeValue}><span style={{ width: `${safeValue}%` }} /></div>; };
export default ProgressBar;
