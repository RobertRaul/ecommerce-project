'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, ShoppingBag, AlertTriangle, X } from 'lucide-react';
import Layout from '@/components/Layout';
import useCartStore from '@/store/cartStore';
import useAuthStore from '@/store/authStore';
import toast from 'react-hot-toast';

export default function CartPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const { cart, fetchCart, updateQuantity, removeItem, clearCart, isLoading } = useCartStore();
    const [updating, setUpdating] = useState({});
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showClearModal, setShowClearModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    useEffect(() => {
        if (isAuthenticated) {
            fetchCart();
        }
    }, [isAuthenticated, fetchCart]);

    const handleUpdateQuantity = async (itemId, newQuantity) => {
        if (newQuantity < 1) return;

        setUpdating({ ...updating, [itemId]: true });
        await updateQuantity(itemId, newQuantity);
        setUpdating({ ...updating, [itemId]: false });
    };

    const handleRemoveItem = async (itemId) => {
        setItemToDelete(itemId);
        setShowDeleteModal(true);
    };

    const confirmRemoveItem = async () => {
        if (itemToDelete) {
            await removeItem(itemToDelete);
            setShowDeleteModal(false);
            setItemToDelete(null);
        }
    };

    const handleClearCart = () => {
        setShowClearModal(true);
    };

    const confirmClearCart = async () => {
        await clearCart();
        setShowClearModal(false);
    };

    const handleCheckout = () => {
        if (!isAuthenticated) {
            toast.error('Debes iniciar sesión para continuar');
            router.push('/login?redirect=/checkout');
            return;
        }
        router.push('/checkout');
    };

    if (!isAuthenticated) {
        return (
            <Layout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="text-center">
                        <ShoppingCart className="mx-auto h-24 w-24 text-gray-400 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            Inicia sesión para ver tu carrito
                        </h2>
                        <p className="text-gray-600 mb-8">
                            Necesitas tener una cuenta para agregar productos al carrito
                        </p>
                        <div className="flex justify-center space-x-4">
                            <Link
                                href="/login"
                                className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
                            >
                                Iniciar Sesión
                            </Link>
                            <Link
                                href="/registro"
                                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                            >
                                Crear Cuenta
                            </Link>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    if (isLoading) {
        return (
            <Layout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-white rounded-lg shadow-md p-4">
                                    <div className="flex space-x-4">
                                        <div className="bg-gray-300 h-24 w-24 rounded"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="bg-gray-300 h-4 rounded w-3/4"></div>
                                            <div className="bg-gray-300 h-4 rounded w-1/2"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    if (!cart || !cart.items || cart.items.length === 0) {
        return (
            <Layout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="text-center">
                        <ShoppingBag className="mx-auto h-24 w-24 text-gray-400 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            Tu carrito está vacío
                        </h2>
                        <p className="text-gray-600 mb-8">
                            ¡Agrega algunos productos y vuelve aquí para continuar con tu compra!
                        </p>
                        <Link
                            href="/productos"
                            className="inline-flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
                        >
                            <ShoppingCart className="h-5 w-5" />
                            <span>Ir a Comprar</span>
                        </Link>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Carrito de Compras</h1>
                    <button
                        onClick={handleClearCart}
                        className="text-red-600 hover:text-red-700 font-medium flex items-center space-x-2"
                    >
                        <Trash2 className="h-5 w-5" />
                        <span>Vaciar Carrito</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        {cart.items.map((item) => (
                            <div
                                key={item.id}
                                className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition"
                            >
                                <div className="flex space-x-4">
                                    {/* Product Image */}
                                    <Link href={`/productos/${item.product_detail.slug}`}>
                                        <div className="relative w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                            {item.product_detail.primary_image ? (
                                                <Image
                                                    src={item.product_detail.primary_image}
                                                    alt={item.product_detail.name}
                                                    fill
                                                    className="object-cover hover:scale-105 transition-transform"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full">
                                                    <ShoppingCart className="h-8 w-8 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                    </Link>

                                    {/* Product Info */}
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <Link
                                                href={`/productos/${item.product_detail.slug}`}
                                                className="font-semibold text-gray-900 hover:text-purple-600 line-clamp-2"
                                            >
                                                {item.product_detail.name}
                                            </Link>

                                            {item.variant_name && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Variante: {item.variant_name}
                                                </p>
                                            )}

                                            <p className="text-sm text-gray-600 mt-1">
                                                {item.product_detail.brand_name}
                                            </p>

                                            {/* Price */}
                                            <div className="mt-2">
                                                {item.product_detail.is_on_sale ? (
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-lg font-bold text-purple-600">
                                                            S/ {item.price}
                                                        </span>
                                                        <span className="text-sm text-gray-500 line-through">
                                                            S/ {item.product_detail.compare_price}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-lg font-bold text-gray-900">
                                                        S/ {item.price}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Quantity Controls */}
                                        <div className="flex items-center justify-between mt-4">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                                    disabled={item.quantity <= 1 || updating[item.id]}
                                                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </button>
                                                <span className="w-12 text-center font-semibold">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                                    disabled={updating[item.id]}
                                                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                            </div>

                                            <div className="flex items-center space-x-4">
                                                {/* Subtotal */}
                                                <span className="text-lg font-bold text-gray-900">
                                                    S/ {item.total_price}
                                                </span>

                                                {/* Remove Button */}
                                                <button
                                                    onClick={() => handleRemoveItem(item.id)}
                                                    className="text-red-600 hover:text-red-700 p-2"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">
                                Resumen del Pedido
                            </h2>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-gray-700">
                                    <span>Subtotal ({cart.total_items} {cart.total_items === 1 ? 'producto' : 'productos'})</span>
                                    <span className="font-semibold">S/ {cart.subtotal}</span>
                                </div>

                                <div className="flex justify-between text-gray-700">
                                    <span>Envío</span>
                                    <span className="text-sm text-gray-600">
                                        Calculado en el checkout
                                    </span>
                                </div>

                                <div className="border-t border-gray-200 pt-4">
                                    <div className="flex justify-between text-xl font-bold text-gray-900">
                                        <span>Total</span>
                                        <span className="text-purple-600">S/ {cart.subtotal}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleCheckout}
                                className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition flex items-center justify-center space-x-2"
                            >
                                <span>Proceder al Pago</span>
                                <ArrowRight className="h-5 w-5" />
                            </button>

                            <Link
                                href="/productos"
                                className="block text-center text-purple-600 hover:text-purple-700 font-medium mt-4"
                            >
                                Continuar Comprando
                            </Link>

                            {/* Security Badges */}
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                                    <div className="flex items-center space-x-1">
                                        <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                        <span>Compra Segura</span>
                                    </div>
                                </div>
                                <div className="text-center text-xs text-gray-500 mt-2">
                                    Tus datos están protegidos
                                </div>
                            </div>

                            {/* Accepted Payment Methods */}
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <p className="text-sm font-medium text-gray-700 mb-3">
                                    Métodos de pago aceptados:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <div className="px-3 py-2 bg-gray-100 rounded text-sm font-medium text-gray-700">
                                        Yape
                                    </div>
                                    <div className="px-3 py-2 bg-gray-100 rounded text-sm font-medium text-gray-700">
                                        Plin
                                    </div>
                                    <div className="px-3 py-2 bg-gray-100 rounded text-sm font-medium text-gray-700">
                                        Transferencia
                                    </div>
                                    <div className="px-3 py-2 bg-gray-100 rounded text-sm font-medium text-gray-700">
                                        Tarjeta
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Continue Shopping Section */}
                <div className="mt-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-8 text-white text-center">
                    <h3 className="text-2xl font-bold mb-2">
                        ¿Necesitas algo más?
                    </h3>
                    <p className="mb-6 text-purple-100">
                        Explora más productos y aprovecha nuestras ofertas especiales
                    </p>
                    <Link
                        href="/productos"
                        className="inline-block bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
                    >
                        Ver Más Productos
                    </Link>
                </div>
            </div>

            {/* Modal para eliminar item */}
            {showDeleteModal && (
                <div
                    className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => {
                        setShowDeleteModal(false);
                        setItemToDelete(null);
                    }}
                >
                    <div
                        className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl transform transition-all"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start space-x-4 mb-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">
                                    Eliminar producto
                                </h3>
                                <p className="text-gray-600 text-sm">
                                    ¿Estás seguro de que deseas eliminar este producto del carrito?
                                </p>
                            </div>
                        </div>

                        <div className="flex space-x-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setItemToDelete(null);
                                }}
                                className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmRemoveItem}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 shadow-lg hover:shadow-xl transition-all"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para vaciar carrito */}
            {showClearModal && (
                <div
                    className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setShowClearModal(false)}
                >
                    <div
                        className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl transform transition-all"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start space-x-4 mb-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <Trash2 className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">
                                    Vaciar carrito
                                </h3>
                                <p className="text-gray-600 text-sm">
                                    ¿Estás seguro de que deseas eliminar todos los productos del carrito? Esta acción no se puede deshacer.
                                </p>
                            </div>
                        </div>

                        <div className="flex space-x-3 mt-6">
                            <button
                                onClick={() => setShowClearModal(false)}
                                className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmClearCart}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 shadow-lg hover:shadow-xl transition-all"
                            >
                                Vaciar Carrito
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </Layout>
    );
}