'use client';

import { Menu, Search } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import NotificationBell from '@/components/notifications/NotificationBell';

export default function Header({ onMenuClick }) {
    const { user } = useAuthStore();

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
            {/* Left side */}
            <div className="flex items-center space-x-4">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden text-gray-600 hover:text-gray-900"
                >
                    <Menu className="h-6 w-6" />
                </button>

                {/* Search */}
                <div className="hidden md:flex items-center space-x-2 bg-gray-100 rounded-lg px-4 py-2">
                    <Search className="h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar productos, órdenes..."
                        className="bg-transparent outline-none text-sm w-64"
                    />
                </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
                {/* Notifications */}
                <NotificationBell />

                {/* User */}
                <div className="flex items-center space-x-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-gray-900">
                            {user?.first_name} {user?.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {user?.first_name?.[0]}{user?.last_name?.[0]}
                    </div>
                </div>
            </div>
        </header>
    );
}
