import React, { useEffect, useId, useRef } from 'react';

const focusableSelector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const Modal = ({ open, title, children, actions, onClose, className = '' }) => {
  const dialogRef = useRef(null);
  const titleId = useId();
  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
      if (event.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll(focusableSelector);
      if (!focusable?.length) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    dialogRef.current?.querySelector(focusableSelector)?.focus();
    return () => { window.removeEventListener('keydown', handleKeyDown); previouslyFocused?.focus?.(); };
  }, [open, onClose]);
  if (!open) return null;
  return <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}>
    <section ref={dialogRef} className={`modal-content${className ? ` ${className}` : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex="-1">
      <header className="modal-header"><h2 id={titleId} className="modal-title">{title}</h2><button className="icon-button modal-close" type="button" onClick={onClose} aria-label="Close dialog">×</button></header>
      <div className="modal-body">{children}</div>{actions && <footer className="modal-actions">{actions}</footer>}
    </section>
  </div>;
};
export default Modal;
