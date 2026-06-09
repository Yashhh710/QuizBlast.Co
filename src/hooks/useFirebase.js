import { useEffect, useRef } from 'react';
import { dbListen, dbStopListen } from '../services/firebase';

export function useFirebaseListener(path, callback, enabled = true) {
  const cbRef = useRef(callback);
  useEffect(() => { cbRef.current = callback; }, [callback]);

  useEffect(() => {
    if (!path || !enabled) return;
    dbListen(path, (data) => cbRef.current(data));
    return () => dbStopListen(path);
  }, [path, enabled]);
}
