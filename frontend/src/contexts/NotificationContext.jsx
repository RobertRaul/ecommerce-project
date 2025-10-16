'use client';

import { createContext, useCallback, useEffect, useRef, useState } from 'react';

export const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef(null);
    const [token, setToken] = useState(null);
    const reconnectTimeoutRef = useRef(null);

    useEffect(() => {
        const storedToken = localStorage.getItem('access_token');
        if (storedToken && !token) {
            setToken(storedToken);
        }
    }, [token]);

    useEffect(() => {
        if (!token) return;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const backendHost = process.env.NEXT_PUBLIC_API_URL
            ?.replace('http://', '')
            .replace('https://', '')
            .replace('/api', '') || 'localhost:8000';
        const wsUrl = `${protocol}//${backendHost}/ws/notifications/?token=${token}`;

        try {
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                setIsConnected(true);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.type === 'notification' && data.notification) {
                        setNotifications((prev) => [data.notification, ...prev]);
                        setUnreadCount((prev) => prev + 1);
                    }
                } catch (error) {
                    // Error silencioso
                }
            };

            ws.onerror = () => {
                setIsConnected(false);
            };

            ws.onclose = () => {
                setIsConnected(false);

                reconnectTimeoutRef.current = setTimeout(() => {
                    const newToken = localStorage.getItem('access_token');
                    if (newToken) {
                        setToken(null);
                        setTimeout(() => setToken(newToken), 100);
                    }
                }, 5000);
            };

            wsRef.current = ws;
        } catch (error) {
            // Error silencioso
        }

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [token]);

    const markAsRead = useCallback((notificationId) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'mark_as_read',
                notification_id: notificationId,
            }));
            setNotifications((prev) =>
                prev.map((n) =>
                    n.id === notificationId ? { ...n, read: true } : n
                )
            );
        }
    }, []);

    const clearNotification = useCallback((notificationId) => {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    }, []);

    const markAllAsRead = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'mark_all_as_read',
            }));
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, read: true }))
            );
            setUnreadCount(0);
        }
    }, []);

    const value = {
        notifications,
        unreadCount,
        isConnected,
        markAsRead,
        clearNotification,
        markAllAsRead,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}
