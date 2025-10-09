'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Package, Clock, CheckCircle, XCircle, Truck, Eye } from 'lucide-react';
import Layout from '@/components/Layout';
import useAuthStore from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function OrdersPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login?redirect=/ordenes');
            return;
        }
        fetchOrders();
    }, [isAuthenticated]);

    const fetchOrders = async () => {
        try {
            const response = await api.get('/orders/');
            setOrders(response.data.results || response.data);
        } catch (error) {
            console.error('Error al cargar órdenes:', error);
            toast.error('Error al cargar tus órdenes');
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending':
            case 'payment_pending':
                return <Clock className="h-5 w-5 text-yellow-600" />;
            case 'payment_verified':
            case 'processing':
                return <Package className="h-5 w-5 text-blue-600" />;
            case 'shipped':
                return <Truck className="h-5 w-5 text-purple-600" />;
            case 'delivered':
                return <CheckCircle className="h-5 w-5 text-green-600" />;
            case 'cancelled':
            case 'refunded':
                return <XCircle className="h-5 w-5 text-red-600" />;
            default:
                return <Package className="h-5 w-5 text-gray-600" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
            case 'payment_pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'payment_verified':
            case 'processing':
                return 'bg-blue-100 text-blue-800';
            case 'shipped':
                return 'bg-purple-100 text-purple-800';
            case 'delivered':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
            case 'refunded':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-gray-300 rounded w-1/4"></div>
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-lg shadow-md p-6">
                                <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
                                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Mis Órdenes</h1>

                {orders.length === 0 ? (
                    <div className="text-center py-16">
                        <Package className="mx-auto h-24 w-24 text-gray-400 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            No tienes órdenes aún
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Cuando realices una compra, aparecerá aquí
                        </p>
                        <Link
                            href="/productos"
                            className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
                        >
                            Comenzar a Comprar
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden"
                            >
                                {/* Order Header */}
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="flex items-center space-x-2">
                                                {getStatusIcon(order.status)}
                                                <span
                                                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                                                        order.status
                                                    )}`}
                                                >
                          {order.status_display}
                        </span>
                                            </div>
                                        </div>
                                        <div className="mt-2 sm:mt-0 flex items-center space-x-4 text-sm text-gray-600">
                      <span>
                        Orden #{order.order_number}
                      </span>
                                            <span>
                        {new Date(order.created_at).toLocaleDateString('es-PE', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                      </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Body */}
                                <div className="p-6">
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                                        {/* Products Preview */}
                                        <div className="flex-1 mb-4 lg:mb-0">
                                            <div className="flex items-center space-x-4">
                                                <div className="flex -space-x-2">
                                                    {order.items.slice(0, 3).map((item, index) => (
                                                        <div
                                                            key={item.id}
                                                            className="relative w-12 h-12 bg-gray-200 rounded-lg border-2 border-white overflow-hidden"
                                                            style={{ zIndex: 3 - index }}
                                                        >
                                                            <Image
                                                                src={item.product_detail?.primary_image || '/placeholder.png'}
                                                                alt={item.product_name}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                    ))}
                                                    {order.items.length > 3 && (
                                                        <div className="relative w-12 h-12 bg-gray-300 rounded-lg border-2 border-white flex items-center justify-center text-sm font-semibold text-gray-600">
                                                            +{order.items.length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {order.items.length} {order.items.length === 1 ? 'producto' : 'productos'}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        {order.payment_method_display}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Order Info */}
                                        <div className="flex items-center space-x-8">
                                            <div className="text-right">
                                                <p className="text-sm text-gray-600">Total</p>
                                                <p className="text-2xl font-bold text-gray-900">
                                                    S/ {order.total}
                                                </p>
                                            </div>

                                            <Link
                                                href={`/ordenes/${order.order_number}`}
                                                className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition"
                                            >
                                                <Eye className="h-5 w-5" />
                                                <span>Ver Detalle</span>
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Tracking Info */}
                                    {order.tracking_number && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                <Truck className="h-4 w-4" />
                                                <span>Número de seguimiento:</span>
                                                <span className="font-medium text-gray-900">
                          {order.tracking_number}
                        </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}