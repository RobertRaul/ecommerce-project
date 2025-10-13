'use client';

import { useEffect, useState } from 'react';
import {
    ShoppingCart, Package, Users, DollarSign,
    TrendingUp, AlertCircle, Clock, CheckCircle
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import StatCard from '@/components/admin/StatCard';
import api from '@/lib/api';
import Link from 'next/link';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, ordersRes] = await Promise.all([
                api.get('/admin/dashboard-stats/'),
                api.get('/orders/?page_size=5')
            ]);

            setStats(statsRes.data);
            setRecentOrders(ordersRes.data.results || ordersRes.data);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-600 mt-1">Resumen de tu tienda</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Ventas del Mes"
                        value={`S/ ${stats?.monthly_sales?.toFixed(2) || '0.00'}`}
                        icon={DollarSign}
                        color="green"
                        trend="+12.5%"
                        trendUp={true}
                    />
                    <StatCard
                        title="Órdenes Pendientes"
                        value={stats?.pending_orders || 0}
                        icon={Clock}
                        color="orange"
                    />
                    <StatCard
                        title="Total Productos"
                        value={stats?.total_products || 0}
                        icon={Package}
                        color="blue"
                    />
                    <StatCard
                        title="Total Clientes"
                        value={stats?.total_customers || 0}
                        icon={Users}
                        color="purple"
                    />
                </div>

                {/* Recent Orders */}
                <div className="bg-white rounded-lg shadow-sm">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">
                                Órdenes Recientes
                            </h2>
                            <Link
                                href="/admin/ordenes"
                                className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                            >
                                Ver todas →
                            </Link>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Orden
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Cliente
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Fecha
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {recentOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Link
                                            href={`/admin/ordenes/${order.order_number}`}
                                            className="text-purple-600 hover:text-purple-700 font-medium"
                                        >
                                            #{order.order_number}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{order.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <StatusBadge status={order.status} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-gray-900">
                                            S/ {order.total}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(order.created_at).toLocaleDateString('es-PE')}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <QuickActionCard
                        title="Agregar Producto"
                        description="Añade un nuevo producto a tu catálogo"
                        href="/admin/productos/nuevo"
                        icon={Package}
                        color="purple"
                    />
                    <QuickActionCard
                        title="Ver Órdenes"
                        description="Gestiona tus pedidos pendientes"
                        href="/admin/ordenes"
                        icon={ShoppingCart}
                        color="blue"
                    />
                    <QuickActionCard
                        title="Reportes"
                        description="Analiza el rendimiento de tu tienda"
                        href="/admin/reportes"
                        icon={TrendingUp}
                        color="green"
                    />
                </div>
            </div>
        </AdminLayout>
    );
}

function StatusBadge({ status }) {
    const statusConfig = {
        pending: { label: 'Pendiente', color: 'bg-gray-100 text-gray-800' },
        payment_pending: { label: 'Pago Pendiente', color: 'bg-yellow-100 text-yellow-800' },
        payment_verified: { label: 'Pago Verificado', color: 'bg-blue-100 text-blue-800' },
        processing: { label: 'Procesando', color: 'bg-purple-100 text-purple-800' },
        shipped: { label: 'Enviado', color: 'bg-cyan-100 text-cyan-800' },
        delivered: { label: 'Entregado', color: 'bg-green-100 text-green-800' },
        cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${config.color}`}>
            {config.label}
        </span>
    );
}

function QuickActionCard({ title, description, href, icon: Icon, color }) {
    const colorClasses = {
        purple: 'bg-purple-100 text-purple-600 hover:bg-purple-200',
        blue: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
        green: 'bg-green-100 text-green-600 hover:bg-green-200',
    };

    return (
        <Link
            href={href}
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all group"
        >
            <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Icon className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
        </Link>
    );
}