import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export const CursorEffects: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Smooth fluid spring physics for the trailing circle
  const springX = useSpring(mouseX, { stiffness: 450, damping: 28 });
  const springY = useSpring(mouseY, { stiffness: 450, damping: 28 });

  useEffect(() => {
    // Only enable on desktop devices with a mouse
    const media = window.matchMedia('(pointer: fine)');
    const update = () => setEnabled(media.matches);
    update();
    media.addEventListener('change', update);

    const handlePointerMove = (e: PointerEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const handlePointerOver = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest('button, a, input, select, [role="button"]')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerover', handlePointerOver, { passive: true });

    return () => {
      media.removeEventListener('change', update);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerover', handlePointerOver);
    };
  }, [mouseX, mouseY]);

  if (!enabled) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      {/* Precision Center Dot */}
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 rounded-full bg-[var(--theme-accent-primary)] pointer-events-none -translate-x-1/2 -translate-y-1/2 shadow-sm"
        style={{
          x: mouseX,
          y: mouseY,
        }}
        animate={{
          scale: isHovering ? 0.5 : 1,
          opacity: 0.9,
        }}
        transition={{ duration: 0.15 }}
      />

      {/* Trailing Fluid Circle Follower */}
      <motion.div
        className="fixed top-0 left-0 rounded-full border-2 border-[var(--theme-accent-primary)] pointer-events-none -translate-x-1/2 -translate-y-1/2"
        style={{
          x: springX,
          y: springY,
        }}
        animate={{
          width: isHovering ? 46 : 28,
          height: isHovering ? 46 : 28,
          opacity: isHovering ? 0.75 : 0.45,
          backgroundColor: isHovering ? 'var(--theme-pill-bg)' : 'transparent',
          scale: isHovering ? 1.15 : 1,
        }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      />
    </div>
  );
};
