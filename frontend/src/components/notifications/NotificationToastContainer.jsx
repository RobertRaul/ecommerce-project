'use client';

import { useEffect, useState, useRef } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import NotificationToast from './NotificationToast';

export default function NotificationToastContainer() {
    const { notifications, isLoading } = useNotifications();
    const [toasts, setToasts] = useState([]);
    const prevNotificationsRef = useRef([]);
    const isInitialLoadRef = useRef(true);

    useEffect(() => {
        // Si está cargando las notificaciones históricas, no mostrar toasts
        if (isLoading && isInitialLoadRef.current) {
            return;
        }

        // Después de la carga inicial, marcar como completada
        if (!isLoading && isInitialLoadRef.current) {
            isInitialLoadRef.current = false;
            prevNotificationsRef.current = notifications;
            return;
        }

        // Solo procesar notificaciones después de la carga inicial
        if (!isInitialLoadRef.current) {
            const prevIds = prevNotificationsRef.current.map(n => n.id);
            const newNotifications = notifications.filter(n =>
                !prevIds.includes(n.id) && !n.read // Solo notificaciones nuevas y no leídas
            );

            if (newNotifications.length > 0) {
                newNotifications.forEach(notification => {
                    setToasts(prev => {
                        // Evitar duplicados en toasts
                        const exists = prev.some(t => t.id === notification.id);
                        if (exists) return prev;
                        return [...prev, notification];
                    });
                });
            }

            prevNotificationsRef.current = notifications;
        }
    }, [notifications, isLoading]);

    const handleCloseToast = (notificationId) => {
        setToasts(prev => prev.filter(t => t.id !== notificationId));
    };

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-20 right-6 z-50 pointer-events-none">
            <div className="flex flex-col gap-4 pointer-events-auto">
                {toasts.map(notification => (
                    <NotificationToast
                        key={notification.id}
                        notification={notification}
                        onClose={() => handleCloseToast(notification.id)}
                    />
                ))}
            </div>
        </div>
    );
}