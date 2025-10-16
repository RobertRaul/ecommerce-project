'use client';

import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { NotificationProvider } from '../contexts/NotificationContext';
import NotificationToastContainer from '@/components/notifications/NotificationToastContainer';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
    return (
        <html lang="es">
        <body className={inter.className}>
        <NotificationProvider>
            <NotificationToastContainer />
            {children}
        </NotificationProvider>
        <Toaster
            position="top-right"
            toastOptions={{
                duration: 3000,
                style: {
                    background: '#363636',
                    color: '#fff',
                },
                success: {
                    duration: 3000,
                    iconTheme: {
                        primary: '#10b981',
                        secondary: '#fff',
                    },
                },
                error: {
                    duration: 4000,
                    iconTheme: {
                        primary: '#ef4444',
                        secondary: '#fff',
                    },
                },
            }}
        />
        </body>
        </html>
    );
}
