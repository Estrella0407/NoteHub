// ── FIREBASE INIT ──
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";
import { appState } from './state';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app      = initializeApp(firebaseConfig);
const db       = getFirestore(app);
const auth     = getAuth(app);
const provider = new GoogleAuthProvider();

provider.addScope('https://www.googleapis.com/auth/calendar.events');

// Exporting
export { db, auth, provider };

onAuthStateChanged(auth, (user) => {
  appState.currentUser = user
    ? { uid: user.uid, displayName: user.displayName, email: user.email, getIdToken: user.getIdToken.bind(user) }
    : null;
  if (appState.onAuthChangedCallback) {
    appState.onAuthChangedCallback(appState.currentUser);
  }
});

