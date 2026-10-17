import React, { useEffect, useRef } from 'react';
import './CardStack.css';

const CheckIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg>;

const CardStack = ({ variant = 'login' }) => {
  const stackRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  useEffect(() => {
    const panel = stackRef.current?.parentElement;
    if (!panel) return undefined;
    const supportsParallax = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const onMove = (event) => {
      if (!supportsParallax() || !stackRef.current) return;
      const bounds = panel.getBoundingClientRect();
      const rx = ((event.clientY - bounds.top) / bounds.height - 0.5) * -16;
      const ry = ((event.clientX - bounds.left) / bounds.width - 0.5) * 16;
      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        stackRef.current?.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
        stackRef.current?.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
      });
    };
    const onLeave = () => {
      stackRef.current?.style.setProperty('--rx', '0deg');
      stackRef.current?.style.setProperty('--ry', '0deg');
    };
    panel.addEventListener('mousemove', onMove);
    panel.addEventListener('mouseleave', onLeave);
    return () => { panel.removeEventListener('mousemove', onMove); panel.removeEventListener('mouseleave', onLeave); };
  }, []);

  const isRegister = variant === 'register';
  const product = isRegister ? 'Sony WH-1000XM5' : 'MacBook Pro';
  const expiry = isRegister ? 'Expires 11 Aug 2027' : 'Coverage ends 15 Jan 2027';
  const remaining = isRegister ? 'Active coverage' : '248 days remaining';

  return <div className={`auth-card-stack auth-card-stack--${variant}`} aria-hidden="true">
    <div className="auth-card-stack__dots" />
    <div className="auth-card-stack__orb" />
    {isRegister && <><span className="auth-card-stack__chip auth-card-stack__chip--reminder">Reminder in 30 days</span><span className="auth-card-stack__chip auth-card-stack__chip--bill">Bill uploaded</span></>}
    <div className="auth-card-stack__scene" ref={stackRef}>
      <article className="auth-card-stack__card auth-card-stack__card--back"><span>{isRegister ? 'Warranty list' : 'Coverage'}</span><strong>{isRegister ? '1 item added' : '3 products'}</strong></article>
      <article className="auth-card-stack__card auth-card-stack__card--middle"><span>{isRegister ? 'Next step' : 'Next expiry'}</span><strong>{isRegister ? 'Upload receipt' : '18 days'}</strong></article>
      <article className="auth-card-stack__card auth-card-stack__card--front"><div><span className="auth-card-stack__label">{isRegister ? 'New warranty' : product}</span><span className="auth-card-stack__badge"><CheckIcon />Active</span></div>{isRegister && <small>Sony · Wireless headphones</small>}{!isRegister && <small>{expiry}</small>}<div className="auth-card-stack__progress"><span /></div><strong>{isRegister ? expiry : remaining}</strong></article>
    </div>
  </div>;
};

export default CardStack;
