import React, { useState, useEffect } from 'react';
import { Player } from '@lottiefiles/react-lottie-player';
import celebrationAnimation from '@assets/Celebration x1.5.json';

interface CelebrationAnimationProps {
  isVisible: boolean;
  onComplete?: () => void;
}

const CelebrationAnimation: React.FC<CelebrationAnimationProps> = ({ 
  isVisible, 
  onComplete 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  }, [isVisible]);

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <Player
        autoplay
        keepLastFrame={false}
        src={celebrationAnimation}
        style={{ width: '100%', height: '100%' }}
        loop={false}
        onEvent={event => {
          if (event === 'complete') {
            handleComplete();
          }
        }}
      />
    </div>
  );
};

export default CelebrationAnimation;