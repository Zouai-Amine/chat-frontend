// lib/auth.ts
import { auth, db } from "./firebase";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User,
    updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export async function firebaseLogin(email: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
}

export async function firebaseSignup(email: string, password: string, username?: string) {
    // For Firebase, we still need an email, but we'll use username as the primary identifier
    // We'll create a dummy email if needed, but for now let's keep email requirement
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // Update the user's display name
    if (username) {
        await updateProfile(userCredential.user, {
            displayName: username,
        });
    }

    // Store additional user data in Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: email,
        username: username || '',
        createdAt: new Date(),
        uid: userCredential.user.uid,
    });

    return userCredential.user;
}

export async function firebaseLogout() {
    await signOut(auth);
}

export function onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
}
