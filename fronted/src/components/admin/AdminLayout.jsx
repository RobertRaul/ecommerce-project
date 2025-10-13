'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import useAuthStore from '@/store/authStore';

export default function AdminLayout({ children }) {
    const router = useRouter();
    const { user, isAuthenticated, isLoading, init } = useAuthStore();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        init();
    }, []);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login?redirect=/admin');
        }

        // Verificar si es admin/staff
        if (!isLoading && isAuthenticated && user && !user.is_staff) {
            router.push('/');
        }
    }, [isAuthenticated, isLoading, user, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (!isAuthenticated || !user?.is_staff) {
        return null;
    }

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
                    <div className="container mx-auto px-6 py-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}