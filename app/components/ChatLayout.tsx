import React, { useState, useEffect, useCallback } from 'react';
import { useChat } from '../hooks/useChat';
import { useWebSocket } from '../hooks/useWebSocket';
import { WebSocketMessage, User } from '../types';
import Sidebar from './chat/Sidebar';
import ChatArea from './chat/ChatArea';

interface ChatLayoutProps {
  username: string;
  userId: number;
  onLogout: () => void;
}

const ChatLayout = ({ username, userId, onLogout }: ChatLayoutProps) => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
  
  const {
    messages,
    setMessages,
    recipient,
    setRecipient,
    onlineUsers,
    setOnlineUsers,
    unread,
    setUnread,
    typingUsers,
    setTypingUsers,
    floatingReactions,
    hasMoreMessages,
    isLoadingMore,
    loadInitialMessages,
    loadMoreMessages,
    addMessage,
    updateMessageReaction,
    addFloatingReaction
  } = useChat({ backendUrl, userId, username });

  const [messageInput, setMessageInput] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showReactionPicker, setShowReactionPicker] = useState<number | null>(null);

  // WebSocket Handler
  const handleWebSocketMessage = useCallback((data: WebSocketMessage) => {
    if (data.type === "users" && data.users) {
      setOnlineUsers(data.users.filter((u: User) => u.id !== userId));
    } else if (data.type === "message" && data.id && data.sender && data.text) {
      const msg = {
        id: data.id,
        sender: data.sender,
        text: data.text,
        timestamp: new Date(data.timestamp || Date.now()),
        reactions: data.reactions || {},
      };
      addMessage(msg);

      if (data.sender !== username && data.sender !== recipient?.username) {
        setUnread((prev) => ({
          ...prev,
          [data.sender!]: (prev[data.sender!] || 0) + 1,
        }));
      }
    } else if (data.type === "typing" && data.sender !== undefined) {
      if (data.is_typing) {
        setTypingUsers((prev) => [...new Set([...prev, data.sender!])]);
      } else {
        setTypingUsers((prev) => prev.filter((u) => u !== data.sender));
      }
    } else if (data.type === "reaction" && data.message_id !== undefined && data.user_id !== undefined) {
      // Normalize reaction
      let normalizedReaction = '';
      if (Array.isArray(data.reaction)) normalizedReaction = data.reaction[0] || '';
      else if (typeof data.reaction === 'object' && data.reaction !== null) normalizedReaction = data.reaction.reaction || '';
      else if (typeof data.reaction === 'string') normalizedReaction = data.reaction;

      updateMessageReaction(data.message_id, data.user_id, normalizedReaction);
      
      if (normalizedReaction) {
        triggerFloatingReaction(data.message_id, normalizedReaction);
      }
    }
  }, [userId, username, recipient, addMessage, setOnlineUsers, setUnread, setTypingUsers, updateMessageReaction]);

  const { socket, sendMessage: sendWsMessage } = useWebSocket({
    url: backendUrl,
    userId,
    onMessage: handleWebSocketMessage
  });

  // Helper to trigger floating reaction from message element
  const triggerFloatingReaction = (messageId: number, emoji: string) => {
    // Use a timeout to ensure DOM might be updated if it's a new message (though usually it's existing)
    setTimeout(() => {
      const msgElement = document.querySelector(`[data-message-id="${messageId}"]`);
      if (msgElement) {
        const rect = msgElement.getBoundingClientRect();
        // Calculate center of the message bubble
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        addFloatingReaction(emoji, x, y);
      } else {
        // Fallback to center if element not found
        addFloatingReaction(emoji, window.innerWidth / 2, window.innerHeight / 2);
      }
    }, 0);
  };

  // Initial Load
  useEffect(() => {
    if (recipient) {
      loadInitialMessages();
      // Mobile: close sidebar on selection
      if (window.innerWidth < 768) setIsSidebarOpen(false);
    }
  }, [recipient, loadInitialMessages]);

  // Dark Mode
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) setDarkMode(savedTheme === 'dark');
    else setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Actions
  const handleSendMessage = (text: string) => {
    if (!socket || !recipient || !text.trim()) return;

    const newMessage = {
      sender: username,
      text: text,
      timestamp: new Date(),
      reactions: {},
    };
    
    // Optimistic update removed to ensure message has ID from server
    // This prevents reaction issues where sender doesn't have the message ID

    sendWsMessage({
      type: "message",
      sender_id: userId,
      recipient_id: recipient.id,
      text: text,
    });
  };

  const handleTyping = useCallback((isTyping: boolean) => {
    if (!socket || !recipient) return;
    
    sendWsMessage({
      type: "typing",
      sender_id: userId,
      recipient_id: recipient.id,
      is_typing: isTyping,
    });
  }, [socket, recipient, userId, sendWsMessage]);

  const handleReactionSelect = (messageId: number, emoji: string) => {
    if (!socket) return;
    
    // Optimistic
    updateMessageReaction(messageId, userId, emoji);
    
    // Add floating reaction
    triggerFloatingReaction(messageId, emoji);

    sendWsMessage({
      type: "reaction",
      message_id: messageId,
      user_id: userId,
      reaction: emoji,
    });
  };

  const getUsernameFromId = (id: number) => {
    if (id === userId) return username;
    const user = onlineUsers.find(u => u.id === id);
    return user ? user.username : `User ${id}`;
  };

  // Filter messages
  const filteredMessages = messages.filter(msg => 
    msg.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
      <Sidebar
        onlineUsers={onlineUsers}
        recipient={recipient}
        setRecipient={setRecipient}
        unread={unread}
        isOpen={isSidebarOpen}
        currentUser={username}
        onLogout={onLogout}
      />
      
      <ChatArea
        recipient={recipient}
        messages={filteredMessages}
        username={username}
        loadingMore={isLoadingMore}
        hasMore={hasMoreMessages}
        loadMore={loadMoreMessages}
        sendMessage={handleSendMessage}
        handleTyping={handleTyping}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        darkMode={darkMode}
        toggleDarkMode={() => setDarkMode(!darkMode)}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        typingUsers={typingUsers}
        floatingReactions={floatingReactions}
        showReactionPicker={showReactionPicker}
        setShowReactionPicker={setShowReactionPicker}
        onReactionSelect={handleReactionSelect}
        getUsernameFromId={getUsernameFromId}
      />
    </div>
  );
};

export default ChatLayout;
