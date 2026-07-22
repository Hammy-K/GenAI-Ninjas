import { useEffect, useRef } from "react";
import {
  motion,
  animate,
  useMotionValue,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { DUR, EASE_OUT } from "@/lib/motion";

interface AnimatedNumberProps {
  /** The target value. Whenever it changes, the display counts to it (§5). */
  value: number;
  /** Format the rounded number for display (e.g. thousands separators). */
  format?: (n: number) => string;
  className?: string;
  /** Count up from `from` on first mount (for celebration moments). */
  animateOnMount?: boolean;
  from?: number;
}

/**
 * A number that animates to its value instead of swapping (§5: "A number that
 * jumps is a number the learner didn't notice"). Numerals are isolated LTR so they
 * read correctly inside RTL copy (§10). Reduced motion snaps to the value.
 */
export function AnimatedNumber({
  value,
  format = (n) => String(n),
  className,
  animateOnMount = false,
  from = 0,
}: AnimatedNumberProps) {
  const reduce = useReducedMotion();
  // Under reduced motion, start at the final value — no pre-paint count-from-zero.
  const mv = useMotionValue(reduce ? value : animateOnMount ? from : value);
  const text = useTransform(mv, (v) => format(Math.round(v)));
  const mounted = useRef(false);

  useEffect(() => {
    if (reduce) {
      mv.set(value);
      return;
    }
    const isFirst = !mounted.current;
    mounted.current = true;
    // Totals shown on arrival snap; only a value that changes while on screen —
    // or an explicit celebration mount — counts.
    if (isFirst && !animateOnMount) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, {
      duration: DUR.expressive,
      ease: EASE_OUT,
    });
    return () => controls.stop();
    // mv and animateOnMount are stable for the component's life.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduce]);

  return (
    <motion.span
      className={className}
      dir="ltr"
      style={{ unicodeBidi: "isolate", display: "inline-block" }}
    >
      {text}
    </motion.span>
  );
}

export default AnimatedNumber;
