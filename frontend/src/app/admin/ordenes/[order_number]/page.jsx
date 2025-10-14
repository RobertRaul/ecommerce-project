'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
    ArrowLeft, Package, User, MapPin, CreditCard,
    Truck, Clock, CheckCircle, XCircle, Download,
    Edit, Save, AlertCircle
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { order_number } = params;

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [editingStatus, setEditingStatus] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [newPaymentStatus, setNewPaymentStatus] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [adminNotes, setAdminNotes] = useState('');

    useEffect(() => {
        if (order_number) {
            fetchOrder();
        }
    }, [order_number]);

    const fetchOrder = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/orders/${order_number}/`);
            setOrder(response.data);
            setNewStatus(response.data.status);
            setNewPaymentStatus(response.data.payment_status || 'pending');
            setTrackingNumber(response.data.tracking_number || '');
            setAdminNotes(response.data.admin_notes || '');
        } catch (error) {
            console.error('Error al cargar orden:', error);
            toast.error('Error al cargar la orden');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async () => {
        setUpdating(true);
        try {
            await api.patch(`/orders/${order_number}/`, {
                status: newStatus,
                payment_status: newPaymentStatus,
                tracking_number: trackingNumber,
                admin_notes: adminNotes,
            });
            toast.success('Estado actualizado exitosamente');
            setEditingStatus(false);
            fetchOrder();
        } catch (error) {
            console.error('Error al actualizar estado:', error);
            toast.error('Error al actualizar el estado');
        } finally {
            setUpdating(false);
        }
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

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
            </AdminLayout>
        );
    }

    if (!order) {
        return (
            <AdminLayout>
                <div className="text-center py-12">
                    <h2 className="text-2xl font-bold text-gray-900">Orden no encontrada</h2>
                    <Link href="/admin/ordenes" className="text-purple-600 hover:text-purple-700 mt-4 inline-block">
                        Volver a órdenes
                    </Link>
                </div>
            </AdminLayout>
        );
    }

    const statusConfig = getStatusConfig(order.status);
    const StatusIcon = statusConfig.icon;

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link
                            href="/admin/ordenes"
                            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            <span>Volver a órdenes</span>
                        </Link>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => window.print()}
                            className="inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                        >
                            <Download className="h-5 w-5" />
                            <span>Imprimir</span>
                        </button>
                    </div>
                </div>

                {/* Order Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Orden #{order.order_number}
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Realizada el {new Date(order.created_at).toLocaleString('es-PE', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>
                        <div className="text-right">
                            <span className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-semibold ${statusConfig.color}`}>
                                <StatusIcon className="h-5 w-5" />
                                <span>{statusConfig.label}</span>
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Items */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-lg font-bold text-gray-900">
                                    Productos ({order.items?.length || 0})
                                </h2>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    {order.items?.map((item, index) => (
                                        <div key={index} className="flex items-center space-x-4 pb-4 border-b border-gray-200 last:border-0">
                                            <div className="relative w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                                {item.product?.primary_image ? (
                                                    <Image
                                                        src={item.product.primary_image}
                                                        alt={item.product_name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full">
                                                        <Package className="h-6 w-6 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-medium text-gray-900">{item.product_name}</h3>
                                                <p className="text-sm text-gray-500">SKU: {item.product_sku}</p>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Cantidad: {item.quantity} × S/ {parseFloat(item.price).toFixed(2)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-gray-900">
                                                    S/ {(parseFloat(item.price) * item.quantity).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Payment Info */}
                        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                                <CreditCard className="h-5 w-5" />
                                <span>Información de Pago</span>
                            </h2>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Método de pago:</span>
                                    <span className="font-medium text-gray-900 capitalize">{order.payment_method}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Estado del pago:</span>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                                        order.payment_status === 'verified' 
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {order.payment_status === 'verified' ? 'Verificado' : 'Pendiente'}
                                    </span>
                                </div>
                                {order.payment_proof && (
                                    <div className="pt-3 border-t border-gray-200">
                                        <p className="text-sm text-gray-600 mb-2">Comprobante de pago:</p>
                                        <a
                                            href={order.payment_proof}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                                        >
                                            Ver comprobante →
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Shipping Info */}
                        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                                <Truck className="h-5 w-5" />
                                <span>Información de Envío</span>
                            </h2>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Dirección:</p>
                                    <p className="text-gray-900">{order.shipping_address}</p>
                                    <p className="text-gray-600">
                                        {order.shipping_city}, {order.shipping_department}
                                    </p>
                                    {order.shipping_postal_code && (
                                        <p className="text-gray-600">CP: {order.shipping_postal_code}</p>
                                    )}
                                </div>
                                {order.tracking_number && (
                                    <div className="pt-3 border-t border-gray-200">
                                        <p className="text-sm font-medium text-gray-700">Número de seguimiento:</p>
                                        <p className="text-gray-900 font-mono">{order.tracking_number}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Customer Info */}
                        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                                <User className="h-5 w-5" />
                                <span>Cliente</span>
                            </h2>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-600">Email:</p>
                                    <p className="text-gray-900 font-medium">{order.email}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Teléfono:</p>
                                    <p className="text-gray-900 font-medium">{order.phone}</p>
                                </div>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Resumen</h2>
                            <div className="space-y-3">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal:</span>
                                    <span className="font-medium">S/ {parseFloat(order.subtotal).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Envío:</span>
                                    <span className="font-medium">S/ {parseFloat(order.shipping_cost).toFixed(2)}</span>
                                </div>
                                {parseFloat(order.tax) > 0 && (
                                    <div className="flex justify-between text-gray-600">
                                        <span>Impuestos:</span>
                                        <span className="font-medium">S/ {parseFloat(order.tax).toFixed(2)}</span>
                                    </div>
                                )}
                                {parseFloat(order.discount) > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Descuento:</span>
                                        <span className="font-medium">-S/ {parseFloat(order.discount).toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="pt-3 border-t-2 border-gray-300">
                                    <div className="flex justify-between">
                                        <span className="text-lg font-bold text-gray-900">Total:</span>
                                        <span className="text-lg font-bold text-gray-900">
                                            S/ {parseFloat(order.total).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Update Status */}
                        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-gray-900">Actualizar Estado</h2>
                                {!editingStatus && (
                                    <button
                                        onClick={() => setEditingStatus(true)}
                                        className="text-purple-600 hover:text-purple-700"
                                    >
                                        <Edit className="h-5 w-5" />
                                    </button>
                                )}
                            </div>

                            {editingStatus ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Estado de la orden
                                        </label>
                                        <select
                                            value={newStatus}
                                            onChange={(e) => setNewStatus(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        >
                                            <option value="pending">Pendiente</option>
                                            <option value="payment_pending">Esperando Pago</option>
                                            <option value="payment_verified">Pago Verificado</option>
                                            <option value="processing">Procesando</option>
                                            <option value="shipped">Enviado</option>
                                            <option value="delivered">Entregado</option>
                                            <option value="cancelled">Cancelado</option>
                                            <option value="refunded">Reembolsado</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Estado del pago
                                        </label>
                                        <select
                                            value={newPaymentStatus}
                                            onChange={(e) => setNewPaymentStatus(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        >
                                            <option value="pending">Pendiente</option>
                                            <option value="verified">Verificado</option>
                                            <option value="rejected">Rechazado</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Número de seguimiento
                                        </label>
                                        <input
                                            type="text"
                                            value={trackingNumber}
                                            onChange={(e) => setTrackingNumber(e.target.value)}
                                            placeholder="Ej: 1234567890"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Notas administrativas
                                        </label>
                                        <textarea
                                            value={adminNotes}
                                            onChange={(e) => setAdminNotes(e.target.value)}
                                            rows={3}
                                            placeholder="Notas internas sobre la orden..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                        />
                                    </div>

                                    <div className="flex space-x-2">
                                        <button
                                            onClick={handleUpdateStatus}
                                            disabled={updating}
                                            className="flex-1 inline-flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50"
                                        >
                                            <Save className="h-4 w-4" />
                                            <span>{updating ? 'Guardando...' : 'Guardar'}</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditingStatus(false);
                                                setNewStatus(order.status);
                                                setNewPaymentStatus(order.payment_status || 'pending');
                                                setTrackingNumber(order.tracking_number || '');
                                                setAdminNotes(order.admin_notes || '');
                                            }}
                                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-600">Estado actual:</p>
                                        <p className="font-medium text-gray-900">{statusConfig.label}</p>
                                    </div>
                                    {order.tracking_number && (
                                        <div>
                                            <p className="text-sm text-gray-600">Tracking:</p>
                                            <p className="font-mono text-sm text-gray-900">{order.tracking_number}</p>
                                        </div>
                                    )}
                                    {order.admin_notes && (
                                        <div>
                                            <p className="text-sm text-gray-600">Notas:</p>
                                            <p className="text-sm text-gray-900">{order.admin_notes}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Customer Notes */}
                        {order.customer_notes && (
                            <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
                                <h3 className="text-sm font-semibold text-yellow-900 mb-2">
                                    Notas del Cliente
                                </h3>
                                <p className="text-sm text-yellow-800">{order.customer_notes}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
