// lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyClEML18WWV6bTGOeb7psDl3E-ZRHa-qcQ",
    authDomain: "chatapp-316fd.firebaseapp.com",
    projectId: "chatapp-316fd",
    storageBucket: "chatapp-316fd.firebasestorage.app",
    messagingSenderId: "38819846899",
    appId: "1:38819846899:web:80d657363b1135ec0ff586",
    measurementId: "G-YXW8NJ0TRR"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);