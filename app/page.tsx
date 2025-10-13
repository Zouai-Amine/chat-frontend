'use client';
import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Login from "../components/Login";
import Chat from "../components/Chat";
import Signup from "@/components/Signup";

// For floating reaction emojis
type FloatingReaction = {
  id: number;
  emoji: string;
  x: number;
  y: number;
  angle: number;
};

interface User {
  id: number;
  username: string;
}

interface Message {
  id: number;
  sender: string;
  text: string;
  timestamp: string;
  reactions: { [user_id: string]: string };
}

function App() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [recipient, setRecipient] = useState<{ id: number; username: string } | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<
    {
      id?: number;
      sender: string;
      text: string;
      timestamp: Date;
      reactions: { [user_id: number]: string };
    }[]
  >([]);
  const [onlineUsers, setOnlineUsers] = useState<{ id: number; username: string }[]>([]);
  const [unread, setUnread] = useState<Record<string, number>>({});
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [showReactionPicker, setShowReactionPicker] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reactionIdRef = useRef(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

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

  // Scroll to bottom
  useEffect(() => {
    if (!isLoadingMore && !isReacting && !isInitialLoad) {
      requestAnimationFrame(() => {
        const scrollableDiv = document.getElementById('scrollableDiv') as HTMLElement;
        if (scrollableDiv) {
          scrollableDiv.scrollTop = scrollableDiv.scrollHeight;
        }
      });
    }
  }, [messages, isLoadingMore, isReacting, isInitialLoad]);

  // Auto-remove floating reactions after animation
  useEffect(() => {
    if (floatingReactions.length === 0) return;
    const timer = setTimeout(() => {
      setFloatingReactions((prev) => prev.slice(1));
    }, 2000);
    return () => clearTimeout(timer);
  }, [floatingReactions]);

  // --- Connect WebSocket ---
  const connect = async () => {
    if (!username.trim()) return alert("Please login first.");

    try {
      // First, get the user by username to get the ID
      const userRes = await fetch(`${backendUrl}/users?username=${username}`, {
        method: "GET",
      });

      if (!userRes.ok) {
        // If user doesn't exist, create it
        const createRes = await fetch(`${backendUrl}/users/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        });
        if (!createRes.ok) throw new Error("Failed to create user");
        const user = await createRes.json();
        setUserId(user.id);
        connectWebSocket(user.id);
      } else {
        const user = await userRes.json();
        setUserId(user.id);
        connectWebSocket(user.id);
      }
    } catch (err) {
      console.error("Error connecting:", err);
    }
  };

  const connectWebSocket = (userIdParam: number) => {
    const wsUrl = backendUrl.replace(/^http/, 'ws');
    const ws = new WebSocket(`${wsUrl}/ws/${userIdParam}`);

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setSocket(null);
      setTimeout(() => connectWebSocket(userIdParam), 2000);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "users") {
        setOnlineUsers(data.users.filter((u: User) => u.id !== userIdParam));
      } else if (data.type === "message") {
        const msg = {
          id: data.id,
          sender: data.sender,
          text: data.text,
          timestamp: new Date(data.timestamp || Date.now()),
          reactions: data.reactions || {},
        };
        setMessages((prev) => [...prev, msg]);

        if (data.sender !== username && data.sender !== recipient?.username) {
          setUnread((prev) => ({
            ...prev,
            [data.sender]: (prev[data.sender] || 0) + 1,
          }));
        }
      } else if (data.type === "typing") {
        if (data.is_typing) {
          setTypingUsers((prev) => [...new Set([...prev, data.sender])]);
        } else {
          setTypingUsers((prev) => prev.filter((u) => u !== data.sender));
        }
      } else if (data.type === "reaction") {
        // Normalize reaction to string
        let normalizedReaction = '';
        if (Array.isArray(data.reaction)) {
          normalizedReaction = data.reaction[0] || '';
        } else if (typeof data.reaction === 'object' && data.reaction) {
          normalizedReaction = data.reaction.reaction || '';
        } else if (typeof data.reaction === 'string') {
          normalizedReaction = data.reaction;
        }

        // Prevent auto-scroll during reaction update
        setIsReacting(true);

        // Only trigger floating animation if reaction is being added (not removed)
        if (normalizedReaction) {
          const msgElement = document.querySelector(`[data-message-id="${data.message_id}"]`);
          if (msgElement) {
            const rect = msgElement.getBoundingClientRect();
            const chatArea = document.querySelector('.flex-1.overflow-y-auto') as HTMLElement;
            if (chatArea) {
              const centerX = rect.left + rect.width / 2 - chatArea.getBoundingClientRect().left;
              const centerY = rect.top + rect.height / 2 - chatArea.getBoundingClientRect().top;
              const newReactions: FloatingReaction[] = [];
              for (let i = 0; i < 3; i++) {
                const angle = Math.random() * 360;
                newReactions.push({
                  id: reactionIdRef.current++,
                  emoji: normalizedReaction,
                  x: centerX,
                  y: centerY,
                  angle
                });
              }
              setFloatingReactions((prev) => [...prev, ...newReactions]);
            }
          }
        }

        // Update message reactions
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === data.message_id) {
              const newReactions = { ...msg.reactions };
              if (normalizedReaction) {
                newReactions[data.user_id] = normalizedReaction;
              } else {
                delete newReactions[data.user_id];
              }
              return {
                ...msg,
                reactions: newReactions,
              };
            }
            return msg;
          })
        );

        setTimeout(() => setIsReacting(false), 0);
      }
    };

    setSocket(ws);
  };

  // Connect to websocket when logged in
  useEffect(() => {
    if (loggedIn && username) {
      connect();
    }
  }, [loggedIn, username]);

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
      setUsername(username);
      setLoggedIn(true);
      alert("Login successful!");
    } catch (err) {
      alert("Login failed!");
    }
  };

  // Handle typing
  const handleTyping = useCallback(() => {
    if (!socket || !recipient || !userId) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.send(
        JSON.stringify({
          type: "typing",
          sender_id: userId,
          recipient_id: recipient.id,
          is_typing: true,
        })
      );
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (socket && recipient && userId) {
        socket.send(
          JSON.stringify({
            type: "typing",
            sender_id: userId,
            recipient_id: recipient.id,
            is_typing: false,
          })
        );
      }
    }, 1000);
  }, [socket, recipient, userId, isTyping]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  // Load more messages for infinite scroll
  const loadMoreMessages = useCallback(async () => {
    console.log("Loading more messages...");
    if (!recipient || !userId || isLoadingMore || !hasMoreMessages) return;

    setIsLoadingMore(true);
    const scrollableDiv = document.getElementById('scrollableDiv') as HTMLElement | null;
    if (!scrollableDiv) return;

    const oldScrollHeight = scrollableDiv.scrollHeight;
    const oldScrollTop = scrollableDiv.scrollTop;

    const olderMessages = await fetchMessages(userId, recipient.id, 20, messages.length);
    if (olderMessages.length < 20) {
      setHasMoreMessages(false);
    }
    setMessages(prev => [...olderMessages, ...prev]);

    requestAnimationFrame(() => {
      const newScrollHeight = scrollableDiv.scrollHeight;
      const heightDiff = newScrollHeight - oldScrollHeight;
      scrollableDiv.scrollTop = oldScrollTop + heightDiff;
    });

    setIsLoadingMore(false);
  }, [recipient, userId, isLoadingMore, hasMoreMessages, messages.length]);

  // Send message
  const sendMessage = useCallback(async () => {
    if (!socket || !recipient || !message.trim() || !userId) return;

    const newMessage = {
      sender: username,
      text: message,
      timestamp: new Date(),
      reactions: {},
    };
    setMessages((prev) => [...prev, newMessage]);
    setMessage("");

    socket.send(
      JSON.stringify({
        type: "message",
        sender_id: userId,
        recipient_id: recipient.id,
        text: message,
      })
    );
  }, [socket, recipient, message, userId, username]);

  // Fetch messages
  const fetchMessages = async (senderId: number, recipientId: number, limit?: number, offset?: number) => {
    try {
      let url = `${backendUrl}/messages/${senderId}/${recipientId}`;
      if (limit !== undefined && offset !== undefined) {
        url += `?limit=${limit}&offset=${offset}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const formatted = data.map((msg: Message) => {
          const normalizedReactions: { [key: number]: string } = {};
          if (msg.reactions && typeof msg.reactions === 'object') {
            Object.entries(msg.reactions).forEach(([userId, reaction]) => {
              let normalizedReaction = '';
              if (typeof reaction === 'string') {
                normalizedReaction = reaction;
              } else if (typeof reaction === 'object' && reaction !== null && 'reaction' in reaction) {
                const reactionObj = reaction as { reaction?: string };
                if (typeof reactionObj.reaction === 'string') {
                  normalizedReaction = reactionObj.reaction;
                }
              }
              if (normalizedReaction) {
                normalizedReactions[parseInt(userId)] = normalizedReaction;
              }
            });
          }

          return {
            id: msg.id,
            sender: msg.sender,
            text: msg.text,
            timestamp: new Date(msg.timestamp),
            reactions: normalizedReactions,
          };
        });
        return formatted;
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
    return [];
  };

  useEffect(() => {
    if (recipient && userId) {
      setUnread((prev) => {
        const updated = { ...prev };
        delete updated[recipient.username];
        return updated;
      });
      const loadInitial = async () => {
        setIsInitialLoad(true);
        const initialMessages = await fetchMessages(userId, recipient.id, 20, 0);
        setMessages(initialMessages.reverse());
        setHasMoreMessages(initialMessages.length === 20);
        setTimeout(() => setIsInitialLoad(false), 0);
      };
      loadInitial();
    }
  }, [recipient, userId]);

  // Send reaction + trigger local floating effect
  const sendReaction = useCallback((messageId: number, reaction: string) => {
    if (!socket || !userId) return;

    const msg = messages.find(m => m.id === messageId);
    if (!msg) return;

    const currentReaction = msg.reactions[userId];
    const newReaction = currentReaction === reaction ? '' : reaction;

    setIsReacting(true);

    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        const updatedReactions = { ...m.reactions };
        if (newReaction) {
          updatedReactions[userId] = newReaction;
        } else {
          delete updatedReactions[userId];
        }
        return { ...m, reactions: updatedReactions };
      }
      return m;
    }));

    setTimeout(() => setIsReacting(false), 0);

    if (newReaction) {
      const msgElement = document.querySelector(`[data-message-id="${messageId}"]`);
      if (msgElement) {
        const rect = msgElement.getBoundingClientRect();
        const chatArea = document.querySelector('.flex-1.overflow-y-auto') as HTMLElement;
        if (chatArea) {
          const centerX = rect.left + rect.width / 2 - chatArea.getBoundingClientRect().left;
          const centerY = rect.top + rect.height / 2 - chatArea.getBoundingClientRect().top;
          const newReactions: FloatingReaction[] = [];
          for (let i = 0; i < 3; i++) {
            const angle = Math.random() * 360;
            newReactions.push({
              id: reactionIdRef.current++,
              emoji: newReaction,
              x: centerX,
              y: centerY,
              angle
            });
          }
          setFloatingReactions((prev) => [...prev, ...newReactions]);
        }
      }
    }

    socket.send(
      JSON.stringify({
        type: "reaction",
        message_id: messageId,
        user_id: userId,
        reaction: newReaction,
      })
    );
  }, [socket, userId, messages]);

  return (
    <div className="flex flex-col md:flex-row h-screen text-slate-900 dark:text-white transition-all duration-500
    bg-gradient-to-br
    from-cyan-50 via-blue-50 to-pink-50
    dark:from-slate-900 dark:via-purple-900 dark:to-pink-900
    relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400 rounded-full animate-pulse opacity-20"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-pink-400 rounded-full animate-bounce opacity-30" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-blue-400 rounded-full animate-ping opacity-10" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Floating Reactions Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50">
        <AnimatePresence>
          {floatingReactions.map((fr) => {
            const distance = 150;
            const radian = (fr.angle * Math.PI) / 180;
            const endX = Math.cos(radian) * distance;
            const endY = Math.sin(radian) * distance;
            const randomRotate = Math.random() * 60 - 30;
            return (
              <motion.div
                key={fr.id}
                className="absolute text-5xl font-bold select-none drop-shadow-2xl filter"
                style={{
                  left: fr.x,
                  top: fr.y,
                  filter: 'drop-shadow(0 0 10px rgba(34, 211, 238, 0.5)) drop-shadow(0 0 20px rgba(168, 85, 247, 0.3))'
                }}
                initial={{ scale: 0, x: 0, y: 0, opacity: 0, rotate: 0 }}
                animate={{
                  scale: [0, 2, 1.5],
                  x: [0, endX * 0.5, endX],
                  y: [0, endY * 0.5, endY],
                  opacity: [0, 1, 0.9, 0],
                  rotate: [0, randomRotate, randomRotate * 1.5]
                }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{
                  duration: 2.5,
                  times: [0, 0.15, 0.4, 1],
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
              >
                {fr.emoji}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {!loggedIn ? (
          showSignup ? (
            <Signup
              onSignup={handleSignup}
              onLoginClick={() => setShowSignup(false)}
            />
          ) : (
            <Login
              onLogin={handleLogin}
              onSignupClick={() => setShowSignup(true)}
            />
          )
        ) : (
          <Chat
            recipient={recipient}
            setRecipient={setRecipient}
            message={message}
            setMessage={setMessage}
            messages={messages}
            setMessages={setMessages}
            onlineUsers={onlineUsers}
            unread={unread}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            showSearch={showSearch}
            setShowSearch={setShowSearch}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            typingUsers={typingUsers}
            isTyping={isTyping}
            floatingReactions={floatingReactions}
            showReactionPicker={showReactionPicker}
            setShowReactionPicker={setShowReactionPicker}
            scrollRef={scrollRef}
            sendMessage={sendMessage}
            sendReaction={sendReaction}
            handleTyping={handleTyping}
            username={username}
            userId={userId}
            socket={socket}
            hasMoreMessages={hasMoreMessages}
            loadMoreMessages={loadMoreMessages}
            isLoadingMore={isLoadingMore}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;