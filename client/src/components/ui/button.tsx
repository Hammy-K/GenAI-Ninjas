import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { press, hoverLift } from "@/lib/motion";

// Variants whose design lifts on hover; applied via framer whileHover.
const LIFT_VARIANTS = new Set(["default", "destructive", "positive"]);

// framer owns `transform` (it animates the whileTap scale by writing inline
// transform every frame). The CSS transition must therefore NOT include transform,
// and the hover lift must not be a CSS transform — both would fight framer. Hover
// shadow/colour still transition; the lift is applied via whileHover below.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-[color,background-color,border-color,box-shadow] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md hover:shadow-lg hover:from-white-700 hover:to-white-700",
        destructive:
          "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md hover:shadow-lg hover:from-red-600 hover:to-red-700",
        positive:
          "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md hover:shadow-lg hover:from-green-600 hover:to-green-700",
        outline:
          "border-2 border-purple-300 bg-white/80 backdrop-blur-sm text-purple-700 hover:bg-purple-50 hover:border-purple-400 shadow-sm hover:shadow-md",
        secondary:
          "bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-sm hover:shadow-md",
        ghost: "text-purple-600 hover:bg-purple-50 hover:text-purple-700",
        link: "text-purple-600 underline-offset-4 hover:underline hover:text-purple-700",
      },
      size: {
        default: "h-11 px-6 py-2.5 text-sm",
        sm: "h-9 px-4 py-2 text-xs rounded-lg",
        lg: "h-14 px-8 py-3 text-base rounded-2xl",
        icon: "h-11 w-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const reduce = useReducedMotion();
    const classes = cn(buttonVariants({ variant, size, className }));

    // asChild delegates rendering to the child element (Radix Slot); the child
    // owns its own press affordance, so we do not wrap it in motion.
    if (asChild) {
      return <Slot className={classes} ref={ref} {...props} />;
    }

    // Every button responds to touch within 100ms with a spring press (§4).
    // Reduced motion holds it still. The cast bridges React's DOM event handler
    // types and framer's motion prop types (they conflict on drag/animation
    // handlers that buttons never use); runtime passthrough is unaffected.
    const lifts = !reduce && LIFT_VARIANTS.has(variant ?? "default");
    return (
      <motion.button
        className={classes}
        ref={ref}
        whileHover={lifts ? hoverLift : undefined}
        whileTap={reduce ? undefined : press.whileTap}
        transition={press.transition}
        {...(props as HTMLMotionProps<"button">)}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
