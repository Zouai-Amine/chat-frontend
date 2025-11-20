import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users } from 'lucide-react';

interface SidebarProps {
  onlineUsers: { id: number; username: string }[];
  recipient: { id: number; username: string } | null;
  setRecipient: (recipient: { id: number; username: string } | null) => void;
  unread: Record<string, number>;
  isOpen: boolean;
  currentUser: string;
  onLogout: () => void;
}

const Sidebar = ({ onlineUsers, recipient, setRecipient, unread, isOpen, currentUser, onLogout }: SidebarProps) => {
  return (
    <motion.div
      initial={false}
      animate={{
        width: isOpen ? 320 : 0,
        opacity: isOpen ? 1 : 0
      }}
      className="h-full bg-card/95 backdrop-blur-xl border-r border-border overflow-hidden flex flex-col md:relative absolute z-20 shadow-2xl md:shadow-none"
    >
      <div className="p-4 border-b border-border/50 flex items-center gap-2 bg-secondary/20">
        <div className="p-2 bg-primary/10 rounded-xl">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-bold text-lg">Messages</h2>
          <p className="text-xs text-muted-foreground">{onlineUsers.length} online</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        <AnimatePresence>
          {onlineUsers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2"
            >
              <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center">
                <Users className="w-6 h-6 opacity-50" />
              </div>
              <p className="text-sm">No users online</p>
            </motion.div>
          ) : (
            onlineUsers.map((user) => (
              <motion.button
                key={user.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setRecipient(user)}
                className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all duration-200 group ${
                  recipient?.id === user.id
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                    : 'hover:bg-secondary/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-transform group-hover:scale-105 ${
                      recipient?.id === user.id 
                        ? 'bg-white/20 text-white' 
                        : 'bg-gradient-to-br from-blue-400 to-cyan-500 text-white'
                    }`}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-card rounded-full ring-1 ring-background" />
                  </div>
                  <div className="text-left">
                    <p className={`font-medium text-sm ${recipient?.id === user.id ? 'text-primary-foreground' : 'text-foreground'}`}>
                      {user.username}
                    </p>
                    <p className={`text-xs truncate max-w-[120px] ${recipient?.id === user.id ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                      Click to chat
                    </p>
                  </div>
                </div>

                {unread[user.username] && (
                  <div className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full animate-pulse shadow-sm">
                    {unread[user.username]}
                  </div>
                )}
              </motion.button>
            ))
          )}
        </AnimatePresence>
      </div>
      
      <div className="p-4 border-t border-border/50 bg-secondary/10">
        <div className="flex items-center justify-between bg-secondary/50 p-3 rounded-2xl border border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
              {currentUser.charAt(0).toUpperCase()}
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">{currentUser}</p>
              <p className="text-[10px] text-green-500 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/> Online
              </p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="text-xs bg-background hover:bg-destructive hover:text-destructive-foreground text-muted-foreground px-3 py-1.5 rounded-xl transition-all duration-200 border border-border/50 shadow-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;
