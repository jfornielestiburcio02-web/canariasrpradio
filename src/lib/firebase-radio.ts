import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDeDlJrJi0Hz2HQHCZrL1kCynhwF25bUfo",
  authDomain: "radiocanariasrp.firebaseapp.com",
  projectId: "radiocanariasrp",
  storageBucket: "radiocanariasrp.firebasestorage.app",
  messagingSenderId: "933928230872",
  appId: "1:933928230872:web:a92d6adb19f3e141b7dcad"
};

/**
 * Singleton para asegurar que Firebase se inicializa una sola vez
 * y evitar errores de CONFIGURATION_NOT_FOUND.
 */
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const dbRadio = getFirestore(app);
