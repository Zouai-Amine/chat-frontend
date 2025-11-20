import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { Message, FloatingReaction } from '../../types';

interface ChatAreaProps {
  recipient: { id: number; username: string } | null;
  messages: Message[];
  username: string;
  loadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  sendMessage: (text: string) => void;
  handleTyping: (isTyping: boolean) => void;
  showSearch: boolean;
  setShowSearch: (show: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  typingUsers: string[];
  floatingReactions: FloatingReaction[];
  showReactionPicker: number | null;
  setShowReactionPicker: (id: number | null) => void;
  onReactionSelect: (id: number, emoji: string) => void;
  getUsernameFromId: (id: number) => string;
}

const ChatArea = ({
  recipient,
  messages,
  username,
  loadingMore,
  hasMore,
  loadMore,
  sendMessage,
  handleTyping,
  showSearch,
  setShowSearch,
  searchQuery,
  setSearchQuery,
  darkMode,
  toggleDarkMode,
  toggleSidebar,
  typingUsers,
  floatingReactions,
  showReactionPicker,
  setShowReactionPicker,
  onReactionSelect,
  getUsernameFromId
}: ChatAreaProps) => {
  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-background/50">
      {/* Floating Reactions Layer */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        <AnimatePresence>
          {floatingReactions.map((fr) => (
            <motion.div
              key={fr.id}
              initial={{ opacity: 0, scale: 0, x: fr.x, y: fr.y }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.5, 1.5, 1],
                y: fr.y - 200,
                x: fr.x + (Math.random() * 100 - 50)
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="absolute text-4xl"
            >
              {fr.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <ChatHeader
        recipient={recipient}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        toggleSidebar={toggleSidebar}
      />

      {recipient ? (
        <>
          <MessageList
            messages={messages}
            username={username}
            loadMoreMessages={loadMore}
            hasMoreMessages={hasMore}
            isLoadingMore={loadingMore}
            showReactionPicker={showReactionPicker}
            setShowReactionPicker={setShowReactionPicker}
            onReactionSelect={onReactionSelect}
            getUsernameFromId={getUsernameFromId}
          />
          
          {/* Typing Indicator */}
          {typingUsers.includes(recipient.username) && (
            <div className="px-4 py-2 text-xs text-muted-foreground italic animate-pulse">
              {recipient.username} is typing...
            </div>
          )}

          <MessageInput
            onSendMessage={sendMessage}
            onTyping={handleTyping}
          />
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
          <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl">👋</span>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to Chat App</h2>
          <p className="max-w-md">Select a user from the sidebar to start chatting. You can send messages, reactions, and see who's online in real-time.</p>
        </div>
      )}
    </div>
  );
};

export default ChatArea;
