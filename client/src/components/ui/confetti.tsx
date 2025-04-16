import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiProps {
  duration?: number;
  particleCount?: number;
  spread?: number;
  startVelocity?: number;
  colors?: string[];
  trigger?: boolean;
}

export function Confetti({
  duration = 3000,
  particleCount = 100,
  spread = 70,
  startVelocity = 30,
  colors = ['#5C3FC1', '#FF6B6B', '#27AE60', '#FFD166', '#06D6A0'],
  trigger = false
}: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const confettiInstance = useRef<confetti.CreateTypes | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    confettiInstance.current = confetti.create(canvas, {
      resize: true,
      useWorker: true
    });
    
    return () => {
      if (confettiInstance.current) {
        // @ts-ignore - canvas-confetti types don't include reset but it exists
        confettiInstance.current.reset();
      }
    };
  }, []);

  useEffect(() => {
    if (trigger && confettiInstance.current) {
      confettiInstance.current({
        particleCount,
        spread,
        startVelocity,
        colors,
        origin: { y: 0.6 },
        disableForReducedMotion: true
      });

      const end = Date.now() + duration;

      const interval = setInterval(() => {
        if (Date.now() > end || !confettiInstance.current) {
          clearInterval(interval);
          return;
        }

        confettiInstance.current({
          particleCount: particleCount / 2,
          spread: spread - 10,
          startVelocity: startVelocity / 2,
          colors,
          origin: { 
            x: Math.random(),
            y: Math.random() - 0.2
          },
          disableForReducedMotion: true
        });
      }, 250);
    }
  }, [trigger, particleCount, spread, startVelocity, colors, duration]);

  return (
    <canvas 
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
