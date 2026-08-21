
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

/**
 * Singleton consistente para evitar errores CONFIGURATION_NOT_FOUND
 */
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const dbRadio = getFirestore(app);
