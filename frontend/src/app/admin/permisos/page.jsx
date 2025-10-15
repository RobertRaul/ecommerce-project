'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shield, Users, Key, FileText, UserCog, AlertCircle } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function PermisosPage() {
    const [stats, setStats] = useState({
        totalRoles: 0,
        totalUsers: 0,
        totalPermissions: 0,
        recentLogs: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const [rolesRes, usersRes, permsRes] = await Promise.all([
                api.get('/roles/'),
                api.get('/user-roles/'),
                api.get('/permissions/')
            ]);

            const rolesData = rolesRes.data.results || rolesRes.data;
            const usersData = usersRes.data.results || usersRes.data;
            const permsData = permsRes.data.results || permsRes.data;

            setStats({
                totalRoles: Array.isArray(rolesData) ? rolesData.length : 0,
                totalUsers: Array.isArray(usersData) ? usersData.length : 0,
                totalPermissions: Array.isArray(permsData) ? permsData.length : 0,
                recentLogs: 0
            });
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al cargar estadísticas');
            setStats({
                totalRoles: 0,
                totalUsers: 0,
                totalPermissions: 0,
                recentLogs: 0
            });
        } finally {
            setLoading(false);
        }
    };

    const cards = [
        {
            title: 'Roles',
            value: stats.totalRoles,
            icon: Shield,
            color: 'purple',
            gradient: 'from-purple-500 to-purple-600',
            link: '/admin/permisos/roles',
            description: 'Gestionar roles del sistema'
        },
        {
            title: 'Usuarios con Roles',
            value: stats.totalUsers,
            icon: Users,
            color: 'blue',
            gradient: 'from-blue-500 to-blue-600',
            link: '/admin/permisos/usuarios',
            description: 'Asignar roles a usuarios'
        },
        {
            title: 'Permisos',
            value: stats.totalPermissions,
            icon: Key,
            color: 'green',
            gradient: 'from-green-500 to-green-600',
            link: '/admin/permisos/lista',
            description: 'Ver todos los permisos'
        },
        {
            title: 'Logs de Auditoría',
            value: stats.recentLogs,
            icon: FileText,
            color: 'orange',
            gradient: 'from-orange-500 to-orange-600',
            link: '/admin/permisos/logs',
            description: 'Historial de cambios'
        }
    ];

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                        <Shield className="h-8 w-8 text-purple-600" />
                        <span>Sistema de Permisos</span>
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Gestiona roles, permisos y accesos de usuarios del sistema
                    </p>
                </div>

                {/* Alert Info */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                    <div className="flex items-start space-x-3">
                        <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                            <h3 className="text-sm font-semibold text-blue-900">Sistema de Control de Acceso</h3>
                            <p className="text-sm text-blue-700 mt-1">
                                Define quién puede hacer qué en tu plataforma. Los roles agrupan permisos y se asignan a usuarios para controlar el acceso a diferentes funcionalidades.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                                <div className="h-20 bg-gray-200 rounded"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {cards.map((card) => {
                            const Icon = card.icon;
                            return (
                                <Link
                                    key={card.title}
                                    href={card.link}
                                    className="group"
                                >
                                    <div className={`bg-gradient-to-br ${card.gradient} rounded-lg shadow-lg p-6 text-white hover:shadow-xl transition-all transform hover:-translate-y-1`}>
                                        <div className="flex items-center justify-between mb-4">
                                            <Icon className="h-10 w-10 opacity-80" />
                                            <span className="text-3xl font-bold">{card.value}</span>
                                        </div>
                                        <h3 className="text-lg font-semibold mb-1">{card.title}</h3>
                                        <p className="text-sm text-white/80">{card.description}</p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <UserCog className="h-6 w-6 mr-2 text-purple-600" />
                        Acciones Rápidas
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Link
                            href="/admin/permisos/roles"
                            className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition group"
                        >
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition">
                                <Shield className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition">
                                    Ver Roles
                                </h3>
                                <p className="text-sm text-gray-500">Gestionar roles del sistema</p>
                            </div>
                        </Link>

                        <Link
                            href="/admin/permisos/usuarios"
                            className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition group"
                        >
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition">
                                <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
                                    Asignar Roles
                                </h3>
                                <p className="text-sm text-gray-500">Asignar roles a usuarios</p>
                            </div>
                        </Link>

                        <Link
                            href="/admin/permisos/lista"
                            className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition group"
                        >
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition">
                                <Key className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition">
                                    Ver Permisos
                                </h3>
                                <p className="text-sm text-gray-500">Todos los permisos del sistema</p>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <h3 className="font-bold text-gray-900 mb-3">¿Qué son los Roles?</h3>
                        <p className="text-gray-600 text-sm mb-4">
                            Los roles son conjuntos predefinidos de permisos que se pueden asignar a usuarios. 
                            Facilitan la gestión de accesos agrupando permisos relacionados.
                        </p>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex items-start space-x-2">
                                <span className="text-purple-600 mt-0.5">•</span>
                                <span><strong>Super Admin:</strong> Acceso total al sistema</span>
                            </li>
                            <li className="flex items-start space-x-2">
                                <span className="text-purple-600 mt-0.5">•</span>
                                <span><strong>Admin:</strong> Gestión de productos, órdenes y clientes</span>
                            </li>
                            <li className="flex items-start space-x-2">
                                <span className="text-purple-600 mt-0.5">•</span>
                                <span><strong>Gestor de Inventario:</strong> Solo productos y stock</span>
                            </li>
                            <li className="flex items-start space-x-2">
                                <span className="text-purple-600 mt-0.5">•</span>
                                <span><strong>Gestor de Órdenes:</strong> Solo órdenes y clientes</span>
                            </li>
                            <li className="flex items-start space-x-2">
                                <span className="text-purple-600 mt-0.5">•</span>
                                <span><strong>Visor:</strong> Solo lectura, sin edición</span>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <h3 className="font-bold text-gray-900 mb-3">Categorías de Permisos</h3>
                        <p className="text-gray-600 text-sm mb-4">
                            Los permisos están organizados por categorías para facilitar su gestión:
                        </p>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex items-start space-x-2">
                                <span className="text-blue-600 mt-0.5">•</span>
                                <span><strong>Productos:</strong> Crear, editar, eliminar productos</span>
                            </li>
                            <li className="flex items-start space-x-2">
                                <span className="text-blue-600 mt-0.5">•</span>
                                <span><strong>Órdenes:</strong> Gestionar pedidos y estados</span>
                            </li>
                            <li className="flex items-start space-x-2">
                                <span className="text-blue-600 mt-0.5">•</span>
                                <span><strong>Clientes:</strong> Ver y editar información</span>
                            </li>
                            <li className="flex items-start space-x-2">
                                <span className="text-blue-600 mt-0.5">•</span>
                                <span><strong>Reportes:</strong> Acceso a análisis y exportaciones</span>
                            </li>
                            <li className="flex items-start space-x-2">
                                <span className="text-blue-600 mt-0.5">•</span>
                                <span><strong>Configuración:</strong> Ajustes del sistema</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
