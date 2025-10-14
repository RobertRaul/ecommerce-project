'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Search, Filter, Download, Eye, Package,
    Clock, CheckCircle, XCircle, Truck, AlertCircle
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function OrdenesPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
    });

    useEffect(() => {
        fetchOrders();
    }, [currentPage, statusFilter, paymentFilter, searchTerm]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage,
                page_size: 15,
            });

            if (searchTerm) params.append('search', searchTerm);
            if (statusFilter !== 'all') params.append('status', statusFilter);
            if (paymentFilter !== 'all') params.append('payment_status', paymentFilter);

            const response = await api.get(`/orders/?${params.toString()}`);
            const data = response.data.results || response.data;
            
            setOrders(Array.isArray(data) ? data : []);
            
            if (response.data.count) {
                setTotalPages(Math.ceil(response.data.count / 15));
            }

            // Calcular estadísticas
            calculateStats(data);
        } catch (error) {
            console.error('Error al cargar órdenes:', error);
            toast.error('Error al cargar órdenes');
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (ordersData) => {
        setStats({
            total: ordersData.length,
            pending: ordersData.filter(o => o.status === 'pending' || o.status === 'payment_pending').length,
            processing: ordersData.filter(o => o.status === 'processing' || o.status === 'payment_verified').length,
            completed: ordersData.filter(o => o.status === 'delivered').length,
        });
    };

    const getStatusConfig = (status) => {
        const configs = {
            pending: { label: 'Pendiente', color: 'bg-gray-100 text-gray-800', icon: Clock },
            payment_pending: { label: 'Esperando Pago', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
            payment_verified: { label: 'Pago Verificado', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
            processing: { label: 'Procesando', color: 'bg-purple-100 text-purple-800', icon: Package },
            shipped: { label: 'Enviado', color: 'bg-cyan-100 text-cyan-800', icon: Truck },
            delivered: { label: 'Entregado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
            cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: XCircle },
            refunded: { label: 'Reembolsado', color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
        };
        return configs[status] || configs.pending;
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Órdenes</h1>
                    <p className="text-gray-600 mt-1">
                        Gestiona todos los pedidos de tu tienda
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Órdenes</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                            </div>
                            <Package className="h-10 w-10 text-blue-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pending}</p>
                            </div>
                            <Clock className="h-10 w-10 text-yellow-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">En Proceso</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.processing}</p>
                            </div>
                            <Package className="h-10 w-10 text-purple-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Completadas</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.completed}</p>
                            </div>
                            <CheckCircle className="h-10 w-10 text-green-500" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="md:col-span-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar por número de orden, cliente..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="all">Todos los estados</option>
                                <option value="pending">Pendiente</option>
                                <option value="payment_pending">Esperando Pago</option>
                                <option value="payment_verified">Pago Verificado</option>
                                <option value="processing">Procesando</option>
                                <option value="shipped">Enviado</option>
                                <option value="delivered">Entregado</option>
                                <option value="cancelled">Cancelado</option>
                            </select>
                        </div>

                        {/* Payment Filter */}
                        <div>
                            <select
                                value={paymentFilter}
                                onChange={(e) => setPaymentFilter(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="all">Todos los pagos</option>
                                <option value="pending">Pago Pendiente</option>
                                <option value="verified">Pago Verificado</option>
                                <option value="failed">Pago Fallido</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Orders Table */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-12">
                            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No hay órdenes
                            </h3>
                            <p className="text-gray-600">
                                Las órdenes aparecerán aquí cuando los clientes realicen compras
                            </p>
                        </div>
                    ) : (
                        <>
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
                                                Pago
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Total
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Fecha
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Acciones
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {orders.map((order) => {
                                            const statusConfig = getStatusConfig(order.status);
                                            const StatusIcon = statusConfig.icon;

                                            return (
                                                <tr key={order.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <Link
                                                            href={`/admin/ordenes/${order.order_number}`}
                                                            className="text-purple-600 hover:text-purple-700 font-semibold"
                                                        >
                                                            #{order.order_number}
                                                        </Link>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {order.email}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {order.phone}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.color}`}>
                                                            <StatusIcon className="h-3.5 w-3.5" />
                                                            <span>{statusConfig.label}</span>
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-sm text-gray-900 capitalize">
                                                            {order.payment_method}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-bold text-gray-900">
                                                            S/ {parseFloat(order.total).toFixed(2)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(order.created_at).toLocaleDateString('es-PE', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <Link
                                                            href={`/admin/ordenes/${order.order_number}`}
                                                            className="inline-flex items-center space-x-1 text-purple-600 hover:text-purple-700 font-medium"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                            <span>Ver</span>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="px-6 py-4 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Anterior
                                        </button>
                                        <span className="text-sm text-gray-700">
                                            Página {currentPage} de {totalPages}
                                        </span>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Siguiente
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
