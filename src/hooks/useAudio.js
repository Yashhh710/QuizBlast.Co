import { useCallback, useEffect } from 'react';
import { soundClick } from '../utils/sounds';

export function useAudio() {
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
        soundClick();
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);
}
