
import { initializeFirebase } from "@/firebase";

/**
 * 🔥 FIXED:
 * Consolidating Firebase initialization to use the centralized @/firebase logic.
 * This prevents "Firebase App named '[DEFAULT]' already exists" errors in production.
 */

const { firebaseApp, auth, firestore } = initializeFirebase();

export { firebaseApp as app, auth, firestore as db };
export const googleProvider = null; // Use centralized AuthProvider logic instead
