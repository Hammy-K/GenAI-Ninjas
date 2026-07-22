import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { motion, useReducedMotion } from "framer-motion"

import { cn } from "@/lib/utils"
import { SPRING, dirSign } from "@/lib/motion"

const MotionIndicator = motion.create(ProgressPrimitive.Indicator)

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => {
  const reduce = useReducedMotion()
  // The empty portion is pushed off the start edge. In RTL that edge is the right,
  // so the bar fills from the right — dirSign() flips the sign, never hardcoded.
  const offset = (100 - (value || 0)) * -dirSign()

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <MotionIndicator
        className="h-full w-full flex-1 bg-primary"
        // Render at the correct fill on mount (framer 11 would otherwise animate
        // from x:0), then spring to new values as they change (§5). Reduced motion snaps.
        initial={false}
        animate={{ x: `${offset}%` }}
        transition={reduce ? { duration: 0 } : SPRING}
      />
    </ProgressPrimitive.Root>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
