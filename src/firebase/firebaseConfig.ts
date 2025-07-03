import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirebaseConfig } from "./firebase-public";

// Initialize Firebase
const app = initializeApp(getFirebaseConfig());

// Initialize Firebase Auth and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
