import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="site-footer">
    <div className="container footer-inner">
      <p className="footer-copyright">
        &copy; {new Date().getFullYear()} Warranty Tracker
      </p>
      <nav className="footer-links" aria-label="Legal">
        <Link to="/privacy">Privacy</Link>
        <Link to="/terms">Terms</Link>
        <Link to="/contact">Contact</Link>
      </nav>
    </div>
  </footer>
);

export default Footer;
