// ── AUTHENTICATION ──
import { auth, provider } from './firebase';
import { signInWithPopup, signOut as fbSignOut } from 'firebase/auth';

export function signIn(): void {
  signInWithPopup(auth, provider).then(() => {
    // Auth state change handled by onAuthStateChanged in firebase.ts
  }).catch((error: Error) => {
    console.error("Error signing in:", error);
    alert("Could not sign in: " + error.message);
  });
}

export function signOut(): void {
  fbSignOut(auth).catch((error: Error) => {
    console.error("Error signing out:", error);
  });
}
