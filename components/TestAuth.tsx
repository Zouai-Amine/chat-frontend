"use client"; // Next 13 app router: make it client component
import { useEffect, useState } from "react";
import { auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function TestAuth() {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        if (!auth) return;
        const unsub = onAuthStateChanged(auth, (u) => setUser(u));
        return () => unsub();
    }, []);

    return (
        <div>
            <h3>Auth test</h3>
            {user ? (
                <div>Logged in as: {user.email ?? user.uid}</div>
            ) : (
                <div>Not logged in (no user)</div>
            )}
        </div>
    );
}
