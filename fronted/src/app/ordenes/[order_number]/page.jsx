'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
    Package, MapPin, CreditCard, Truck, CheckCircle,
    Clock, Download, Upload, ArrowLeft
} from 'lucide-react';
import Layout from '@/components/Layout';
import useAuthStore from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { order_number } = params;
    const { isAuthenticated } = useAuthStore();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploadingProof, setUploadingProof] = useState(false);
    const [paymentProof, setPaymentProof] = useState(null);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login?redirect=/ordenes');
            return;
        }
        fetchOrder();
    }, [isAuthenticated, order_number]);

    const fetchOrder = async () => {
        try {
            const response = await api.get(`/orders/${order_number}/`);
            setOrder(response.data);
        } catch (error) {
            console.error('Error al cargar orden:', error);
            toast.error('Error al cargar la orden');
        } finally {
            setLoading(false);
        }
    };

    const handleUploadProof = async () => {
        if (!paymentProof) {
            toast.error('Selecciona un archivo');
            return;
        }

        setUploadingProof(true);
        const formData = new FormData();
        formData.append('payment_proof', paymentProof);

        try {
            await api.post(`/orders/${order_number}/upload-payment/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            toast.success('Comprobante subido exitosamente');
            fetchOrder();
            setPaymentProof(null);
        } catch (error) {
            toast.error('Error al subir comprobante');
        } finally {
            setUploadingProof(false);
        }
    };

    const getStatusSteps = () => {
        const steps = [
            { key: 'pending', label: 'Pendiente', icon: Clock },
            { key: 'payment_pending', label: 'Esperando Pago', icon: CreditCard },
            { key: 'payment_verified', label: 'Pago Verificado', icon: CheckCircle },
            { key: 'processing', label: 'Procesando', icon: Package },
            { key: 'shipped', label: 'Enviado', icon: Truck },
            { key: 'delivered', label: 'Entregado', icon: CheckCircle },
        ];

        const currentIndex = steps.findIndex(step => step.key === order?.status);
        return steps.map((step, index) => ({
            ...step,
            completed: index <= currentIndex,
            current: step.key === order?.status,
        }));
    };

    if (loading) {
        return (
            <Layout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
                            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    if (!order) {
        return (
            <Layout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        Orden no encontrada
                    </h2>
                    <Link href="/ordenes" className="text-purple-600 hover:text-purple-700">
                        Volver a mis órdenes
                    </Link>
                </div>
            </Layout>
        );
    }

    const steps = getStatusSteps();

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Button */}
                <Link
                    href="/ordenes"
                    className="inline-flex items-center space-x-2 text-purple-600 hover:text-purple-700 mb-6"
                >
                    <ArrowLeft className="h-5 w-5" />
                    <span>Volver a mis órdenes</span>
                </Link>

                {/* Header */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Orden #{order.order_number}
                            </h1>
                            <p className="text-gray-600">
                                Realizada el {new Date(order.created_at).toLocaleDateString('es-PE', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                            </p>
                        </div>
                        <div className="mt-4 md:mt-0">
              <span className="inline-block px-4 py-2 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">
                {order.status_display}
              </span>
                        </div>
                    </div>
                </div>

                {/* Order Progress */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Estado del Pedido</h2>

                    <div className="relative">
                        {/* Progress Line */}
                        <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200">
                            <div
                                className="h-full bg-purple-600 transition-all duration-500"
                                style={{
                                    width: `${(steps.filter(s => s.completed).length / steps.length) * 100}%`,
                                }}
                            ></div>
                        </div>

                        {/* Steps */}
                        <div className="relative grid grid-cols-6 gap-2">
                            {steps.map((step, index) => {
                                const Icon = step.icon;
                                return (
                                    <div key={step.key} className="flex flex-col items-center">
                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${
                                                step.completed
                                                    ? 'bg-purple-600 text-white'
                                                    : 'bg-gray-200 text-gray-400'
                                            } ${step.current ? 'ring-4 ring-purple-200' : ''}`}
                                        >
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <span
                                            className={`text-xs text-center ${
                                                step.completed ? 'text-gray-900 font-medium' : 'text-gray-500'
                                            }`}
                                        >
                      {step.label}
                    </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Upload Payment Proof */}
                {['yape', 'plin', 'transfer'].includes(order.payment_method) &&
                    order.status === 'payment_pending' &&
                    !order.payment_proof && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                            <div className="flex items-start space-x-3">
                                <Upload className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                                        Sube tu comprobante de pago
                                    </h3>
                                    <p className="text-yellow-800 mb-4">
                                        Para verificar tu pago, sube una captura de pantalla o foto de tu comprobante.
                                    </p>
                                    <div className="flex items-center space-x-4">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setPaymentProof(e.target.files[0])}
                                            className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                                        />
                                        <button
                                            onClick={handleUploadProof}
                                            disabled={!paymentProof || uploadingProof}
                                            className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {uploadingProof ? 'Subiendo...' : 'Subir'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Products */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                Productos ({order.items.length})
                            </h2>
                            <div className="space-y-4">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex space-x-4 pb-4 border-b last:border-0">
                                        <div className="relative w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                            {item.product?.primary_image ? (
                                                <Image
                                                    src={item.product.primary_image}
                                                    alt={item.product_name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full">
                                                    <Package className="h-8 w-8 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900">{item.product_name}</h3>
                                            <p className="text-sm text-gray-600">SKU: {item.product_sku}</p>
                                            <p className="text-sm text-gray-600">
                                                Cantidad: {item.quantity} x S/ {item.price}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900">
                                                S/ {item.total_price}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center space-x-2 mb-4">
                                <MapPin className="h-6 w-6 text-purple-600" />
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Dirección de Envío
                                </h2>
                            </div>
                            <div className="text-gray-700 space-y-1">
                                <p className="font-medium">{order.email}</p>
                                <p>{order.phone}</p>
                                <p>{order.shipping_address}</p>
                                <p>
                                    {order.shipping_city}, {order.shipping_department}
                                </p>
                                {order.shipping_postal_code && <p>{order.shipping_postal_code}</p>}
                            </div>

                            {order.tracking_number && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <p className="text-sm text-gray-600 mb-1">Número de seguimiento:</p>
                                    <p className="font-mono font-semibold text-gray-900">
                                        {order.tracking_number}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                Resumen
                            </h2>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-gray-700">
                                    <span>Subtotal</span>
                                    <span>S/ {order.subtotal}</span>
                                </div>
                                <div className="flex justify-between text-gray-700">
                                    <span>Envío</span>
                                    <span>
                    {order.shipping_cost === '0.00' ? 'GRATIS' : `S/ ${order.shipping_cost}`}
                  </span>
                                </div>
                                {parseFloat(order.discount) > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Descuento</span>
                                        <span>-S/ {order.discount}</span>
                                    </div>
                                )}
                                <div className="border-t border-gray-200 pt-3">
                                    <div className="flex justify-between text-xl font-bold text-gray-900">
                                        <span>Total</span>
                                        <span className="text-purple-600">S/ {order.total}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div className="pt-6 border-t border-gray-200">
                                <div className="flex items-center space-x-2 mb-2">
                                    <CreditCard className="h-5 w-5 text-purple-600" />
                                    <span className="font-semibold text-gray-900">Método de Pago</span>
                                </div>
                                <p className="text-gray-700">{order.payment_method_display}</p>
                            </div>

                            {/* Customer Notes */}
                            {order.customer_notes && (
                                <div className="pt-6 border-t border-gray-200 mt-6">
                                    <h3 className="font-semibold text-gray-900 mb-2">Notas</h3>
                                    <p className="text-gray-700 text-sm">{order.customer_notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}