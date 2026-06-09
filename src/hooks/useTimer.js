import { useState, useRef, useCallback, useEffect } from 'react';

export function useTimer(initialTime, onTick, onExpire) {
  // timeLeft is the only piece of state — drives the UI
  const [timeLeft, setTimeLeft] = useState(initialTime);

  // Everything else lives in refs — completely outside React's render cycle
  const intervalRef   = useRef(null);
  const timeLeftRef   = useRef(initialTime);  // source of truth for the interval
  const isRunningRef  = useRef(false);
  const onTickRef     = useRef(onTick);
  const onExpireRef   = useRef(onExpire);

  // Keep callbacks current without ever restarting the interval
  onTickRef.current   = onTick;
  onExpireRef.current = onExpire;

  const stop = useCallback(() => {
    isRunningRef.current = false;
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  const start = useCallback((time) => {
    // Kill any existing interval cleanly
    clearInterval(intervalRef.current);
    intervalRef.current = null;

    const startAt = (time !== undefined ? time : initialTime);
    timeLeftRef.current = startAt;
    isRunningRef.current = true;
    setTimeLeft(startAt);

    intervalRef.current = setInterval(() => {
      // Guard: if stop() was called between ticks, bail out
      if (!isRunningRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        return;
      }

      timeLeftRef.current -= 1;
      const next = timeLeftRef.current;

      // Update UI
      setTimeLeft(next);

      // Tick callback (e.g. sound) — read from ref, never stale
      if (onTickRef.current) onTickRef.current(next);

      if (next <= 0) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        isRunningRef.current = false;
        // Fire expire outside the interval callback to avoid any batching issues
        setTimeout(() => {
          if (onExpireRef.current) onExpireRef.current();
        }, 0);
      }
    }, 1000);
  }, [initialTime]); // initialTime is static (timePerQ never changes mid-game)

  const addTime = useCallback((extra) => {
    timeLeftRef.current += extra;
    setTimeLeft(prev => prev + extra);
  }, []);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      isRunningRef.current = false;
    };
  }, []);

  return { timeLeft, start, stop, addTime };
}
