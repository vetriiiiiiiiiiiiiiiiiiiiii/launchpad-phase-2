import { Link, useLocation } from 'react-router-dom';
import Btn from './Btn.jsx';
import { S } from '../lib/content.js';

function registrationTarget(pathname) {
  if (S.registerUrl) return { href: S.registerUrl, target: '_blank', rel: 'noopener noreferrer' };
  return { to: pathname === '/' ? '#be-in-the-room' : '/#be-in-the-room' };
}

export function RegistrationButton({ children, ...props }) {
  const { pathname } = useLocation();
  const target = registrationTarget(pathname);
  return <Btn {...target} {...props}>{children}</Btn>;
}

export function RegistrationLink({ children, ...props }) {
  const { pathname } = useLocation();
  const target = registrationTarget(pathname);
  if (target.href) {
    return <a href={target.href} target={target.target} rel={target.rel} {...props}>{children}</a>;
  }
  if (pathname === '/') return <a href={target.to} {...props}>{children}</a>;
  return <Link to={target.to} {...props}>{children}</Link>;
}
