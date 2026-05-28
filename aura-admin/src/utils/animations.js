// Framer Motion animation variants
export const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 }
};

export const slideIn = {
  initial: { x: -100, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 100, opacity: 0 },
  transition: { type: "spring", stiffness: 100 }
};

export const scaleIn = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.8, opacity: 0 },
  transition: { duration: 0.2 }
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const cardHover = {
  hover: {
    scale: 1.02,
    boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
    transition: { duration: 0.2 }
  }
};

export const pulseAnimation = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};