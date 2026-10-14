import React from 'react';

const StatusBadge = ({ status }) => {
  let badgeClass = 'badge-active';
  if (status === 'Expiring Soon') {
    badgeClass = 'badge-expiring';
  } else if (status === 'Expired') {
    badgeClass = 'badge-expired';
  }

  return <span className={`badge ${badgeClass}`}>{status}</span>;
};

export default StatusBadge;
