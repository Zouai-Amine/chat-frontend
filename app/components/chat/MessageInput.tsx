import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Image as ImageIcon, Smile } from 'lucide-react';
import { motion } from 'framer-motion';

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  onTyping: (isTyping: boolean) => void;
}

const MessageInput = ({ onSendMessage, onTyping }: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    onTyping(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 1000);
  };

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
      onTyping(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  return (
    <div className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-border/50">
      <div className="max-w-4xl mx-auto relative flex items-end gap-2 bg-secondary/50 dark:bg-secondary/30 p-2 rounded-3xl border border-border/50 shadow-sm focus-within:shadow-md focus-within:border-primary/30 transition-all duration-300">
        <div className="flex gap-1 pb-1 pl-1">
          <button className="p-2 text-muted-foreground hover:text-primary hover:bg-background/50 rounded-full transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>
          <button className="p-2 text-muted-foreground hover:text-primary hover:bg-background/50 rounded-full transition-colors">
            <ImageIcon className="w-5 h-5" />
          </button>
        </div>

        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-[120px] py-3 px-2 text-sm md:text-base placeholder:text-muted-foreground/70 custom-scrollbar outline-none"
          rows={1}
        />

        <div className="flex gap-1 pb-1 pr-1">
          <button className="p-2 text-muted-foreground hover:text-primary hover:bg-background/50 rounded-full transition-colors">
            <Smile className="w-5 h-5" />
          </button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={!message.trim()}
            className="p-2 bg-primary text-primary-foreground rounded-full disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </motion.button>
        </div>
      </div>
      <div className="text-center mt-1">
        <span className="text-[10px] text-muted-foreground/50">
          Press Enter to send, Shift + Enter for new line
        </span>
      </div>
    </div>
  );
};

export default MessageInput;
