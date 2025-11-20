import React, { useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message } from '../../types';
import MessageBubble from './MessageBubble';

interface MessageListProps {
  messages: Message[];
  username: string;
  loadMoreMessages: () => void;
  hasMoreMessages: boolean;
  isLoadingMore: boolean;
  showReactionPicker: number | null;
  setShowReactionPicker: (id: number | null) => void;
  onReactionSelect: (id: number, emoji: string) => void;
  getUsernameFromId: (id: number) => string;
}

const MessageList = ({
  messages,
  username,
  loadMoreMessages,
  hasMoreMessages,
  isLoadingMore,
  showReactionPicker,
  setShowReactionPicker,
  onReactionSelect,
  getUsernameFromId
}: MessageListProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Group messages
  const groupedMessages = useMemo(() => {
    const groups: Array<{
      sender: string;
      messages: Message[];
      isOwn: boolean;
    }> = [];

    messages.forEach((msg, index) => {
      const isOwn = msg.sender === username;
      const prevMsg = messages[index - 1];
      const shouldGroup =
        prevMsg &&
        prevMsg.sender === msg.sender &&
        msg.timestamp.getTime() - prevMsg.timestamp.getTime() < 300000; // 5 mins

      if (!shouldGroup) {
        groups.push({
          sender: msg.sender,
          messages: [msg],
          isOwn,
        });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });

    return groups;
  }, [messages, username]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (!isLoadingMore) {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isLoadingMore]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar" id="scrollableDiv">
      {hasMoreMessages && (
        <div className="flex justify-center py-2">
          <button
            onClick={loadMoreMessages}
            disabled={isLoadingMore}
            className="text-xs bg-secondary/80 hover:bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
          >
            {isLoadingMore ? 'Loading...' : 'Load older messages'}
          </button>
        </div>
      )}

      <AnimatePresence initial={false}>
        {groupedMessages.map((group, groupIdx) => (
          <motion.div
            key={`group-${groupIdx}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col ${group.isOwn ? 'items-end' : 'items-start'}`}
          >
            {!group.isOwn && (
              <span className="text-xs text-muted-foreground ml-3 mb-1 font-medium">
                {group.sender}
              </span>
            )}
            
            <div className="space-y-1 w-full flex flex-col">
              {group.messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={group.isOwn}
                  showReactionPicker={showReactionPicker === msg.id}
                  onReactionClick={setShowReactionPicker}
                  onReactionSelect={(id, emoji) => {
                    onReactionSelect(id, emoji);
                    setShowReactionPicker(null);
                  }}
                  getUsernameFromId={getUsernameFromId}
                />
              ))}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      <div ref={scrollRef} />
    </div>
  );
};

export default MessageList;
