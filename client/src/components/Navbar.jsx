import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from './Button';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to={user ? '/dashboard' : '/login'} className="navbar-brand">
          <span className="brand-mark" aria-hidden="true">W</span>
          <span>Warranty Tracker</span>
        </Link>
        <ul className="nav-links">
          {user ? (
            <>
              <li>
                <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
                  Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink to="/warranties/new" className={({ isActive }) => (isActive ? 'active' : '')}>
                  + Add Warranty
                </NavLink>
              </li>
              <li>
                <NavLink to="/profile" className={({ isActive }) => (isActive ? 'active' : '')}>
                  {user.name}
                </NavLink>
              </li>
              <li>
                <Button variant="secondary" size="small" onClick={handleLogout}>
                  Logout
                </Button>
              </li>
            </>
          ) : (
            <>
              <li>
                <NavLink to="/login" className={({ isActive }) => (isActive ? 'active' : '')}>
                  Login
                </NavLink>
              </li>
              <li>
                <NavLink to="/register" className={({ isActive }) => (isActive ? 'active' : '')}>
                  Register
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
