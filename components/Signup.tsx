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
        <div className="flex items-center justify-center h-full w-full">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-full max-w-md p-8 bg-card/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-border"
            >
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <UserPlus className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-3xl font-bold text-foreground">
                        Create Account
                    </h2>
                    <p className="text-muted-foreground mt-2">
                        Join us and start chatting
                    </p>
                </div>

                <div className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-6 py-4 bg-secondary/50 border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />

                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-6 py-4 bg-secondary/50 border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-6 py-4 bg-secondary/50 border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSignup(email, username, password)}
                        className="w-full bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
                    >
                        Sign Up
                    </motion.button>
                </div>

                <p className="mt-8 text-center text-muted-foreground">
                    Already have an account?{" "}
                    <button onClick={onLoginClick} className="text-primary font-semibold hover:underline">
                        Log in
                    </button>
                </p>
            </motion.div>
        </div>
    );
}
