import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAzoQ-_TXuZ3at_GWOQhaSOVVodLUyn-_I",
  authDomain: "pawconnect-87660.firebaseapp.com",
  projectId: "pawconnect-87660",
  storageBucket: "pawconnect-87660.firebasestorage.app",
  messagingSenderId: "101314608797",
  appId: "1:101314608797:web:bf84587729dc5a10945e74",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);