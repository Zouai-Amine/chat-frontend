import { useState, useEffect, useRef, useCallback } from 'react';
import { WebSocketMessage } from '../types';

interface UseWebSocketProps {
    url: string;
    userId: number | null;
    onMessage: (data: WebSocketMessage) => void;
}

export function useWebSocket({ url, userId, onMessage }: UseWebSocketProps) {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const onMessageRef = useRef(onMessage);

    // Update ref when onMessage changes
    useEffect(() => {
        onMessageRef.current = onMessage;
    }, [onMessage]);

    const connect = useCallback(() => {
        if (!userId) return;

        const wsUrl = url.replace(/^http/, 'ws');
        const ws = new WebSocket(`${wsUrl}/ws/${userId}`);

        ws.onopen = () => {
            console.log("WebSocket connected");
            setIsConnected(true);
        };

        ws.onclose = () => {
            console.log("WebSocket disconnected");
            setIsConnected(false);
            setSocket(null);
            // Reconnect after 2 seconds
            reconnectTimeoutRef.current = setTimeout(() => connect(), 2000);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (onMessageRef.current) {
                    onMessageRef.current(data);
                }
            } catch (err) {
                console.error("Error parsing WebSocket message:", err);
            }
        };

        setSocket(ws);
    }, [url, userId]); // Removed onMessage from dependencies

    useEffect(() => {
        if (userId) {
            connect();
        }
        return () => {
            if (socket) {
                socket.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [userId, connect]);

    const sendMessage = useCallback((data: Record<string, unknown>) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(data));
        }
    }, [socket]);

    return { socket, isConnected, sendMessage };
}
