import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  stageId: number; // The ID of the stage this timer belongs to
  minutes: number; // Time limit in minutes
  onTimeUp?: (stageId: number) => void; // Callback when time is up
  className?: string;
  isExpired?: boolean; // Whether the timer has already expired
}

export function CountdownTimer({ 
  stageId, 
  minutes, 
  onTimeUp, 
  className, 
  isExpired = false 
}: CountdownTimerProps) {
  // Calculate total seconds from minutes
  const totalSeconds = minutes * 60;
  
  // State to track remaining time
  const [timeRemaining, setTimeRemaining] = useState(isExpired ? 0 : totalSeconds);
  const [isTimeUp, setIsTimeUp] = useState(isExpired);
  
  // Use ref to track if timer has started running
  const hasStartedRef = useRef(false);
  
  // Format seconds to MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.abs(seconds) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  useEffect(() => {
    // If already marked as expired, set the timer to zero
    if (isExpired) {
      setTimeRemaining(0);
      setIsTimeUp(true);
      return;
    }
    
    // Only start the timer once
    if (hasStartedRef.current) {
      return;
    }
    
    // Mark timer as started
    hasStartedRef.current = true;
    
    // Set up the interval to count down
    const timerInterval = setInterval(() => {
      setTimeRemaining(prev => {
        // Don't decrement below zero
        if (prev <= 0) {
          clearInterval(timerInterval);
          setIsTimeUp(true);
          if (onTimeUp) onTimeUp(stageId);
          return 0;
        }
        
        const newTime = prev - 1;
        
        // If time is exactly zero
        if (newTime === 0) {
          setIsTimeUp(true);
          if (onTimeUp) onTimeUp(stageId);
        }
        
        return newTime;
      });
    }, 1000);
    
    // Clean up interval
    return () => clearInterval(timerInterval);
  }, [isExpired, onTimeUp, stageId, totalSeconds]);
  
  // Determine color based on time remaining
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
        <span className="text-xs font-normal mr-1">
          وقت مقترح انتهى
        </span>
      )}
    </div>
  );
}