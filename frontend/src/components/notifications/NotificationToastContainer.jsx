'use client';

import { useEffect, useState, useRef } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationToast from './NotificationToast';

export default function NotificationToastContainer() {
    const { notifications } = useNotifications();
    const [toasts, setToasts] = useState([]);
    const prevNotificationsRef = useRef([]);

    useEffect(() => {
        const prevIds = prevNotificationsRef.current.map(n => n.id);
        const newNotifications = notifications.filter(n => !prevIds.includes(n.id));

        if (newNotifications.length > 0) {
            newNotifications.forEach(notification => {
                setToasts(prev => [...prev, notification]);
            });
        }

        prevNotificationsRef.current = notifications;
    }, [notifications]);

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