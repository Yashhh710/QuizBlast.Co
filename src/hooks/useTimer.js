import { useState, useRef, useEffect, useCallback } from 'react';

export function useTimer(initialTime, onTick, onExpire) {
  const [timeLeft, setTimeLeft] = useState(initialTime);

  // Everything in refs - completely immune to React renders
  const ref = useRef({
    interval: null,
    running: false,
    current: initialTime,
    onTick: onTick,
    onExpire: onExpire,
  });

  // Sync callbacks every render WITHOUT touching the interval
  ref.current.onTick = onTick;
  ref.current.onExpire = onExpire;

  // start/stop/addTime are wrapped in useCallback so their references are
  // stable across renders — prevents any useEffect that depends on them
  // from accidentally re-running and restarting or clearing the interval.
  const start = useCallback((time) => {
    const r = ref.current;

    // Clear any existing interval before starting a new one
    if (r.interval) {
      clearInterval(r.interval);
      r.interval = null;
    }

    const from = (time !== undefined ? time : initialTime);
    r.current = from;
    r.running = true;
    setTimeLeft(from);

    r.interval = setInterval(() => {
      // Guard: if stop() was called between ticks, bail out
      if (!r.running) {
        clearInterval(r.interval);
        r.interval = null;
        return;
      }

      r.current -= 1;
      const next = r.current;

      // Always update the displayed time — even after answer selection
      setTimeLeft(next);

      if (r.onTick) r.onTick(next);

      if (next <= 0) {
        clearInterval(r.interval);
        r.interval = null;
        r.running = false;
        if (r.onExpire) r.onExpire();
      }
    }, 1000);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stop = useCallback(() => {
    const r = ref.current;
    r.running = false;
    if (r.interval) {
      clearInterval(r.interval);
      r.interval = null;
    }
  }, []);

  const addTime = useCallback((extra) => {
    ref.current.current += extra;
    setTimeLeft(prev => prev + extra);
  }, []);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      const r = ref.current;
      if (r.interval) {
        clearInterval(r.interval);
        r.interval = null;
      }
      r.running = false;
    };
  }, []);

  return { timeLeft, start, stop, addTime };
}
