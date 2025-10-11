'use client';
import React from "react";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

interface LoginProps {
  username: string;
  setUsername: (username: string) => void;
  connect: () => void;
}

function Login({ username, setUsername, connect }: LoginProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="m-auto text-center bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/20 dark:border-slate-600/50 ring-1 ring-white/10 dark:ring-slate-700/50"
    >
      <MessageCircle className="w-16 h-16 mx-auto mb-4 text-blue-400" />
      <h2 className="text-4xl font-bold mb-8 bg-gradient-to-r from-cyan-400 via-blue-500 to-pink-500 bg-clip-text text-transparent animate-pulse">
        Join the Chat
      </h2>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Enter your username"
        className="w-full px-6 py-4 bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm border border-white/30 dark:border-slate-600/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 mb-6 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 shadow-lg transition-all duration-300 hover:shadow-xl"
        onKeyDown={(e) => e.key === "Enter" && connect()}
      />
      <motion.button
        whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(34, 211, 238, 0.5)" }}
        whileTap={{ scale: 0.95 }}
        onClick={connect}
        className="w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-pink-500 hover:from-cyan-600 hover:via-blue-600 hover:to-pink-600 px-8 py-4 rounded-2xl font-bold text-white shadow-2xl transition-all duration-300 ring-2 ring-white/20 hover:ring-cyan-400/50"
      >
        Join Chat
      </motion.button>
    </motion.div>
  );
}

export default Login;