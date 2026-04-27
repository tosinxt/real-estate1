import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Lazily initialized — safe to import on server; actual usage is client-only
let app: FirebaseApp;
let _auth: Auth;
let _db: Firestore;
let _storage: FirebaseStorage;

function getApp(): FirebaseApp {
  if (!app) {
    app = getApps().length === 0
      ? initializeApp({
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        })
      : getApps()[0];
  }
  return app;
}

export const auth: Auth = typeof window !== "undefined"
  ? (_auth ??= getAuth(getApp()))
  : ({} as Auth);

export const db: Firestore = typeof window !== "undefined"
  ? (_db ??= getFirestore(getApp()))
  : ({} as Firestore);

export const storage: FirebaseStorage = typeof window !== "undefined"
  ? (_storage ??= getStorage(getApp()))
  : ({} as FirebaseStorage);

export const googleProvider = new GoogleAuthProvider();
