// ============================================================
// Firebase Configuration
// Replace the values below with your own Firebase project config.
// Go to Firebase Console > Project Settings > General > Your apps
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCCRfcfV2KKtEqcHj84ZYh2yEsdirhSsmA",
  authDomain: "tejdipcreations-2f285.firebaseapp.com",
  projectId: "tejdipcreations-2f285",
  storageBucket: "tejdipcreations-2f285.firebasestorage.app",
  messagingSenderId: "610141789331",
  appId: "1:610141789331:web:28564e758ef6b0220a8166"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
