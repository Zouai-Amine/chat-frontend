import { useState, useEffect, useRef, useCallback } from 'react';
import { WebSocketMessage } from '../types';

interface UseWebSocketProps {
    url: string;
    userId: number | null;
    onMessage: (data: WebSocketMessage) => void;
    onError?: (error: string) => void;
}

export function useWebSocket({ url, userId, onMessage, onError }: UseWebSocketProps) {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 5;
    const onMessageRef = useRef(onMessage);
    const onErrorRef = useRef(onError);

    // Update refs when callbacks change
    useEffect(() => {
        onMessageRef.current = onMessage;
    }, [onMessage]);

    useEffect(() => {
        onErrorRef.current = onError;
    }, [onError]);

    const connect = useCallback(() => {
        if (!userId) return;

        setIsConnecting(true);

        try {
            const wsUrl = url.replace(/^http/, 'ws');
            const ws = new WebSocket(`${wsUrl}/ws/${userId}`);

            ws.onopen = () => {
                console.log("✅ WebSocket connected successfully");
                setIsConnected(true);
                setIsConnecting(false);
                reconnectAttemptsRef.current = 0; // Reset attempts on successful connection
            };

            ws.onclose = (event) => {
                console.log("❌ WebSocket disconnected", event.code, event.reason);
                setIsConnected(false);
                setIsConnecting(false);
                setSocket(null);

                // Attempt to reconnect
                if (reconnectAttemptsRef.current < maxReconnectAttempts) {
                    reconnectAttemptsRef.current++;
                    const backoffTime = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);

                    console.log(`🔄 Reconnecting in ${backoffTime}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);

                    reconnectTimeoutRef.current = setTimeout(() => connect(), backoffTime);
                } else {
                    // Max attempts reached
                    const errorMessage = "Unable to connect to chat server. Please check your connection and try refreshing the page.";
                    if (onErrorRef.current) {
                        onErrorRef.current(errorMessage);
                    }
                    reconnectAttemptsRef.current = 0; // Reset for next manual attempt
                }
            };

            ws.onerror = (event) => {
                console.error("⚠️ WebSocket error:", event);
                setIsConnecting(false);
                // Error details are limited in browser WebSocket API
                // The onclose event will handle reconnection
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (onMessageRef.current) {
                        onMessageRef.current(data);
                    }
                } catch (err) {
                    console.error("❌ Error parsing WebSocket message:", err);
                    if (onErrorRef.current) {
                        onErrorRef.current("Received invalid message from server");
                    }
                }
            };

            setSocket(ws);
        } catch (err) {
            console.error("❌ Failed to create WebSocket:", err);
            setIsConnecting(false);
            if (onErrorRef.current) {
                onErrorRef.current("Failed to establish connection to chat server");
            }
        }
    }, [url, userId]);

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
            try {
                socket.send(JSON.stringify(data));
            } catch (err) {
                console.error("❌ Failed to send message:", err);
                if (onErrorRef.current) {
                    onErrorRef.current("Failed to send message. Please try again.");
                }
            }
        } else {
            console.warn("⚠️ Cannot send message: WebSocket is not connected");
            if (onErrorRef.current) {
                onErrorRef.current("Not connected to chat server. Attempting to reconnect...");
            }
        }
    }, [socket]);

    return { socket, isConnected, isConnecting, sendMessage };
}
