'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';

/**
 * Tasteful, reusable entrance motion. Short, eased, and subtle — luxury is
 * restraint, not bounce. Respects reduced-motion via framer's defaults.
 */

const EASE = [0.22, 1, 0.36, 1] as const; // easeOutExpo-ish

export function FadeIn({
  children,
  delay = 0,
  y = 10,
  ...rest
}: HTMLMotionProps<'div'> & { delay?: number; y?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE, delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Parent that staggers its <StaggerItem> children into view. */
export function Stagger({
  children,
  gap = 0.06,
  ...rest
}: HTMLMotionProps<'div'> & { gap?: number }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: gap } },
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  y = 12,
  ...rest
}: HTMLMotionProps<'div'> & { y?: number }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
