'use client';
import React, { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus } from "lucide-react";

interface SignupProps {
    onSignup: (email: string, username: string, password: string) => void;
    onLoginClick: () => void;
}

export default function Signup({ onSignup, onLoginClick }: SignupProps) {
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="m-auto text-center bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/20 dark:border-slate-600/50"
        >
            <UserPlus className="w-16 h-16 mx-auto mb-4 text-green-400" />
            <h2 className="text-4xl font-bold mb-8 bg-gradient-to-r from-green-400 via-blue-500 to-pink-500 bg-clip-text text-transparent">
                Create Account
            </h2>

            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-6 py-4 mb-4 bg-white/70 dark:bg-slate-700/70 border rounded-2xl text-slate-900 dark:text-white"
            />

            <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-6 py-4 mb-4 bg-white/70 dark:bg-slate-700/70 border rounded-2xl text-slate-900 dark:text-white"
            />

            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-4 mb-6 bg-white/70 dark:bg-slate-700/70 border rounded-2xl text-slate-900 dark:text-white"
            />

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSignup(email, username, password)}
                className="w-full bg-gradient-to-r from-green-500 via-blue-500 to-pink-500 px-8 py-4 rounded-2xl font-bold text-white shadow-xl"
            >
                Sign Up
            </motion.button>

            <p className="mt-6 text-slate-500 dark:text-slate-300">
                Already have an account?{" "}
                <button onClick={onLoginClick} className="text-blue-500 hover:underline">
                    Log in
                </button>
            </p>
        </motion.div>
    );
}
