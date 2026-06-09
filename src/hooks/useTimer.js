import { useState, useEffect, useRef, useCallback } from 'react';

export function useTimer(initialTime, onTick, onExpire) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const intervalRef = useRef(null);
  const onTickRef = useRef(onTick);
  const onExpireRef = useRef(onExpire);
  const expiredRef = useRef(false);  // prevent double-fire

  useEffect(() => { onTickRef.current = onTick; }, [onTick]);
  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  const start = useCallback((time) => {
    clearInterval(intervalRef.current);
    expiredRef.current = false;
    const startTime = time !== undefined ? time : initialTime;
    setTimeLeft(startTime);
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        if (onTickRef.current) onTickRef.current(next);
        if (next <= 0) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          // Fire onExpire once, outside the state updater
          if (!expiredRef.current) {
            expiredRef.current = true;
            setTimeout(() => {
              if (onExpireRef.current) onExpireRef.current();
            }, 0);
          }
          return 0;
        }
        return next;
      });
    }, 1000);
  }, [initialTime]);

  const addTime = useCallback((extra) => {
    setTimeLeft(prev => prev + extra);
  }, []);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  return { timeLeft, setTimeLeft, start, stop, addTime };
}
