import React from 'react';
const Avatar = ({ name = '', src, size = 'medium' }) => { const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?'; return <span className={`avatar avatar-${size}`} aria-label={name || 'User'}>{src ? <img src={src} alt="" /> : initials}</span>; };
export default Avatar;
