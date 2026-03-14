import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: ReactNode;
}

const pageVariants = {
  initial: {
    opacity: 0.7,
  },
  enter: {
    opacity: 1,
    transition: {
      duration: 0.15,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0.7,
    transition: {
      duration: 0.1,
      ease: 'easeIn',
    },
  },
};

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="enter"
        exit="exit"
        style={{ willChange: 'opacity' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Staggered child animation for lists/grids
export const staggerContainer = {
  initial: {},
  enter: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.08,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 14, scale: 0.97 },
  enter: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};
