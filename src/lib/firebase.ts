import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig as officialConfig } from "@/firebase/config";

/*
  🔥 FIXED:
  Using official config values to resolve auth-domain and invalid-api-key errors.
*/

const firebaseConfig = {
  apiKey: officialConfig.apiKey,
  authDomain: officialConfig.authDomain,
  projectId: officialConfig.projectId,
  storageBucket: `${officialConfig.projectId}.appspot.com`,
  messagingSenderId: officialConfig.messagingSenderId,
  appId: officialConfig.appId,
};

// Initialize Firebase only once
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Firebase Services
const auth = getAuth(app);
const db = getFirestore(app);

// Google Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export { app, auth, db, googleProvider };
