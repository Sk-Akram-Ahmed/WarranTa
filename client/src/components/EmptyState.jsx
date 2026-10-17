import React from 'react';
const EmptyState = ({ title = 'Nothing here yet', description, action }) => <section className="empty-state" aria-labelledby="empty-state-title"><div className="empty-state-icon" aria-hidden="true">⌁</div><h2 id="empty-state-title" className="heading-md">{title}</h2>{description && <p>{description}</p>}{action}</section>;
export default EmptyState;
