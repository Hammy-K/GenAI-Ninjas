export const DUR = {
  instant: 0.1,
  quick: 0.2,
  standard: 0.3,
  expressive: 0.5,
} as const;

export const SPRING = {
  type: "spring",
  stiffness: 400,
  damping: 30,
} as const;

export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const EASE_IN = [0.7, 0, 0.84, 0] as const;

/** RTL-safe horizontal offset. Never hardcode a sign on x. */
export const dirSign = () =>
  typeof document !== "undefined" && document.documentElement.dir === "rtl"
    ? -1
    : 1;

export const enter = (distance = 24) => ({
  initial: { opacity: 0, x: distance * dirSign() },
  animate: { opacity: 1, x: 0 },
  transition: { duration: DUR.standard, ease: EASE_OUT },
});

/**
 * Route-outlet transition for AnimatePresence(mode="wait"). Enters decelerating
 * from the start edge (RTL-correct via dirSign), leaves by accelerating out.
 * Under reduced motion it is a pure cross-fade — nothing translates.
 */
export const page = (reduce = false) => ({
  initial: reduce ? { opacity: 0 } : { opacity: 0, x: 24 * dirSign() },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, transition: { duration: DUR.quick, ease: EASE_IN } },
  transition: { duration: DUR.standard, ease: EASE_OUT },
});

export const press = {
  whileTap: { scale: 0.96 },
  transition: SPRING,
};

/** Hover lift, applied via framer (not a CSS transform, which framer would shadow). */
export const hoverLift = { y: -2 };

/**
 * Ambient "breathing" loop for the single active node in the journey spine.
 * This is the one place a looping ease is allowed (§4: "Ambient loops are the only
 * exception" to never-linear). Only ever apply it to exactly one element at rest.
 * Values live here, not inline, so screens stay free of raw motion numbers.
 */
export const AMBIENT = {
  animate: { y: [0, -3, 0] },
  // `ease` is pinned to its literal (framer needs a known Easing), while the
  // keyframe array stays mutable so framer's `animate` prop accepts it.
  transition: { duration: 2, repeat: Infinity, ease: "easeInOut" as const },
};
