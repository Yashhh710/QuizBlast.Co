import { useState, useEffect, useRef, useCallback } from 'react';

export function useTimer(initialTime, onTick, onExpire) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const intervalRef = useRef(null);
  const onTickRef = useRef(onTick);
  const onExpireRef = useRef(onExpire);

  useEffect(() => { onTickRef.current = onTick; }, [onTick]);
  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

  const start = useCallback((time) => {
    clearInterval(intervalRef.current);
    const startTime = time !== undefined ? time : initialTime;
    setTimeLeft(startTime);
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        if (onTickRef.current) onTickRef.current(next);
        if (next <= 0) {
          clearInterval(intervalRef.current);
          if (onExpireRef.current) onExpireRef.current();
          return 0;
        }
        return next;
      });
    }, 1000);
  }, [initialTime]);

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
  }, []);

  const addTime = useCallback((extra) => {
    setTimeLeft(prev => prev + extra);
  }, []);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  return { timeLeft, setTimeLeft, start, stop, addTime };
}
