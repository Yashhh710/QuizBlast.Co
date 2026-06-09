import { useEffect, useRef } from 'react';
import { dbListen, dbStopListen } from '../services/firebase';

export function useFirebaseListener(path, callback, enabled = true) {
  // Store callback in a ref so the interval/poll always calls the latest
  // version without needing to restart the listener when the callback changes.
  // We deliberately do NOT put callback in a useEffect dependency array —
  // that pattern caused cascading re-renders when the host page rebuilt its
  // inline async callback on every answersCount state update.
  const cbRef = useRef(callback);
  cbRef.current = callback; // update synchronously on every render

  useEffect(() => {
    if (!path || !enabled) return;
    dbListen(path, (data) => cbRef.current(data));
    return () => dbStopListen(path);
  }, [path, enabled]); // eslint-disable-line react-hooks/exhaustive-deps
}
