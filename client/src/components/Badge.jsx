import React from 'react';

const BADGE_CONTENT = {
  active: { icon: '✓', label: 'Active' },
  expiring: { icon: '!', label: 'Expiring Soon' },
  expired: { icon: '×', label: 'Expired' },
};

const Badge = ({ status = 'active', children }) => {
  const content = BADGE_CONTENT[status] || BADGE_CONTENT.active;

  return (
    <span className={`badge badge-${status}`}>
      <span className="badge-icon" aria-hidden="true">{content.icon}</span>
      {children || content.label}
    </span>
  );
};

export default Badge;
