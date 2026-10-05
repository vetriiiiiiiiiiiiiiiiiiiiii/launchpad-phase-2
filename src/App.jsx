import { Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Home from './pages/Home.jsx';
import LaunchesPage from './pages/LaunchesPage.jsx';
import Nav from './components/Nav.jsx';
import Footer from './components/Footer.jsx';
import Cursor from './components/Cursor.jsx';
import Grain from './components/Grain.jsx';
import SmoothScroll from './components/SmoothScroll.jsx';
import PageTransition from './components/PageTransition.jsx';
import { PeekProvider } from './components/Peek.jsx';
import Loader from './components/Loader.jsx';

export default function App() {
  const location = useLocation();
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
            <Route path="/launches" element={<LaunchesPage />} />
            <Route path="*" element={<Home />} />
          </Routes>
          <Footer />
        </PageTransition>
      </AnimatePresence>
    </PeekProvider>
  );
}
