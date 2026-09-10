"use client";

import firebase from "firebase/compat/app";
import "firebase/compat/firestore";

// The Firebase web config is loaded from NEXT_PUBLIC_* env vars rather than
// hardcoded (unlike the bar app) — this repo has no real Firebase project
// wired up yet, so there's nothing safe to bake in at build time. Once you
// create the Firebase project (see README "Manual setup"), copy its web
// config into these vars in .env.local (dev) and Vercel Project Settings
// (production). Firebase web config values are not secret by design (Google
// docs: security comes from Firestore rules, not from hiding this object) —
// NEXT_PUBLIC_* is the correct, intended way to ship them to the browser.
const FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(
  FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId,
);

if (firebaseConfigured && !firebase.apps.length) {
  firebase.initializeApp(FIREBASE_CONFIG);
}

export const db = firebaseConfigured ? firebase.firestore() : null;
