import { Link, useLocation } from 'react-router-dom';

export default function Footer() {
  const home = useLocation().pathname === '/';
  return (
    <footer className="foot">
      <span>Launchpad</span>
      <span>26 October 2026 · One day · Three launches</span>
      {home ? <a href="#top">Back to the beginning ↑</a> : <Link to="/">Back to Launchpad ↑</Link>}
    </footer>
  );
}
