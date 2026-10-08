import { lazy, Suspense } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Home from './pages/Home.jsx';
import Privacy from './pages/Privacy.jsx';
import Nav from './components/Nav.jsx';
import Footer from './components/Footer.jsx';
import Cursor from './components/Cursor.jsx';
import Grain from './components/Grain.jsx';
import SmoothScroll from './components/SmoothScroll.jsx';
import PageTransition from './components/PageTransition.jsx';
import { PeekProvider } from './components/Peek.jsx';
import Loader from './components/Loader.jsx';

const Admin = lazy(() => import('./pages/Admin.jsx'));
// the admin panel lives at an unlisted address (still password-protected)
export const ADMIN_PATH = '/asdfghjkl';

export default function App() {
  const location = useLocation();
  if (location.pathname.replace(/\/$/, '') === ADMIN_PATH) return <Suspense fallback={null}><Admin /></Suspense>;
  return (
    <PeekProvider>
      <Loader />
      <Grain />
      <Cursor />
      <SmoothScroll />
      <Nav />
      <AnimatePresence mode="wait" initial={false}>
        <PageTransition key={location.pathname}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<Home />} />
          </Routes>
          <Footer />
        </PageTransition>
      </AnimatePresence>
    </PeekProvider>
  );
}
