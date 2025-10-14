'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, Package, ShoppingCart, Users,
    Tags, BarChart3, Settings, LogOut, X, Image as ImageIcon
} from 'lucide-react';
import useAuthStore from '@/store/authStore';

export default function Sidebar({ isOpen, onToggle }) {
    const pathname = usePathname();
    const { logout } = useAuthStore();

    const menuItems = [
        {
            name: 'Dashboard',
            href: '/admin',
            icon: LayoutDashboard,
            exact: true
        },
        {
            name: 'Productos',
            href: '/admin/productos',
            icon: Package
        },
        {
            name: 'Órdenes',
            href: '/admin/ordenes',
            icon: ShoppingCart
        },
        {
            name: 'Categorías',
            href: '/admin/categorias',
            icon: Tags
        },
        {
            name: 'Marcas',
            href: '/admin/marcas',
            icon: ImageIcon
        },
        {
            name: 'Clientes',
            href: '/admin/clientes',
            icon: Users
        },
        {
            name: 'Reportes',
            href: '/admin/reportes',
            icon: BarChart3
        },
        {
            name: 'Configuración',
            href: '/admin/configuracion',
            icon: Settings
        },
    ];

    const handleLogout = async () => {
        await logout();
        window.location.href = '/';
    };

    return (
        <>
            {/* Mobile backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
                    onClick={onToggle}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed lg:static inset-y-0 left-0 z-30
                    w-64 bg-gray-900 text-white 
                    transform transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    flex flex-col
                `}
            >
                {/* Logo */}
                <div className="flex items-center justify-between h-16 px-6 bg-gray-800">
                    <Link href="/admin" className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg"></div>
                        <span className="text-xl font-bold">ADMIN</span>
                    </Link>
                    <button
                        onClick={onToggle}
                        className="lg:hidden text-gray-400 hover:text-white"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.exact
                            ? pathname === item.href
                            : pathname.startsWith(item.href);

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`
                                    flex items-center space-x-3 px-4 py-3 rounded-lg
                                    transition-colors duration-200
                                    ${isActive
                                    ? 'bg-purple-600 text-white'
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                }
                                `}
                            >
                                <Icon className="h-5 w-5" />
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User section */}
                <div className="p-4 border-t border-gray-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors duration-200"
                    >
                        <LogOut className="h-5 w-5" />
                        <span className="font-medium">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>
        </>
    );
}