'use client';

import { useNotifications } from '@/hooks/useNotifications';
import { useState, useEffect } from 'react';
import { Bell, X, Check, AlertCircle, Info } from 'lucide-react';

export default function NotificationDisplay() {
    const { notifications, unreadCount, markAsRead, clearNotification, markAllAsRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const [displayNotifications, setDisplayNotifications] = useState([]);

    // Mostrar notificaciones automáticamente en tiempo real
    useEffect(() => {
        if (notifications.length > 0) {
            const latestNotification = notifications[0];
            // Mostrar notificación solo si no es leída
            if (!latestNotification.read) {
                showNotificationToast(latestNotification);
            }
        }
    }, [notifications]);

    // Función para mostrar notificación en toast (flotante)
    const showNotificationToast = (notification) => {
        const notificationId = `toast-${notification.id}-${Date.now()}`;
        setDisplayNotifications((prev) => [
            ...prev,
            { ...notification, toastId: notificationId },
        ]);

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            setDisplayNotifications((prev) =>
                prev.filter((n) => n.toastId !== notificationId)
            );
        }, 5000);
    };

    // Obtener icono según tipo de notificación
    const getIcon = (notification) => {
        const iconClass = 'w-5 h-5';
        switch (notification.priority) {
            case 'urgent':
                return <AlertCircle className={iconClass + ' text-red-500'} />;
            case 'high':
                return <AlertCircle className={iconClass + ' text-orange-500'} />;
            case 'medium':
                return <Bell className={iconClass + ' text-blue-500'} />;
            default:
                return <Info className={iconClass + ' text-gray-500'} />;
        }
    };

    // Obtener color según prioridad
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent':
                return 'border-red-500 bg-red-50';
            case 'high':
                return 'border-orange-500 bg-orange-50';
            case 'medium':
                return 'border-blue-500 bg-blue-50';
            default:
                return 'border-gray-300 bg-gray-50';
        }
    };

    return (
        <>
            {/* Notificaciones flotantes (toasts) */}
            <div className="fixed top-4 right-4 z-50 space-y-2">
                {displayNotifications.map((notification) => (
                    <div
                        key={notification.toastId}
                        className={`max-w-md p-4 rounded-lg shadow-lg border-l-4 ${getPriorityColor(
                            notification.priority
                        )} animate-in slide-in-from-right-5 fade-in duration-300`}
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                                {getIcon(notification)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm text-gray-900">
                                    {notification.title}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    {notification.message}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setDisplayNotifications((prev) =>
                                        prev.filter((n) => n.toastId !== notification.toastId)
                                    );
                                }}
                                className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Badge de notificaciones en la barra */}
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative p-2 text-gray-600 hover:text-gray-900 transition"
                    title="Notificaciones"
                >
                    <Bell className="w-6 h-6" />
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </button>

                {/* Dropdown de notificaciones */}
                {isOpen && (
                    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-40 max-h-96 overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="border-b border-gray-200 p-4 flex items-center justify-between bg-gray-50">
                            <h3 className="font-semibold text-gray-900">Notificaciones</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Marcar todas como leídas
                                </button>
                            )}
                        </div>

                        {/* Lista de notificaciones */}
                        <div className="overflow-y-auto flex-1">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p>No hay notificaciones</p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`border-b border-gray-100 p-4 hover:bg-gray-50 transition cursor-pointer ${
                                            notification.read ? 'bg-white' : 'bg-blue-50'
                                        }`}
                                        onClick={() => {
                                            if (!notification.read) {
                                                markAsRead(notification.id);
                                            }
                                        }}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 mt-1">
                                                {getIcon(notification)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-semibold text-sm text-gray-900">
                                                        {notification.title}
                                                    </h4>
                                                    {!notification.read && (
                                                        <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {new Date(
                                                        notification.created_at
                                                    ).toLocaleString('es-ES')}
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    clearNotification(notification.id);
                                                }}
                                                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="border-t border-gray-200 p-3 bg-gray-50 text-center">
                                <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                                    Ver todas las notificaciones
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}