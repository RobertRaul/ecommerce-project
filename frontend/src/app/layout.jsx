import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: 'Ecommerce - Tu Tienda Online',
    description: 'Los mejores productos de tecnología al mejor precio',
};

export default function RootLayout({ children }) {
    return (
        <html lang="es">
        <body className={inter.className}>
        {children}
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