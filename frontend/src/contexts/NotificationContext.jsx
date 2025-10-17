'use client';

import { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import api from '@/lib/api';

export const NotificationContext = createContext(null);

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications debe ser usado dentro de un NotificationProvider');
    }
    return context;
}

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const wsRef = useRef(null);
    const [token, setToken] = useState(null);
    const reconnectTimeoutRef = useRef(null);
    const hasLoadedHistoric = useRef(false);

    // Función para cargar notificaciones históricas desde el backend
    const loadHistoricNotifications = useCallback(async () => {
        if (!token || hasLoadedHistoric.current) return;

        setIsLoading(true);
        try {
            const response = await api.get('/notifications/');

            // Manejar diferentes estructuras de respuesta de manera defensiva
            let historicNotifications = response.data;

            // Si la respuesta está paginada (tiene 'results'), extraer el array
            if (historicNotifications && typeof historicNotifications === 'object' && 'results' in historicNotifications) {
                historicNotifications = historicNotifications.results;
            }

            // Validar que tenemos un array válido
            if (!Array.isArray(historicNotifications)) {
                console.warn('La respuesta de notificaciones no es un array:', historicNotifications);
                historicNotifications = [];
            }

            // Ordenar por fecha más reciente primero (crear copia para no mutar)
            const sorted = [...historicNotifications].sort((a, b) =>
                new Date(b.created_at) - new Date(a.created_at)
            );

            setNotifications(sorted);

            // Contar las no leídas
            const unread = sorted.filter(n => !n.read).length;
            setUnreadCount(unread);

            hasLoadedHistoric.current = true;
        } catch (error) {
            console.error('Error cargando notificaciones históricas:', error);
            // En caso de error, establecer array vacío para evitar crashes
            setNotifications([]);
            setUnreadCount(0);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        const storedToken = localStorage.getItem('access_token');
        if (storedToken && !token) {
            setToken(storedToken);
        }
    }, [token]);

    // Cargar notificaciones históricas al autenticarse
    useEffect(() => {
        if (token && !hasLoadedHistoric.current) {
            loadHistoricNotifications();
        }
    }, [token, loadHistoricNotifications]);

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
                        // Evitar duplicados: verificar si la notificación ya existe
                        setNotifications((prev) => {
                            const exists = prev.some(n => n.id === data.notification.id);
                            if (exists) {
                                return prev;
                            }
                            return [data.notification, ...prev];
                        });

                        // Solo incrementar contador si es una notificación nueva
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

    const markAsRead = useCallback(async (notificationId) => {
        // Actualizar localmente primero
        setNotifications((prev) =>
            prev.map((n) =>
                n.id === notificationId ? { ...n, read: true } : n
            )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));

        // Intentar enviar por WebSocket
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'mark_as_read',
                notification_id: notificationId,
            }));
        }

        // También actualizar en el backend vía API REST (fallback)
        try {
            await api.post(`/notifications/${notificationId}/mark_as_read/`);
        } catch (error) {
            console.error('Error marcando notificación como leída:', error);
        }
    }, []);

    const clearNotification = useCallback((notificationId) => {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    }, []);

    const markAllAsRead = useCallback(async () => {
        // Actualizar localmente primero
        setNotifications((prev) =>
            prev.map((n) => ({ ...n, read: true }))
        );
        setUnreadCount(0);

        // Intentar enviar por WebSocket
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'mark_all_as_read',
            }));
        }

        // También actualizar en el backend vía API REST (fallback)
        try {
            await api.post('/notifications/mark_all_as_read/');
        } catch (error) {
            console.error('Error marcando todas como leídas:', error);
        }
    }, []);

    const value = {
        notifications,
        unreadCount,
        isConnected,
        isLoading,
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
