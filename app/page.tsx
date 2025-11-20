'use client';
import React, { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import Login from "../components/Login";
import Signup from "@/components/Signup";
import ChatLayout from "./components/ChatLayout";

export default function App() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Load dark mode preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark');
    } else {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(systemPrefersDark);
    }
  }, []);

  // Apply dark mode class and save preference
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const handleSignup = async (email: string, username: string, password: string) => {
    try {
      const response = await fetch(`${backendUrl}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      });

      if (!response.ok) throw new Error("Signup failed");

      alert("Signup successful! Please log in.");
      setShowSignup(false);
    } catch (err) {
      alert("Signup failed!");
    }
  };

  const handleLogin = async (username: string, password: string) => {
    try {
      const response = await fetch(`${backendUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) throw new Error("Invalid credentials");

      const data = await response.json();
      localStorage.setItem("token", data.access_token);
      
      // Fetch user ID
      const userRes = await fetch(`${backendUrl}/users?username=${username}`);
      if (userRes.ok) {
        const user = await userRes.json();
        setUserId(user.id);
        setUsername(username);
        setLoggedIn(true);
      } else {
         alert("Login successful but failed to fetch user details.");
      }

    } catch (err) {
      alert("Login failed!");
    }
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setUserId(null);
    setUsername("");
    localStorage.removeItem("token");
  };

  return (
    <div className="h-screen w-full bg-background text-foreground overflow-hidden relative transition-colors duration-300">
       {/* Background Effects */}
       <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <AnimatePresence mode="wait">
        {!loggedIn ? (
          showSignup ? (
            <Signup
              key="signup"
              onSignup={handleSignup}
              onLoginClick={() => setShowSignup(false)}
            />
          ) : (
            <Login
              key="login"
              onLogin={handleLogin}
              onSignupClick={() => setShowSignup(true)}
            />
          )
        ) : (
          userId && (
            <ChatLayout
              key="chat"
              username={username}
              userId={userId}
              onLogout={handleLogout}
            />
          )
        )}
      </AnimatePresence>
    </div>
  );
}