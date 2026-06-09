import { useState, useEffect, useRef } from 'react';

export function useTimer(initialTime, onTick, onExpire) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const onTickRef = useRef(onTick);
  const onExpireRef = useRef(onExpire);

  useEffect(() => { onTickRef.current = onTick; }, [onTick]);
  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

  // The single interval — only runs while isTimerRunning is true
  useEffect(() => {
    if (!isTimerRunning) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (onTickRef.current) onTickRef.current(prev - 1);
        if (prev <= 1) {
          clearInterval(timer);
          setIsTimerRunning(false);
          // Fire onExpire outside the state updater to avoid stale closures
          setTimeout(() => { if (onExpireRef.current) onExpireRef.current(); }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerRunning]);

  const start = (time) => {
    const startTime = time !== undefined ? time : initialTime;
    setTimeLeft(startTime);
    setIsTimerRunning(true);
  };

  const stop = () => {
    setIsTimerRunning(false);
  };

  const addTime = (extra) => {
    setTimeLeft((prev) => prev + extra);
  };

  return { timeLeft, isTimerRunning, start, stop, addTime };
}
