import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  minutes: number;
  onTimeUp?: () => void;
  className?: string;
  isExpired?: boolean; // Optional prop to indicate the timer is already expired
}

export function CountdownTimer({ minutes, onTimeUp, className, isExpired = false }: CountdownTimerProps) {
  // Calculate total seconds from minutes
  const totalSeconds = minutes * 60;
  
  // State to track remaining time
  const [timeRemaining, setTimeRemaining] = useState(isExpired ? 0 : totalSeconds);
  const [isTimeUp, setIsTimeUp] = useState(isExpired);
  
  // Use ref to track if timer has been initialized
  const initializedRef = useRef(false);
  
  // Format seconds to MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.abs(seconds) % 60;
    const sign = seconds < 0 ? '-' : '';
    return `${sign}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  useEffect(() => {
    // Initialize timer only once
    if (isExpired) {
      setTimeRemaining(0);
      setIsTimeUp(true);
      return;
    }
    
    // If timer was already initialized, don't reset it
    if (initializedRef.current) {
      return;
    }
    
    // Initialize timer with full time
    setTimeRemaining(totalSeconds);
    setIsTimeUp(false);
    initializedRef.current = true;
  }, [totalSeconds, isExpired]);
  
  useEffect(() => {
    // If already expired, don't start the timer
    if (isExpired || isTimeUp) {
      return;
    }
    
    // Create interval to decrement time
    const timerInterval = setInterval(() => {
      setTimeRemaining(prev => {
        // Don't decrement below 0
        if (prev <= 0) {
          clearInterval(timerInterval);
          setIsTimeUp(true);
          if (onTimeUp) onTimeUp();
          return 0;
        }
        
        const newTime = prev - 1;
        
        // If time is up
        if (newTime === 0) {
          setIsTimeUp(true);
          if (onTimeUp) onTimeUp();
        }
        
        return newTime;
      });
    }, 1000);
    
    // Clean up interval
    return () => clearInterval(timerInterval);
  }, [onTimeUp, isExpired, isTimeUp]);
  
  // Determine color based on time remaining
  // Red when time is up, yellow when less than 20% remains
  const getTimerColor = () => {
    if (timeRemaining <= 0) return 'text-red-500 border-red-200 bg-red-50';
    if (timeRemaining <= totalSeconds * 0.2) return 'text-amber-500 border-amber-200 bg-amber-50';
    return 'text-green-600 border-green-200 bg-green-50';
  };
  
  return (
    <div 
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm font-medium transition-colors',
        getTimerColor(),
        className
      )}
    >
      <Clock className="h-4 w-4" />
      <span>{formatTime(timeRemaining)}</span>
      
      {isTimeUp && (
        <span className="text-xs font-normal">
          وقت مقترح انتهى
        </span>
      )}
    </div>
  );
}