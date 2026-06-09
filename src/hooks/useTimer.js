import { useState, useEffect, useRef, useCallback } from 'react';

export function useTimer(initialTime, onTick, onExpire) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const intervalRef = useRef(null);
  const isRunningRef = useRef(false);   // track state without triggering re-renders
  const onTickRef = useRef(onTick);
  const onExpireRef = useRef(onExpire);

  // Always keep callbacks fresh without causing re-renders
  useEffect(() => { onTickRef.current = onTick; }, [onTick]);
  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

  const stop = useCallback(() => {
    isRunningRef.current = false;
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  const start = useCallback((time) => {
    // Clear any existing interval first
    clearInterval(intervalRef.current);
    intervalRef.current = null;

    const startTime = time !== undefined ? time : initialTime;
    setTimeLeft(startTime);
    isRunningRef.current = true;

    intervalRef.current = setInterval(() => {
      if (!isRunningRef.current) {
        clearInterval(intervalRef.current);
        return;
      }
      setTimeLeft(prev => {
        const next = prev - 1;
        if (onTickRef.current) onTickRef.current(next);
        if (next <= 0) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          isRunningRef.current = false;
          setTimeout(() => {
            if (onExpireRef.current) onExpireRef.current();
          }, 0);
          return 0;
        }
        return next;
      });
    }, 1000);
  }, [initialTime]);

  const addTime = useCallback((extra) => {
    setTimeLeft(prev => prev + extra);
  }, []);

  // Cleanup on unmount
  useEffect(() => () => {
    clearInterval(intervalRef.current);
    isRunningRef.current = false;
  }, []);

  return { timeLeft, start, stop, addTime };
}
