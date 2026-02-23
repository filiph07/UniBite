import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import Constants from 'expo-constants';

type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

const config = Constants.expoConfig?.extra?.firebase as FirebaseConfig | undefined;

if (!config) {
  // During development we'll just throw; in production this should be handled more gracefully.
  throw new Error(
    'Firebase config is missing. Please add a "firebase" object under expo.extra in app.json or app.config.',
  );
}

const app: FirebaseApp = getApps().length ? getApp() : initializeApp(config);
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db };

