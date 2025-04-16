import { motion } from "framer-motion";

interface WaveAnimationProps {
  className?: string;
}

export function WaveAnimation({ className = "" }: WaveAnimationProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-16 bg-primary-light opacity-10"
        initial={{ y: 100 }}
        animate={{
          y: [50, 0, 50],
        }}
        transition={{
          repeat: Infinity,
          duration: 10,
          ease: "easeInOut",
        }}
        style={{
          borderRadius: "100% 100% 0 0",
        }}
      />
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-12 bg-secondary opacity-10"
        initial={{ y: 80 }}
        animate={{
          y: [40, 0, 40],
        }}
        transition={{
          repeat: Infinity,
          duration: 8,
          ease: "easeInOut",
          delay: 0.5,
        }}
        style={{
          borderRadius: "100% 100% 0 0",
        }}
      />
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-8 bg-accent opacity-10"
        initial={{ y: 60 }}
        animate={{
          y: [30, 0, 30],
        }}
        transition={{
          repeat: Infinity,
          duration: 6,
          ease: "easeInOut",
          delay: 1,
        }}
        style={{
          borderRadius: "100% 100% 0 0",
        }}
      />
    </div>
  );
}
