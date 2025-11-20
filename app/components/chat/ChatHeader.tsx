import React from 'react';
import { Search, Moon, Sun, Menu } from 'lucide-react';

interface ChatHeaderProps {
  recipient: { username: string } | null;
  showSearch: boolean;
  setShowSearch: (show: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
}

const ChatHeader = ({
  recipient,
  showSearch,
  setShowSearch,
  searchQuery,
  setSearchQuery,
  darkMode,
  toggleDarkMode,
  toggleSidebar
}: ChatHeaderProps) => {
  return (
    <div className="h-16 border-b border-border bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <button onClick={toggleSidebar} className="md:hidden p-2 hover:bg-secondary rounded-full">
          <Menu className="w-5 h-5" />
        </button>
        
        {recipient ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
              {recipient.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{recipient.username}</h3>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Online
              </span>
            </div>
          </div>
        ) : (
          <h3 className="font-semibold text-muted-foreground">Select a user to chat</h3>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          {showSearch && (
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="absolute right-10 top-1/2 -translate-y-1/2 w-48 md:w-64 bg-secondary text-sm px-3 py-1.5 rounded-full focus:outline-none ring-1 ring-border animate-in slide-in-from-right-10 fade-in duration-200"
            />
          )}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2 rounded-full transition-colors ${showSearch ? 'bg-primary/10 text-primary' : 'hover:bg-secondary text-muted-foreground'}`}
          >
            <Search className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full hover:bg-secondary text-muted-foreground transition-colors"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
