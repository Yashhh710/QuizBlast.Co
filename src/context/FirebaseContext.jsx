import { createContext, useContext } from 'react';
import { dbSet, dbGet, dbUpdate, dbDelete, dbListen, dbStopListen, dbStopAll } from '../services/firebase';

const FirebaseContext = createContext(null);

export function FirebaseProvider({ children }) {
  return (
    <FirebaseContext.Provider value={{ dbSet, dbGet, dbUpdate, dbDelete, dbListen, dbStopListen, dbStopAll }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  return useContext(FirebaseContext);
}
