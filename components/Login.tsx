'use client';
import React, { useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

interface LoginProps {
    onLogin: (username: string, password: string) => void;
    onSignupClick: () => void;
}

export default function Login({ onLogin, onSignupClick }: LoginProps) {
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
                        <MessageCircle className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-3xl font-bold text-foreground">
                        Welcome Back
                    </h2>
                    <p className="text-muted-foreground mt-2">
                        Login to continue chatting
                    </p>
                </div>

                <div className="space-y-4">
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
                        onKeyDown={(e) => e.key === "Enter" && onLogin(username, password)}
                    />

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onLogin(username, password)}
                        className="w-full bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
                    >
                        Login
                    </motion.button>
                </div>

                <p className="mt-8 text-center text-muted-foreground">
                    Don’t have an account?{" "}
                    <button
                        onClick={onSignupClick}
                        className="text-primary font-semibold hover:underline"
                    >
                        Sign up
                    </button>
                </p>
            </motion.div>
        </div>
    );
}
