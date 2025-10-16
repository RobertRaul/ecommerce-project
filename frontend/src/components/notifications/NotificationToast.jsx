'use client';

import { useEffect, useState } from 'react';
import { X, AlertCircle, Info, CheckCircle, Bell } from 'lucide-react';

export default function NotificationToast({ notification, onClose }) {
    const [isVisible, setIsVisible] = useState(false);
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        setTimeout(() => setIsVisible(true), 10);

        const duration = 6000;
        const interval = 50;
        const decrement = (interval / duration) * 100;

        const progressTimer = setInterval(() => {
            setProgress(prev => {
                const next = prev - decrement;
                return next <= 0 ? 0 : next;
            });
        }, interval);

        const closeTimer = setTimeout(() => {
            handleClose();
        }, duration);

        return () => {
            clearInterval(progressTimer);
            clearTimeout(closeTimer);
        };
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => onClose(), 300);
    };

    const getStyles = () => {
        switch (notification.priority) {
            case 'urgent':
                return {
                    icon: <AlertCircle className="w-5 h-5" />,
                    bgGradient: 'from-red-50 to-red-100',
                    iconBg: 'bg-red-500',
                    textColor: 'text-red-900',
                    progressBg: 'bg-red-500',
                };
            case 'high':
                return {
                    icon: <AlertCircle className="w-5 h-5" />,
                    bgGradient: 'from-orange-50 to-orange-100',
                    iconBg: 'bg-orange-500',
                    textColor: 'text-orange-900',
                    progressBg: 'bg-orange-500',
                };
            case 'medium':
                return {
                    icon: <Bell className="w-5 h-5" />,
                    bgGradient: 'from-blue-50 to-blue-100',
                    iconBg: 'bg-blue-500',
                    textColor: 'text-blue-900',
                    progressBg: 'bg-blue-500',
                };
            default:
                return {
                    icon: <Info className="w-5 h-5" />,
                    bgGradient: 'from-gray-50 to-gray-100',
                    iconBg: 'bg-gray-500',
                    textColor: 'text-gray-900',
                    progressBg: 'bg-gray-500',
                };
        }
    };

    const styles = getStyles();

    return (
        <div
            className={`transform transition-all duration-300 ease-out ${
                isVisible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'
            }`}
        >
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-sm min-w-[360px] border border-gray-200">
                <div className={`bg-gradient-to-br ${styles.bgGradient} p-4`}>
                    <div className="flex items-start gap-3">
                        <div className={`${styles.iconBg} rounded-lg p-2 text-white flex-shrink-0`}>
                            {styles.icon}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h4 className={`font-bold ${styles.textColor} text-sm mb-1.5 leading-tight`}>
                                {notification.title}
                            </h4>
                            <p className="text-xs text-gray-700 leading-relaxed">
                                {notification.message}
                            </p>
                            {notification.action_url && (
                                <button
                                    className={`text-xs ${styles.textColor} hover:underline font-semibold mt-2 inline-flex items-center gap-1`}
                                    onClick={() => {
                                        window.location.href = notification.action_url;
                                        handleClose();
                                    }}
                                >
                                    Ver detalles
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        <button
                            onClick={handleClose}
                            className="flex-shrink-0 text-gray-500 hover:text-gray-700 transition rounded-lg p-1 hover:bg-white/50"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="h-1 bg-gray-200">
                    <div
                        className={`h-full ${styles.progressBg} transition-all duration-50 ease-linear`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
}