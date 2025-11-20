import { useState, useCallback, useRef, useEffect } from 'react';
import { Message, User, FloatingReaction } from '../types';

interface UseChatProps {
    backendUrl: string;
    userId: number | null;
    username: string;
}

export function useChat({ backendUrl, userId, username }: UseChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [recipient, setRecipient] = useState<{ id: number; username: string } | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<{ id: number; username: string }[]>([]);
    const [unread, setUnread] = useState<Record<string, number>>({});
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const reactionIdRef = useRef(0);

    const fetchMessages = async (senderId: number, recipientId: number, limit?: number, offset?: number) => {
        try {
            let url = `${backendUrl}/messages/${senderId}/${recipientId}`;
            if (limit !== undefined && offset !== undefined) {
                url += `?limit=${limit}&offset=${offset}`;
            }
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                return data.map((msg: {
                    id: number;
                    sender: string;
                    text: string;
                    timestamp: string;
                    reactions: { [key: number]: string };
                }) => ({
                    id: msg.id,
                    sender: msg.sender,
                    text: msg.text,
                    timestamp: new Date(msg.timestamp),
                    reactions: msg.reactions || {},
                }));
            }
        } catch (err) {
            console.error("Error fetching messages:", err);
        }
        return [];
    };

    const loadInitialMessages = useCallback(async () => {
        if (!recipient || !userId) return;
        const initialMessages = await fetchMessages(userId, recipient.id, 20, 0);
        setMessages(initialMessages.reverse());
        setHasMoreMessages(initialMessages.length === 20);

        // Clear unread for this recipient
        setUnread(prev => {
            const updated = { ...prev };
            delete updated[recipient.username];
            return updated;
        });
    }, [recipient, userId, backendUrl]);

    const loadMoreMessages = useCallback(async () => {
        if (!recipient || !userId || isLoadingMore || !hasMoreMessages) return;

        setIsLoadingMore(true);
        const olderMessages = await fetchMessages(userId, recipient.id, 20, messages.length);

        if (olderMessages.length < 20) {
            setHasMoreMessages(false);
        }

        setMessages(prev => [...olderMessages, ...prev]);
        setIsLoadingMore(false);
    }, [recipient, userId, isLoadingMore, hasMoreMessages, messages.length, backendUrl]);

    const addMessage = useCallback((msg: Message) => {
        setMessages(prev => [...prev, msg]);
    }, []);

    const updateMessageReaction = useCallback((messageId: number, userId: number, reaction: string) => {
        setMessages(prev => prev.map(msg => {
            if (msg.id === messageId) {
                const newReactions = { ...msg.reactions };
                if (reaction) {
                    newReactions[userId] = reaction;
                } else {
                    delete newReactions[userId];
                }
                return { ...msg, reactions: newReactions };
            }
            return msg;
        }));
    }, []);

    const addFloatingReaction = useCallback((reaction: string, x: number, y: number) => {
        const newReactions: FloatingReaction[] = [];
        for (let i = 0; i < 3; i++) {
            const angle = Math.random() * 360;
            newReactions.push({
                id: reactionIdRef.current++,
                emoji: reaction,
                x,
                y,
                angle
            });
        }
        setFloatingReactions(prev => [...prev, ...newReactions]);
    }, []);

    // Auto-remove floating reactions
    useEffect(() => {
        if (floatingReactions.length === 0) return;
        const timer = setTimeout(() => {
            setFloatingReactions(prev => prev.slice(1));
        }, 2000);
        return () => clearTimeout(timer);
    }, [floatingReactions]);

    return {
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
    };
}
