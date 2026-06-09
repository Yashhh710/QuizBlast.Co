import { useState, useRef, useEffect } from 'react';

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

  const start = (time) => {
    const r = ref.current;
    clearInterval(r.interval);
    r.interval = null;

    const from = (time !== undefined ? time : initialTime);
    r.current = from;
    r.running = true;
    setTimeLeft(from);

    r.interval = setInterval(() => {
      if (!r.running) {
        clearInterval(r.interval);
        r.interval = null;
        return;
      }

      r.current -= 1;
      const next = r.current;
      setTimeLeft(next);

      if (r.onTick) r.onTick(next);

      if (next <= 0) {
        clearInterval(r.interval);
        r.interval = null;
        r.running = false;
        if (r.onExpire) r.onExpire();
      }
    }, 1000);
  };

  const stop = () => {
    const r = ref.current;
    r.running = false;
    clearInterval(r.interval);
    r.interval = null;
  };

  const addTime = (extra) => {
    ref.current.current += extra;
    setTimeLeft(prev => prev + extra);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(ref.current.interval);
      ref.current.running = false;
    };
  }, []);

  return { timeLeft, start, stop, addTime };
}
