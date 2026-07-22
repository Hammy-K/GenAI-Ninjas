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

export const press = {
  whileTap: { scale: 0.96 },
  transition: SPRING,
};
