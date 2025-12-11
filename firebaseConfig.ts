
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Helper to resolve environment variables from Vite (import.meta.env) or Webpack (process.env)
const getEnv = (key: string) => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    // @ts-ignore
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return "";
};

const firebaseConfig = {
  apiKey: getEnv("REACT_APP_FIREBASE_API_KEY") || getEnv("VITE_FIREBASE_API_KEY") || "mock-key",
  authDomain: getEnv("REACT_APP_FIREBASE_AUTH_DOMAIN") || getEnv("VITE_FIREBASE_AUTH_DOMAIN") || "mock-project.firebaseapp.com",
  projectId: getEnv("REACT_APP_FIREBASE_PROJECT_ID") || getEnv("VITE_FIREBASE_PROJECT_ID") || "mock-project",
  storageBucket: getEnv("REACT_APP_FIREBASE_STORAGE_BUCKET") || getEnv("VITE_FIREBASE_STORAGE_BUCKET") || "mock-project.appspot.com",
  messagingSenderId: getEnv("REACT_APP_FIREBASE_MESSAGING_SENDER_ID") || getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID") || "00000000000",
  appId: getEnv("REACT_APP_FIREBASE_APP_ID") || getEnv("VITE_FIREBASE_APP_ID") || "1:00000000000:web:00000000000000"
};

// Initialize Firebase
let app = null;
let authService = null;
let dbService = null;
let storageService = null;

try {
    // Strict check: Only initialize if we have a real key (not the default mock or empty)
    if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "mock-key") {
        app = initializeApp(firebaseConfig);
    } else {
        console.info("Firebase Config missing or using mock keys. App running in Local/Demo mode.");
    }
} catch (e) {
    console.error("Firebase Initialization Error:", e);
}

// Export Services (safe to use even if null, the StorageService handles null checks)
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;
