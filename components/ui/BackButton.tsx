import React, { useRef, useState, useCallback } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
  AnimatePresence,
  type Variants,
} from "framer-motion";
import { ChevronLeft } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface BackButtonProps {
  onClick: () => void;
  label?: string;
}

// ── Chevron trail animation variants ───────────────────────────────────────────
const chevronVariants: Variants = {
  animate: (i: number) => ({
    opacity: [0.15, 0.7, 0.15],
    x: [6, -2, 6],
    transition: {
      duration: 1.6,
      ease: "easeInOut",
      repeat: Infinity,
      delay: i * 0.2,
    },
  }),
  hover: (i: number) => ({
    opacity: [0.2, 1, 0.2],
    x: [4, -4, 4],
    transition: {
      duration: 0.8,
      ease: "easeInOut",
      repeat: Infinity,
      delay: i * 0.1,
    },
  }),
};

// ── Ripple component ───────────────────────────────────────────────────────────
const TapRipple: React.FC<{ x: number; y: number; onComplete: () => void }> = ({
  x,
  y,
  onComplete,
}) => (
  <motion.div
    className="absolute rounded-full bg-firm-accent/25 pointer-events-none"
    style={{
      left: x,
      top: y,
      width: 10,
      height: 10,
      marginLeft: -5,
      marginTop: -5,
    }}
    initial={{ scale: 0, opacity: 0.8 }}
    animate={{ scale: 12, opacity: 0 }}
    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    onAnimationComplete={onComplete}
  />
);

// ── Main component ─────────────────────────────────────────────────────────────
const BackButton: React.FC<BackButtonProps> = ({
  onClick,
  label = "Zurück",
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Magnetic hover offsets
  const offsetX = useMotionValue(0);
  const offsetY = useMotionValue(0);
  const springX = useSpring(offsetX, { stiffness: 250, damping: 20 });
  const springY = useSpring(offsetY, { stiffness: 250, damping: 20 });

  // Glow intensity
  const [isHovered, setIsHovered] = useState(false);

  // Ripple state
  const [ripples, setRipples] = useState<
    { id: number; x: number; y: number }[]
  >([]);
  const rippleIdRef = useRef(0);

  // ── Magnetic hover tracking ────────────────────────────────────────────────
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (prefersReducedMotion) return;
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * 0.25;
      const dy = (e.clientY - cy) * 0.35;
      offsetX.set(dx);
      offsetY.set(dy);
    },
    [offsetX, offsetY, prefersReducedMotion],
  );

  const handleMouseLeave = useCallback(() => {
    offsetX.set(0);
    offsetY.set(0);
    setIsHovered(false);
  }, [offsetX, offsetY]);

  // ── Click handler with ripple ──────────────────────────────────────────────
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!prefersReducedMotion) {
        const rect = buttonRef.current?.getBoundingClientRect();
        if (rect) {
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const id = ++rippleIdRef.current;
          setRipples((prev) => [...prev, { id, x, y }]);
        }
      }
      // Slight delay so ripple is visible before navigation
      setTimeout(onClick, prefersReducedMotion ? 0 : 180);
    },
    [onClick, prefersReducedMotion],
  );

  const removeRipple = useCallback((id: number) => {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // ── Reduced-motion fallback ────────────────────────────────────────────────
  if (prefersReducedMotion) {
    return (
      <button
        ref={buttonRef}
        onClick={onClick}
        className="group flex items-center gap-2 px-4 py-2 rounded-full
          bg-firm-card/60 border border-firm-border/40
          text-firm-slate hover:text-firm-navy hover:bg-firm-card
          transition-colors duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-firm-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-firm-paper"
        aria-label={label}
      >
        <ChevronLeft size={16} strokeWidth={2.5} />
        <span className="text-xs font-semibold tracking-wide uppercase">
          {label}
        </span>
      </button>
    );
  }

  // ── Full animated version ──────────────────────────────────────────────────
  return (
    <motion.button
      ref={buttonRef}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      whileTap={{ scale: 0.92 }}
      className="group relative flex items-center gap-1.5 pl-3 pr-4 py-2 rounded-full overflow-hidden cursor-pointer
        bg-firm-card/40 backdrop-blur-xl border border-firm-border/30
        text-firm-slate hover:text-firm-navy
        shadow-firm-sm hover:shadow-firm
        focus:outline-none focus-visible:ring-2 focus-visible:ring-firm-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-firm-paper
        transition-[box-shadow,color,border-color] duration-300"
      aria-label={label}
    >
      {/* Radial glow on hover */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.35 }}
        style={{
          background:
            "radial-gradient(circle at 30% 50%, rgba(var(--color-firm-accent), 0.12) 0%, transparent 70%)",
        }}
      />

      {/* Chevron trail (3 staggered chevrons) */}
      <span className="relative flex items-center w-5 h-5 overflow-hidden shrink-0">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            custom={i}
            variants={chevronVariants}
            animate={isHovered ? "hover" : "animate"}
            className="absolute inset-0 flex items-center justify-center"
          >
            <ChevronLeft
              size={14 - i * 1.5}
              strokeWidth={2.5 - i * 0.3}
              className="transition-colors duration-200"
            />
          </motion.span>
        ))}
      </span>

      {/* Label */}
      <span className="relative text-xs font-semibold tracking-wide uppercase select-none">
        {label}
      </span>

      {/* Tap ripples */}
      <AnimatePresence>
        {ripples.map((r) => (
          <TapRipple
            key={r.id}
            x={r.x}
            y={r.y}
            onComplete={() => removeRipple(r.id)}
          />
        ))}
      </AnimatePresence>
    </motion.button>
  );
};

export default BackButton;
