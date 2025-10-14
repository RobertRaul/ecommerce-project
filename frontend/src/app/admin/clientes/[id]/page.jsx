'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, User, Mail, Phone, MapPin, Calendar,
    ShoppingBag, DollarSign, Package, Eye
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ClienteDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;

    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchUserData();
        }
    }, [id]);

    const fetchUserData = async () => {
        setLoading(true);
        try {
            // Obtener datos del usuario
            const userResponse = await api.get(`/auth/users/${id}/`);
            setUser(userResponse.data);

            // Obtener órdenes del usuario (si es posible)
            try {
                const ordersResponse = await api.get(`/orders/?user=${id}`);
                setOrders(ordersResponse.data.results || ordersResponse.data || []);
            } catch (error) {
                console.log('No se pudieron cargar las órdenes');
                setOrders([]);
            }
        } catch (error) {
            console.error('Error al cargar usuario:', error);
            toast.error('Error al cargar información del cliente');
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

    if (!user) {
        return (
            <AdminLayout>
                <div className="text-center py-12">
                    <h2 className="text-2xl font-bold text-gray-900">Cliente no encontrado</h2>
                    <Link href="/admin/clientes" className="text-purple-600 hover:text-purple-700 mt-4 inline-block">
                        Volver a clientes
                    </Link>
                </div>
            </AdminLayout>
        );
    }

    const totalGastado = orders
        .filter(o => ['delivered', 'shipped', 'processing'].includes(o.status))
        .reduce((sum, o) => sum + parseFloat(o.total), 0);

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link
                            href="/admin/clientes"
                            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            <span>Volver a clientes</span>
                        </Link>
                    </div>
                </div>

                {/* User Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                                <User className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    {user.first_name} {user.last_name}
                                </h1>
                                <p className="text-gray-600">@{user.username}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                user.is_active
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                            }`}>
                                {user.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Stats */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Stats Cards */}
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
                            <div className="flex items-center justify-between mb-2">
                                <ShoppingBag className="h-8 w-8 opacity-80" />
                            </div>
                            <p className="text-white/80 text-sm font-medium">Total Órdenes</p>
                            <p className="text-3xl font-bold mt-1">{orders.length}</p>
                        </div>

                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
                            <div className="flex items-center justify-between mb-2">
                                <DollarSign className="h-8 w-8 opacity-80" />
                            </div>
                            <p className="text-white/80 text-sm font-medium">Total Gastado</p>
                            <p className="text-3xl font-bold mt-1">S/ {totalGastado.toFixed(2)}</p>
                        </div>

                        {/* Contact Info */}
                        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Información de Contacto</h2>
                            <div className="space-y-4">
                                <div className="flex items-center space-x-3">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="font-medium text-gray-900">{user.email}</p>
                                    </div>
                                </div>
                                {user.phone && (
                                    <div className="flex items-center space-x-3">
                                        <Phone className="h-5 w-5 text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-500">Teléfono</p>
                                            <p className="font-medium text-gray-900">{user.phone}</p>
                                        </div>
                                    </div>
                                )}
                                {(user.city || user.department) && (
                                    <div className="flex items-center space-x-3">
                                        <MapPin className="h-5 w-5 text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-500">Ubicación</p>
                                            <p className="font-medium text-gray-900">
                                                {user.city}, {user.department}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center space-x-3">
                                    <Calendar className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-500">Miembro desde</p>
                                        <p className="font-medium text-gray-900">
                                            {new Date(user.date_joined).toLocaleDateString('es-PE', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Orders History */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center">
                                    <Package className="h-5 w-5 mr-2 text-purple-600" />
                                    Historial de Órdenes
                                </h2>
                            </div>
                            <div className="p-6">
                                {orders.length === 0 ? (
                                    <div className="text-center py-12">
                                        <ShoppingBag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                                            Sin órdenes
                                        </h3>
                                        <p className="text-gray-600">
                                            Este cliente aún no ha realizado ninguna compra
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {orders.map((order) => (
                                            <div
                                                key={order.id}
                                                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-purple-500 transition"
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-3 mb-2">
                                                        <Link
                                                            href={`/admin/ordenes/${order.order_number}`}
                                                            className="text-purple-600 hover:text-purple-700 font-semibold"
                                                        >
                                                            #{order.order_number}
                                                        </Link>
                                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                            order.status === 'delivered'
                                                                ? 'bg-green-100 text-green-800'
                                                                : order.status === 'shipped'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : order.status === 'processing'
                                                                ? 'bg-purple-100 text-purple-800'
                                                                : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                            {order.status === 'delivered' && 'Entregado'}
                                                            {order.status === 'shipped' && 'Enviado'}
                                                            {order.status === 'processing' && 'Procesando'}
                                                            {order.status === 'payment_pending' && 'Pago Pendiente'}
                                                            {order.status === 'payment_verified' && 'Pago Verificado'}
                                                            {order.status === 'cancelled' && 'Cancelado'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                        <span>
                                                            {new Date(order.created_at).toLocaleDateString('es-PE')}
                                                        </span>
                                                        <span>•</span>
                                                        <span>{order.items?.length || 0} productos</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                    <div className="text-right">
                                                        <p className="text-lg font-bold text-gray-900">
                                                            S/ {parseFloat(order.total).toFixed(2)}
                                                        </p>
                                                    </div>
                                                    <Link
                                                        href={`/admin/ordenes/${order.order_number}`}
                                                        className="inline-flex items-center space-x-1 text-purple-600 hover:text-purple-700"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
