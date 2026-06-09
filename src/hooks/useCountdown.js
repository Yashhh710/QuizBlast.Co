import { useState, useEffect, useCallback, useRef } from 'react';
import { soundCountdown } from '../utils/sounds';
import { speakText } from '../utils/helpers';

export function useCountdown() {
  const [counting, setCounting] = useState(false);
  const [countNum, setCountNum] = useState(3);
  const cbRef = useRef(null);
  const isHostRef = useRef(false);

  const startCountdown = useCallback((onDone, isHost = false) => {
    cbRef.current = onDone;
    isHostRef.current = isHost;
    setCountNum(3);
    setCounting(true);
    soundCountdown();
    speakText('3', isHost);
  }, []);

  useEffect(() => {
    if (!counting) return;
    if (countNum <= 0) {
      setCounting(false);
      if (cbRef.current) cbRef.current();
      return;
    }
    const t = setTimeout(() => {
      const next = countNum - 1;
      if (next > 0) {
        soundCountdown();
        speakText(next.toString(), isHostRef.current);
      }
      setCountNum(next);
    }, 900);
    return () => clearTimeout(t);
  }, [counting, countNum]);

  return { counting, countNum, startCountdown };
}
