import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Smile } from 'lucide-react';
import { Message } from '../../types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showReactionPicker: boolean;
  onReactionClick: (id: number) => void;
  onReactionSelect: (id: number, emoji: string) => void;
  getUsernameFromId: (id: number) => string;
}

const MessageBubble = ({
  message,
  isOwn,
  showReactionPicker,
  onReactionClick,
  onReactionSelect,
  getUsernameFromId
}: MessageBubbleProps) => {
  return (
    <motion.div
      layout
      initial={{ scale: 0.9, opacity: 0, y: 10 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      className="relative group w-full mb-2"
      data-message-id={message.id}
    >
      <div className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
        {!isOwn && (
           <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
             {message.sender[0].toUpperCase()}
           </div>
        )}
        
        <div className={`relative max-w-[80%] md:max-w-[65%] group-hover:z-10`}>
          <div
            className={`px-5 py-3 shadow-sm backdrop-blur-sm transition-all duration-300 ${
              isOwn
                ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-2xl rounded-br-none shadow-primary/20'
                : 'bg-white/80 dark:bg-slate-800/80 text-foreground rounded-2xl rounded-bl-none border border-border/50 shadow-sm'
            }`}
          >
            <p className="text-sm md:text-[15px] leading-relaxed whitespace-pre-wrap">{message.text}</p>
            <span className={`text-[10px] mt-1 block text-right ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Reaction Picker Trigger - Only for received messages */}
          {!isOwn && (
            <div className={`absolute top-0 -right-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center h-full`}>
              <button
                onClick={() => onReactionClick(message.id!)}
                className="p-1.5 rounded-full bg-background/80 hover:bg-background text-muted-foreground hover:text-primary shadow-sm border border-border/50 transition-all transform hover:scale-110"
              >
                <Smile className="w-4 h-4" />
              </button>
              
              {/* Reaction Picker */}
              {showReactionPicker && (
                <div className="absolute bottom-full mb-2 left-0 bg-popover/95 backdrop-blur-xl text-popover-foreground rounded-2xl shadow-xl p-2 flex gap-1 border border-border/50 z-50 animate-in zoom-in-95 duration-200 origin-bottom">
                  {['❤️', '👍', '😂', '😮', '😢', '🔥', '🎉', '👀'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => onReactionSelect(message.id!, emoji)}
                      className="text-xl p-2 rounded-xl hover:bg-muted/50 hover:scale-125 transition-all duration-200"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reactions Display */}
          {message.reactions && Object.keys(message.reactions).length > 0 && (
            <div className={`absolute -bottom-3 ${isOwn ? 'right-0' : 'left-0'} flex flex-wrap gap-1`}>
              {Object.entries(message.reactions).map(([userIdStr, reaction]) => (
                <div
                  key={userIdStr}
                  className="text-xs bg-background/90 backdrop-blur-md text-foreground rounded-full px-1.5 py-0.5 border border-border/50 shadow-sm transform hover:scale-110 transition-transform cursor-help"
                  title={getUsernameFromId(parseInt(userIdStr))}
                >
                  {reaction}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default memo(MessageBubble);
