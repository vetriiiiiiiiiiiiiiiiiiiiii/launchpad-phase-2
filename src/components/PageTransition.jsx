import { motion } from 'framer-motion';
import { reduceMotion } from '../hooks/env.js';

/* Moving between pages: an emerald panel sweeps across like a turned page,
   the wordmark passes through it, and the new page is underneath. */
export default function PageTransition({ children }) {
  if (reduceMotion) return children;
  return (
    <>
      {children}
      <motion.div
        className="turn"
        aria-hidden="true"
        initial={{ scaleY: 1, transformOrigin: '50% 0%' }}
        animate={{ scaleY: 0, transition: { duration: 1.05, ease: [0.7, 0, 0.2, 1], delay: 0.15 } }}
        exit={{ scaleY: 1, transformOrigin: '50% 100%', transition: { duration: 0.7, ease: [0.7, 0, 0.2, 1] } }}
      >
        <motion.span
          className="turn__word"
          initial={{ opacity: 1, letterSpacing: '0.42em' }}
          animate={{ opacity: 0, letterSpacing: '0.9em', transition: { duration: 0.6 } }}
          exit={{ opacity: 1, letterSpacing: '0.42em', transition: { duration: 0.5, delay: 0.2 } }}
        >
          Launchpad
        </motion.span>
      </motion.div>
    </>
  );
}
