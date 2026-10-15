import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="container not-found">
      <h1 className="not-found-code">404</h1>
      <h2>Page Not Found</h2>
      <p>
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <Link to="/dashboard" className="button button-primary">
        Return to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;
