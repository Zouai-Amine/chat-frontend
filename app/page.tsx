'use client';
import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Login from "../components/Login";
import Chat from "../components/Chat";
import Signup from "@/components/Signup";
import { firebaseLogin, firebaseSignup, firebaseLogout, onAuthStateChange } from "../lib/auth";
import { LogOut } from "lucide-react";
import { db } from "../lib/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, where, limit, getDocs, doc, updateDoc } from "firebase/firestore";
import { User } from "firebase/auth";

// For floating reaction emojis
type FloatingReaction = {
  id: number;
  emoji: string;
  x: number;
  y: number;
  angle: number;
};

interface ChatUser {
  id: string;
  email: string;
  displayName?: string;
}

interface Message {
  id: number;
  sender: string;
  text: string;
  timestamp: string;
  reactions: { [user_id: string]: string };
}

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [recipient, setRecipient] = useState<{ id: string; email: string } | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<
    {
      id?: string;
      sender: string;
      senderId: string;
      text: string;
      timestamp: Date;
      reactions: { [user_id: string]: string };
      isOwn: boolean;
    }[]
  >([]);
  const [onlineUsers, setOnlineUsers] = useState<{ id: string; email: string }[]>([]);
  const [unread, setUnread] = useState<Record<string, number>>({});
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reactionIdRef = useRef(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

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

  // Initialize Firebase auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setCurrentUser(user);
      if (user) {
        // Update online users when user logs in
        updateOnlineUsers();
      } else {
        // Clear online users when user logs out
        setOnlineUsers([]);
      }
    });
    return unsubscribe;
  }, []);

  // Function to update online users list
  const updateOnlineUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      const users: { id: string; email: string }[] = [];

      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        // For now, show all users (in a real app, you'd track online status)
        if (doc.id !== currentUser?.uid) {
          users.push({
            id: doc.id,
            email: userData.username || userData.email, // Show username if available
          });
        }
      });

      setOnlineUsers(users);
    } catch (error) {
      console.error('Error fetching online users:', error);
    }
  };

  // Update online users when current user changes
  useEffect(() => {
    if (currentUser) {
      updateOnlineUsers();
    }
  }, [currentUser]);

  // Real-time listener for users collection
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const users: { id: string; email: string }[] = [];
      snapshot.forEach((doc) => {
        const userData = doc.data();
        if (doc.id !== currentUser.uid) {
          users.push({
            id: doc.id,
            email: userData.username || userData.email,
          });
        }
      });
      setOnlineUsers(users);
    });

    return unsubscribe;
  }, [currentUser]);

  const handleSignup = async (email: string, username: string, password: string) => {
    try {
      // Check if username is already taken
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        alert("Username already taken!");
        return;
      }

      await firebaseSignup(email, password, username);
      alert("Signup successful! Please log in.");
      setShowSignup(false);
    } catch (err) {
      console.error("Signup error:", err);
      alert("Signup failed! Please check the console for details.");
    }
  };

  const handleLogin = async (username: string, password: string) => {
    try {
      // For Firebase, we need to find the user by username first
      // This is a limitation - Firebase Auth requires email for login
      // We'll need to store a mapping or use a different approach

      // For now, let's assume users login with email but we can change the UI
      // Actually, let's implement a proper username-based login

      // We'll need to query Firestore to find the email associated with the username
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert("Username not found!");
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      const email = userData.email;

      await firebaseLogin(email, password);
    } catch (err) {
      console.error("Login failed:", err);
      alert("Login failed!");
    }
  };

  const handleLogout = async () => {
    try {
      await firebaseLogout();
      alert("Logged out successfully!");
    } catch (err) {
      console.error("Logout error:", err);
      alert("Logout failed!");
    }
  };

  // Handle typing (simplified for Firebase)
  const handleTyping = useCallback(() => {
    if (!recipient || !currentUser) return;

    if (!isTyping) {
      setIsTyping(true);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  }, [recipient, currentUser, isTyping]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  // Load more messages for infinite scroll (simplified for Firebase)
  const loadMoreMessages = useCallback(async () => {
    console.log("Loading more messages...");
    if (!recipient || !currentUser || isLoadingMore || !hasMoreMessages) return;

    setIsLoadingMore(true);
    // For Firebase, we'll implement pagination later
    setIsLoadingMore(false);
  }, [recipient, currentUser, isLoadingMore, hasMoreMessages]);

  // Send message using Firestore
  const sendMessage = useCallback(async () => {
    if (!currentUser || !recipient || !message.trim()) return;

    const newMessage = {
      sender: currentUser.displayName || currentUser.email!.split('@')[0],
      senderId: currentUser.uid,
      text: message,
      timestamp: new Date(),
      reactions: {},
      isOwn: true,
    };
    setMessages((prev) => [...prev, newMessage]);
    setMessage("");

    try {
      await addDoc(collection(db, 'messages'), {
        senderId: currentUser.uid,
        recipientId: recipient.id,
        text: message,
        timestamp: new Date(),
        reactions: {},
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [currentUser, recipient, message]);

  // Fetch messages from Firestore
  const fetchMessages = async (senderId: string, recipientId: string, limit?: number) => {
    try {
      const q = query(
        collection(db, 'messages'),
        where('senderId', 'in', [senderId, recipientId]),
        where('recipientId', 'in', [senderId, recipientId]),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const messages: any[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          sender: data.senderId === senderId ? currentUser?.email : data.recipientId === senderId ? data.senderId : 'Unknown',
          text: data.text,
          timestamp: data.timestamp.toDate(),
          reactions: data.reactions || {},
        });
      });
      return messages.reverse();
    } catch (err) {
      console.error("Error fetching messages:", err);
      return [];
    }
  };

  useEffect(() => {
    if (recipient && currentUser) {
      setUnread((prev) => {
        const updated = { ...prev };
        delete updated[recipient.email];
        return updated;
      });
      const loadInitial = async () => {
        setIsInitialLoad(true);
        const initialMessages = await fetchMessages(currentUser.uid, recipient.id, 20);
        setMessages(initialMessages);
        setHasMoreMessages(initialMessages.length === 20);
        setTimeout(() => setIsInitialLoad(false), 0);
      };
      loadInitial();
    }
  }, [recipient, currentUser]);

  // Real-time listener for messages
  useEffect(() => {
    if (!recipient || !currentUser) return;

    // Listen to all messages and filter client-side
    const unsubscribe = onSnapshot(collection(db, 'messages'), (snapshot) => {
      const conversationMessages: any[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        // Filter messages for this conversation
        if (
          (data.senderId === currentUser.uid && data.recipientId === recipient.id) ||
          (data.senderId === recipient.id && data.recipientId === currentUser.uid)
        ) {
          conversationMessages.push({
            id: doc.id,
            sender: data.senderId === currentUser.uid ? currentUser.displayName || currentUser.email!.split('@')[0] : recipient.email.split('@')[0],
            senderId: data.senderId,
            text: data.text,
            timestamp: data.timestamp.toDate(),
            reactions: data.reactions || {},
            isOwn: data.senderId === currentUser.uid,
          });
        }
      });

      // Sort by timestamp (oldest first)
      conversationMessages.sort((a, b) => a.timestamp - b.timestamp);
      setMessages(conversationMessages);
    });

    return unsubscribe;
  }, [recipient, currentUser]);

  // Send reaction + trigger local floating effect
  const sendReaction = useCallback(async (messageId: string, reaction: string) => {
    if (!currentUser) return;

    const msg = messages.find(m => m.id === messageId);
    if (!msg) return;

    const currentReaction = msg.reactions[currentUser.uid];
    const newReaction = currentReaction === reaction ? '' : reaction;

    setIsReacting(true);

    // Optimistic UI update
    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        const updatedReactions = { ...m.reactions };
        if (newReaction) {
          updatedReactions[currentUser.uid] = newReaction;
        } else {
          delete updatedReactions[currentUser.uid];
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

    // Update reaction in Firestore
    try {
      const messageRef = doc(db, 'messages', messageId);
      const updatedReactions = { ...msg.reactions };
      if (newReaction) {
        updatedReactions[currentUser.uid] = newReaction;
      } else {
        delete updatedReactions[currentUser.uid];
      }

      await updateDoc(messageRef, {
        reactions: updatedReactions
      });
    } catch (error) {
      console.error('Error updating reaction:', error);
      // Revert optimistic update on error
      setMessages(prev => prev.map(m => {
        if (m.id === messageId) {
          const revertedReactions = { ...m.reactions };
          if (currentReaction) {
            revertedReactions[currentUser.uid] = currentReaction;
          } else {
            delete revertedReactions[currentUser.uid];
          }
          return { ...m, reactions: revertedReactions };
        }
        return m;
      }));
    }
  }, [currentUser, messages]);

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
        {!currentUser ? (
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
            username={currentUser.email!}
            userId={currentUser.uid}
            socket={null}
            hasMoreMessages={hasMoreMessages}
            loadMoreMessages={loadMoreMessages}
            isLoadingMore={isLoadingMore}
            onLogout={handleLogout}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;