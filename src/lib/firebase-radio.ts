
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

// Inicialización segura para evitar múltiples instancias
const app = getApps().length > 0 ? getApp('radio') : initializeApp(firebaseConfig, 'radio');
export const dbRadio = getFirestore(app);
