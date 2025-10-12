'use client';

import React, { useMemo, memo, useEffect, Dispatch, SetStateAction } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send,
    Users,
    MessageCircle,
    Search,
    Smile,
    Moon,
    Sun,
    Settings,
    Paperclip,
    Image,
} from 'lucide-react';

type FloatingReaction = {
    id: number;
    emoji: string;
    x: number;
    y: number;
    angle: number;
};

interface Message {
    id?: number;
    sender: string;
    text: string;
    timestamp: Date;
    reactions: { [user_id: number]: string };
}

interface ChatProps {
    recipient: { id: number; username: string } | null;
    setRecipient: (recipient: { id: number; username: string } | null) => void;
    message: string;
    setMessage: (message: string) => void;
    messages: Message[];
    setMessages: Dispatch<SetStateAction<Message[]>>;
    onlineUsers: { id: number; username: string }[];
    unread: Record<string, number>;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    showSearch: boolean;
    setShowSearch: (show: boolean) => void;
    darkMode: boolean;
    setDarkMode: (dark: boolean) => void;
    typingUsers: string[];
    isTyping: boolean;
    floatingReactions: FloatingReaction[];
    showReactionPicker: number | null;
    setShowReactionPicker: (id: number | null) => void;
    scrollRef: React.RefObject<HTMLDivElement | null>;
    sendMessage: () => void;
    sendReaction: (messageId: number, reaction: string) => void;
    handleTyping: () => void;
    username: string;
    userId: number | null;
    socket: WebSocket | null;
    hasMoreMessages: boolean;
    loadMoreMessages: () => void;
    isLoadingMore: boolean;
}

