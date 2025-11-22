
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// ✅ Evita inicialização duplicada
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ✅ Log opcional para ambiente de desenvolvimento
if (import.meta.env.DEV) {
  console.log("🔥 Firebase App inicializado:", app.name);
  console.log("🔑 Configuração:", firebaseConfig);
}

export const db = getFirestore(app);
export const auth = getAuth(app);
