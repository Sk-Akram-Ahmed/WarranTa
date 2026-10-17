import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="container not-found">
      <div className="not-found-mark" aria-hidden="true">?</div>
      <p className="eyebrow">Wrong turn</p>
      <h1 className="not-found-code">404</h1>
      <h2>This page took the day off.</h2>
      <p>The link may be old, or the page may have moved. Let’s get you back to your warranties.</p>
      <Link to="/dashboard" className="button button-primary">
        Return to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;