function Chat({
    recipient,
    setRecipient,
    message,
    setMessage,
    messages,
    setMessages,
    onlineUsers,
    unread,
    searchQuery,
    setSearchQuery,
    showSearch,
    setShowSearch,
    darkMode,
    setDarkMode,
    typingUsers,
    showReactionPicker,
    setShowReactionPicker,
    scrollRef,
    sendMessage,
    sendReaction,
    handleTyping,
    username,
    userId,
    socket,
    hasMoreMessages,
    loadMoreMessages,
    isLoadingMore,
}: ChatProps) {
    // Group messages (same as your original logic)
    const groupedMessages = useMemo(() => {
        const groups: Array<{
            sender: string;
            messages: {
                id?: number;
                text: string;
                timestamp: Date;
                reactions: { [user_id: number]: string };
            }[];
            isOwn: boolean;
        }> = [];

        messages.forEach((msg, index) => {
            const isOwn = msg.sender === username;
            const prevMsg = messages[index - 1];
            const shouldGroup =
                prevMsg &&
                prevMsg.sender === msg.sender &&
                msg.timestamp.getTime() - prevMsg.timestamp.getTime() < 300000;

            if (!shouldGroup) {
                groups.push({
                    sender: msg.sender,
                    messages: [
                        {
                            id: msg.id,
                            text: msg.text,
                            timestamp: msg.timestamp,
                            reactions: msg.reactions || {},
                        },
                    ],
                    isOwn,
                });
            } else {
                groups[groups.length - 1].messages.push({
                    id: msg.id,
                    text: msg.text,
                    timestamp: msg.timestamp,
                    reactions: msg.reactions || {},
                });
            }
        });

        return groups;
    }, [messages, username]);

    // Filter messages by search query
    const filteredMessages = useMemo(() => {
        if (!searchQuery) return groupedMessages;
        return groupedMessages
            .map((group) => ({
                ...group,
                messages: group.messages.filter((msg) =>
                    msg.text.toLowerCase().includes(searchQuery.toLowerCase())
                ),
            }))
            .filter((group) => group.messages.length > 0);
    }, [groupedMessages, searchQuery]);

    const getUsernameFromId = (userIdNum: number) => {
        if (userIdNum === userId) return username;
        const user = onlineUsers.find((u) => u.id === userIdNum);
        return user ? user.username : `User ${userIdNum}`;
    };

    // Listen for WebSocket “new_reaction” (and optionally “new_message”) events
    useEffect(() => {
        if (!socket) return;

        const handler = (event: MessageEvent) => {
            let data: Record<string, unknown>;
            try {
                data = JSON.parse(event.data) as Record<string, unknown>;
            } catch {
                // Not JSON or irrelevant message
                return;
            }

            if (data.type === 'new_reaction' && typeof data.message_id === 'number' && typeof data.user_id === 'number' && typeof data.reaction === 'string') {
                const { message_id, user_id, reaction } = data;
                setMessages((prev) =>
                    prev.map((msg) => {
                        if (msg.id === message_id) {
                            return {
                                ...msg,
                                reactions: {
                                    ...msg.reactions,
                                    [user_id]: reaction,
                                },
                            };
                        }
                        return msg;
                    })
                );
            }

            // Optionally, if your server sends new messages:
            if (data.type === 'new_message' && typeof data.id === 'number' && typeof data.sender === 'string' && typeof data.text === 'string' && typeof data.timestamp === 'string') {
                const { id, sender, text, timestamp, reactions } = data;
                const newMsg: Message = {
                    id,
                    sender,
                    text,
                    timestamp: new Date(timestamp),
                    reactions: (reactions as Record<number, string>) || {},
                };
                setMessages((prev) => [...prev, newMsg]);
            }
        };

        socket.addEventListener('message', handler);

        return () => {
            socket.removeEventListener('message', handler);
        };
    }, [socket, setMessages]);

    // Handler that wraps sendReaction and also does optimistic update
    const handleReaction = (messageId: number, emoji: string) => {
        // Optimistically update UI
        if (userId != null) {
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === messageId
                        ? {
                            ...msg,
                            reactions: {
                                ...msg.reactions,
                                [userId]: emoji,
                            },
                        }
                        : msg
                )
            );
        }

        // Send to server
        sendReaction(messageId, emoji);
    };

    return (
        <>
            {/* Sidebar */}
            <motion.div
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 30 }}
                className="w-full md:w-72 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border-r border-white/20 dark:border-slate-600/50 flex flex-col md:h-full h-40 shadow-2xl ring-1 ring-white/10 dark:ring-slate-700/50"
            >
                <div className="p-4 border-b border-white/20 dark:border-slate-600/50 flex items-center gap-3">
                    <Users className="w-5 h-5 text-cyan-400 animate-pulse" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                        Online Users
                    </h3>
                </div>

                <div className="flex-1 overflow-y-auto p-3">
                    <AnimatePresence>
                        {onlineUsers.length === 0 ? (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-slate-500 dark:text-slate-400 text-center py-8"
                            >
                                No users online
                            </motion.p>
                        ) : (
                            onlineUsers.map((u, index) => (
                                <motion.li
                                    key={u.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => setRecipient(u)}
                                    className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer mb-2 transition-all duration-300 hover:scale-105 hover:shadow-lg ${recipient?.id === u.id
                                        ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 dark:from-cyan-400/20 dark:to-blue-400/20 border border-cyan-400/50 dark:border-cyan-400/50 ring-2 ring-cyan-400/20'
                                        : 'hover:bg-white/50 dark:hover:bg-slate-700/50 backdrop-blur-sm'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg ring-2 ring-white/50 dark:ring-slate-700/50">
                                                {u.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 border-3 border-white dark:border-slate-800 rounded-full animate-pulse shadow-md"></div>
                                        </div>
                                        <span
                                            className={`font-semibold text-base ${recipient?.id === u.id
                                                ? 'text-cyan-400'
                                                : 'text-slate-700 dark:text-slate-300'
                                                }`}
                                        >
                                            {u.username}
                                        </span>
                                    </div>

                                    {unread[u.username] && (
                                        <motion.div
                                            initial={{ scale: 0, rotate: -180 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                            className="relative flex items-center justify-center"
                                        >
                                            <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-bold rounded-full px-3 py-1 shadow-lg ring-2 ring-pink-400/50 animate-pulse">
                                                {unread[u.username]}
                                            </div>
                                            <span className="absolute inset-0 rounded-full bg-pink-500 opacity-30 animate-ping"></span>
                                        </motion.div>
                                    )}
                                </motion.li>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col min-h-0">
                {/* Header */}
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 30 }}
                    className="p-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-b border-white/20 dark:border-slate-600/50 shadow-lg"
                >
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold flex items-center gap-3 text-slate-900 dark:text-white">
                            <MessageCircle className="w-6 h-6 text-cyan-400 animate-pulse" />
                            Chatting with:{' '}
                            <span
                                className={`font-semibold ${recipient
                                    ? 'text-cyan-400 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent'
                                    : 'text-slate-500 dark:text-slate-400'
                                    }`}
                            >
                                {recipient ? recipient.username : 'Select a user'}
                            </span>
                        </h3>
                        <div className="flex items-center gap-3">
                            <motion.button
                                whileHover={{ scale: 1.1, boxShadow: '0 0 20px rgba(34, 211, 238, 0.3)' }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setShowSearch(!showSearch)}
                                className="p-3 rounded-xl hover:bg-cyan-100/50 dark:hover:bg-cyan-900/30 transition-all duration-300 ring-1 ring-white/20 hover:ring-cyan-400/50"
                            >
                                <Search className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: darkMode ? 180 : 0 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setDarkMode(!darkMode)}
                                className="p-3 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-all duration-300 ring-1 ring-white/20 hover:ring-slate-400/50"
                            >
                                {darkMode ? (
                                    <Sun className="w-5 h-5 text-yellow-400" />
                                ) : (
                                    <Moon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                )}
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.1, boxShadow: '0 0 20px rgba(168, 85, 247, 0.3)' }}
                                whileTap={{ scale: 0.9 }}
                                className="p-3 rounded-xl hover:bg-purple-100/50 dark:hover:bg-purple-900/30 transition-all duration-300 ring-1 ring-white/20 hover:ring-purple-400/50"
                            >
                                <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            </motion.button>
                        </div>
                    </div>
                    <AnimatePresence>
                        {showSearch && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-4"
                            >
                                <input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search messages..."
                                    className="w-full px-6 py-3 bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm border border-white/30 dark:border-slate-600/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 shadow-lg transition-all duration-300 hover:shadow-xl"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Messages */}
                <div
                    className="flex-1 overflow-y-auto bg-gradient-to-b from-white/30 to-cyan-50/30 dark:from-slate-900/30 dark:to-purple-900/30 relative backdrop-blur-sm p-4 space-y-4"
                    id="scrollableDiv"
                >
                    {hasMoreMessages && (
                        <motion.button
                            onClick={loadMoreMessages}
                            disabled={isLoadingMore}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoadingMore ? 'Loading older messages...' : 'Load older messages'}
                        </motion.button>
                    )}
                    <AnimatePresence>
                        {filteredMessages.map((group, groupIdx) => (
                            <motion.div
                                key={`group-${groupIdx}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: groupIdx * 0.05 }}
                                className={`flex ${group.isOwn ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[75%] space-y-2 flex flex-col ${group.isOwn ? 'items-end' : 'items-start'
                                        }`}
                                >
                                    <div
                                        className={`flex items-center gap-2 ${group.isOwn ? 'flex-row-reverse' : 'flex-row'
                                            }`}
                                    >
                                        <div
                                            className={`w-8 h-8 bg-gradient-to-br ${group.isOwn
                                                ? 'from-pink-400 via-rose-500 to-red-500'
                                                : 'from-cyan-400 via-blue-500 to-purple-500'
                                                } rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg ring-2 ring-white/50 dark:ring-slate-700/50`}
                                        >
                                            {group.sender.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            {group.sender}
                                        </span>
                                    </div>

                                    {group.messages.map((msg, msgIdx) => (
                                        <motion.div
                                            key={`msg-${groupIdx}-${msgIdx}`}
                                            data-message-id={msg.id}
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{
                                                delay: groupIdx * 0.05 + msgIdx * 0.05,
                                            }}
                                            className="relative group w-full"
                                        >
                                            <div className={`flex items-start gap-2 ${group.isOwn ? 'justify-end' : 'justify-start'}`}>
                                                <div
                                                    className={`px-4 py-3 rounded-3xl shadow-lg max-w-full break-words transition-all duration-300 hover:shadow-xl ring-1 ${group.isOwn
                                                        ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white rounded-br-lg ring-cyan-400/30'
                                                        : 'bg-white/90 dark:bg-slate-700/90 text-slate-900 dark:text-slate-100 rounded-bl-lg ring-white/20 dark:ring-slate-600/30 backdrop-blur-sm'
                                                        }`}
                                                    title={msg.timestamp.toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                >
                                                    <p className="text-sm leading-relaxed">{msg.text}</p>
                                                </div>

                                                {/* Reaction Picker */}
                                                {msg.id && !group.isOwn && (
                                                    <div className="relative">
                                                        <AnimatePresence>
                                                            {showReactionPicker === msg.id && (
                                                                <motion.div
                                                                    initial={{ scale: 0.8, opacity: 0, y: 10 }}
                                                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                                                    exit={{ scale: 0.8, opacity: 0, y: 10 }}
                                                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                                    className="absolute bottom-full mb-2 left-0 bg-white/95 dark:bg-slate-800/95 rounded-2xl shadow-2xl p-2 flex gap-2 border border-cyan-200/50 dark:border-cyan-700/50 backdrop-blur-2xl z-10 ring-1 ring-cyan-400/20 dark:ring-cyan-400/30"
                                                                >
                                                                    {['❤️', '👍', '😂', '😮', '😢', '🔥'].map((emoji, idx) => (
                                                                        <motion.button
                                                                            key={emoji}
                                                                            initial={{ scale: 0, rotate: -180 }}
                                                                            animate={{ scale: 1, rotate: 0 }}
                                                                            transition={{ delay: idx * 0.05 }}
                                                                            whileHover={{ scale: 1.3, y: -6, rotate: 10 }}
                                                                            whileTap={{ scale: 0.9 }}
                                                                            onClick={() => {
                                                                                handleReaction(msg.id!, emoji);
                                                                                setShowReactionPicker(null);
                                                                            }}
                                                                            className="text-2xl p-2 rounded-xl hover:bg-gradient-to-br hover:from-cyan-100/80 hover:to-blue-100/80 dark:hover:from-cyan-900/50 dark:hover:to-blue-900/50 transition-all duration-200 backdrop-blur-sm"
                                                                        >
                                                                            {emoji}
                                                                        </motion.button>
                                                                    ))}
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>

                                                        <motion.button
                                                            whileHover={{ scale: 1.1, rotate: 5 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() =>
                                                                setShowReactionPicker(
                                                                    showReactionPicker === msg.id ? null : msg.id!
                                                                )
                                                            }
                                                            className="p-2 rounded-full bg-gradient-to-br from-cyan-100/80 to-blue-100/80 dark:from-cyan-900/40 dark:to-blue-900/40 hover:from-cyan-200/90 hover:to-blue-200/90 dark:hover:from-cyan-800/60 dark:hover:to-blue-800/60 transition-all duration-300 backdrop-blur-sm ring-1 ring-cyan-400/30 hover:ring-cyan-400/60 shadow-md hover:shadow-lg"
                                                        >
                                                            <Smile className="w-4 h-4" />
                                                        </motion.button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* All Reactions */}
                                            {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className={`flex flex-wrap gap-1 mt-1 ${group.isOwn ? 'justify-end' : 'justify-start'
                                                        }`}
                                                >
                                                    {Object.entries(msg.reactions).map(
                                                        ([userIdStr, reaction]) => {
                                                            const userIdNum = parseInt(userIdStr);
                                                            const reactorName = getUsernameFromId(userIdNum);
                                                            return (
                                                                <div
                                                                    key={userIdStr}
                                                                    className="text-base bg-white/80 dark:bg-slate-600/80 rounded-full px-2 py-1 shadow-sm ring-1 ring-white/30 dark:ring-slate-500/30 backdrop-blur-sm hover:scale-110 transition-transform cursor-pointer"
                                                                    title={`${reactorName}`}
                                                                >
                                                                    {reaction}
                                                                </div>
                                                            );
                                                        }
                                                    )}
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Typing indicator */}
                    {typingUsers.filter((u) => u === recipient?.username).length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex justify-start"
                        >
                            <div className="bg-white/90 dark:bg-slate-700/90 px-4 py-3 rounded-2xl rounded-bl-lg transition-all duration-300 backdrop-blur-sm shadow-md ring-1 ring-white/20 dark:ring-slate-600/30">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md ring-1 ring-white/50 dark:ring-slate-700/50">
                                        {typingUsers
                                            .filter((u) => u === recipient?.username)[0]
                                            .charAt(0)
                                            .toUpperCase()}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                            {typingUsers.filter((u) => u === recipient?.username)[0]} is typing
                                        </span>
                                        <div className="flex space-x-1 mt-1">
                                            <div className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-bounce shadow-sm"></div>
                                            <div
                                                className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce shadow-sm"
                                                style={{ animationDelay: '0.1s' }}
                                            ></div>
                                            <div
                                                className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce shadow-sm"
                                                style={{ animationDelay: '0.2s' }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    <div ref={scrollRef} />
                </div>

                {/* Input */}
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 30 }}
                    className="p-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-t border-white/20 dark:border-slate-600/50 shadow-lg"
                >
                    <div className="flex gap-3 items-end">
                        <div className="flex gap-2">
                            <motion.button
                                whileHover={{ scale: 1.1, boxShadow: '0 0 15px rgba(34, 211, 238, 0.3)' }}
                                whileTap={{ scale: 0.9 }}
                                className="p-3 rounded-xl hover:bg-cyan-100/50 dark:hover:bg-cyan-900/30 transition-all duration-300 ring-1 ring-white/20 hover:ring-cyan-400/50"
                                title="Attach file"
                            >
                                <Paperclip className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.1, boxShadow: '0 0 15px rgba(168, 85, 247, 0.3)' }}
                                whileTap={{ scale: 0.9 }}
                                className="p-3 rounded-xl hover:bg-purple-100/50 dark:hover:bg-purple-900/30 transition-all duration-300 ring-1 ring-white/20 hover:ring-purple-400/50"
                                title="Attach image"
                            >
                                <Image className="w-5 h-5 text-slate-600 dark:text-slate-400" aria-hidden="true" />
                            </motion.button>
                        </div>
                        <div className="flex-1 relative">
                            <textarea
                                value={message}
                                onChange={(e) => {
                                    setMessage(e.target.value);
                                    handleTyping();
                                }}
                                placeholder="Type your message..."
                                rows={1}
                                className="w-full px-4 py-3 pr-12 bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm border border-white/30 dark:border-slate-600/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 resize-none min-h-[48px] max-h-28 shadow-lg transition-all duration-300 hover:shadow-xl"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        sendMessage();
                                    }
                                }}
                                onInput={(e) => {
                                    const target = e.target as HTMLTextAreaElement;
                                    target.style.height = 'auto';
                                    target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                                }}
                            />
                            <motion.button
                                whileHover={{ scale: 1.1, boxShadow: '0 0 15px rgba(236, 72, 153, 0.3)' }}
                                whileTap={{ scale: 0.9 }}
                                className="absolute right-3 bottom-3 p-2 rounded-xl hover:bg-pink-100/50 dark:hover:bg-pink-900/30 transition-all duration-300 ring-1 ring-white/20 hover:ring-pink-400/50"
                                title="Add emoji"
                            >
                                <Smile className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            </motion.button>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(34, 211, 238, 0.5)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={sendMessage}
                            disabled={!recipient || !message.trim()}
                            className="bg-gradient-to-r from-cyan-500 via-blue-500 to-pink-500 hover:from-cyan-600 hover:via-blue-600 hover:to-pink-600 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed px-6 py-3 rounded-2xl font-bold text-white shadow-2xl flex items-center gap-2 min-h-[48px] transition-all duration-300 ring-2 ring-white/20 hover:ring-cyan-400/50 disabled:ring-transparent"
                        >
                            <Send className="w-5 h-5" />
                        </motion.button>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>Press Enter to send, Shift+Enter for new line</span>
                        <span>{message.length}/1000</span>
                    </div>
                </motion.div>
            </div>
        </>
    );
}

export default memo(Chat);
