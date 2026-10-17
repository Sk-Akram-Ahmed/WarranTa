import React from 'react';
import Button from './Button';
const ErrorState = ({ title = 'Something went wrong', description = 'Please try again.', onRetry }) => <section className="empty-state error-state" role="alert"><div className="empty-state-icon" aria-hidden="true">!</div><h2 className="heading-md">{title}</h2><p>{description}</p>{onRetry && <Button variant="secondary" onClick={onRetry}>Try again</Button>}</section>;
export default ErrorState;
