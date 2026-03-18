'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

/**
 * Consolidating Firebase initialization and enforcing browserLocalPersistence.
 */
export function initializeFirebase() {
  let app: FirebaseApp;
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  
  const auth = getAuth(app);
  
  // CRITICAL: Ensure the session survives page refreshes and browser restarts
  // SSR Safeguard: Only execute persistence logic on the client side.
  if (typeof window !== 'undefined') {
    setPersistence(auth, browserLocalPersistence).catch(err => {
      console.error("Firebase persistence error:", err);
    });
  }

  return {
    firebaseApp: app,
    auth,
    firestore: getFirestore(app)
  };
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
