import React from 'react';
import Badge from './Badge';

const StatusBadge = ({ status }) => {
  const badgeStatus = status === 'Expiring Soon' ? 'expiring' : status === 'Expired' ? 'expired' : 'active';
  return <Badge status={badgeStatus}>{status}</Badge>;
};

export default StatusBadge;
