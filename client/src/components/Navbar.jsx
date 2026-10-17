import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from './Button';
import Avatar from './Avatar';

const Icon = ({ name }) => {
  const paths = {
    home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5.5 9v11h13V9" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 21c.8-4 3.2-6 7-6s6.2 2 7 6" /></>,
    search: <><circle cx="10.5" cy="10.5" r="5.5" /><path d="m15 15 5 5" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
    moon: <path d="M20 15.2A8.5 8.5 0 0 1 8.8 4 8.5 8.5 0 1 0 20 15.2Z" />,
  };
  return <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
};

const Navbar = ({ publicOnly = false }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  const [search, setSearch] = useState('');

  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('theme', theme); }, [theme]);
  const handleLogout = () => { logout(); navigate('/login'); };
  const submitSearch = (event) => { event.preventDefault(); if (search.trim()) navigate(`/dashboard?search=${encodeURIComponent(search.trim())}`); };
  const navItems = [{ to: '/dashboard', label: 'Dashboard', icon: 'home' }, { to: '/warranties/new', label: 'Add warranty', icon: 'plus' }, { to: '/profile', label: 'Profile', icon: 'user' }];

  if (publicOnly || !user) return <nav className="public-nav"><Link to="/" className="navbar-brand"><span className="brand-mark" aria-hidden="true">W</span><span>Warranty Tracker</span></Link><div className="public-nav-actions"><Link to="/login">Sign in</Link><Link to="/register" className="button button-primary button-small">Get started</Link></div></nav>;

  return <>
    <aside className="app-sidebar" aria-label="Primary navigation">
      <Link to="/dashboard" className="sidebar-brand"><span className="brand-mark" aria-hidden="true">W</span><span className="sidebar-label">Warranty<br />Tracker</span></Link>
      <nav className="sidebar-nav">{navItems.map((item) => <NavLink key={item.to} to={item.to} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}><Icon name={item.icon} /><span className="sidebar-label">{item.label}</span></NavLink>)}</nav>
      <div className="sidebar-user"><Avatar name={user.name} size="small" /><div className="sidebar-user-copy sidebar-label"><strong>{user.name}</strong><span>{user.email}</span></div><button className="sidebar-logout" type="button" onClick={handleLogout} aria-label="Log out">↗</button></div>
    </aside>
    <header className="app-topbar"><Link to="/dashboard" className="mobile-brand"><span className="brand-mark" aria-hidden="true">W</span><span>Warranty Tracker</span></Link><form className="global-search" onSubmit={submitSearch}><Icon name="search" /><input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search warranties" placeholder="Search warranties" /></form><div className="topbar-actions"><button className="theme-toggle" type="button" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}><Icon name={theme === 'dark' ? 'sun' : 'moon'} /></button><NavLink to="/profile" className="topbar-avatar" aria-label="Open profile"><Avatar name={user.name} size="small" /></NavLink></div></header>
    <nav className="mobile-tabs" aria-label="Mobile navigation"><NavLink to="/dashboard" className={({ isActive }) => `mobile-tab${isActive ? ' active' : ''}`}><Icon name="home" /><span>Home</span></NavLink><NavLink to="/profile" className={({ isActive }) => `mobile-tab${isActive ? ' active' : ''}`}><Icon name="user" /><span>Profile</span></NavLink><NavLink to="/warranties/new" className="mobile-add" aria-label="Add warranty"><Icon name="plus" /></NavLink></nav>
  </>;
};

export default Navbar;
