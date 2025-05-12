import React, { useRef, useEffect } from 'react';
import { Player } from '@lottiefiles/react-lottie-player';

// Use a static path to the animation file - this is more reliable
const celebrationAnimationPath = '/animations/celebration-full.json';

interface CelebrationAnimationProps {
  isVisible: boolean;
  onComplete?: () => void;
}

const CelebrationAnimation: React.FC<CelebrationAnimationProps> = ({ 
  isVisible, 
  onComplete 
}) => {
  const playerRef = useRef<any>(null);

  useEffect(() => {
    // When visibility changes, handle player state
    if (isVisible && playerRef.current) {
      playerRef.current.play();
    }
  }, [isVisible]);

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    }
  };

  // Don't render anything if not visible
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none bg-opacity-0">
      <div className="w-full h-full max-w-screen max-h-screen overflow-visible">
        <Player
          ref={playerRef}
          autoplay={true}
          keepLastFrame={false}
          src={celebrationAnimationPath}
          style={{ width: '120%', height: '120%', position: 'absolute', top: '-10%', left: '-10%' }}
          loop={false}
          speed={1.2}
          onEvent={event => {
            if (event === 'complete') {
              handleComplete();
            }
          }}
        />
      </div>
    </div>
  );
};

export default CelebrationAnimation;