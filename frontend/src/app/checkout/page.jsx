'use client';

import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { CreditCard, Truck, MapPin, Phone, Mail, Lock, Tag, X } from 'lucide-react';
import Layout from '@/components/Layout';
import useCartStore from '@/store/cartStore';
import useAuthStore from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';

// Memoized Cart Item Component for better performance
const CartItemSummary = memo(({ item }) => (
    <div className="flex space-x-3">
        <div className="relative w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
            {item.product_detail.primary_image ? (
                <Image
                    src={item.product_detail.primary_image}
                    alt={item.product_detail.name}
                    fill
                    className="object-cover"
                />
            ) : (
                <div className="flex items-center justify-center h-full">
                    <MapPin className="h-6 w-6 text-gray-400" />
                </div>
            )}
            <div className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                {item.quantity}
            </div>
        </div>
        <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                {item.product_detail.name}
            </h3>
            {item.variant_name && (
                <p className="text-xs text-gray-600">{item.variant_name}</p>
            )}
            <p className="text-sm font-semibold text-gray-900 mt-1">
                S/ {item.total_price}
            </p>
        </div>
    </div>
));

CartItemSummary.displayName = 'CartItemSummary';

export default function CheckoutPage() {
    const router = useRouter();
    const { cart, fetchCart } = useCartStore();
    const { user, isAuthenticated } = useAuthStore();

    const [loading, setLoading] = useState(false);
    const [shippingZones, setShippingZones] = useState([]);
    const [shippingCost, setShippingCost] = useState(0);
    const [paymentMethods, setPaymentMethods] = useState([]);

    // Estado para cupones
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponLoading, setCouponLoading] = useState(false);
    const [discount, setDiscount] = useState(0);

    const [formData, setFormData] = useState({
        email: user?.email || '',
        phone: user?.phone || '',
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        shipping_address: user?.address || '',
        shipping_city: user?.city || '',
        shipping_department: user?.department || '',
        shipping_postal_code: user?.postal_code || '',
        payment_method: 'yape',
        customer_notes: '',
    });
    const [errors, setErrors] = useState({});

    // Fetch shipping zones (memoized)
    const fetchShippingZones = useCallback(async () => {
        try {
            const response = await api.get('/shipping-zones/');
            setShippingZones(response.data);
        } catch (error) {
            console.error('Error al cargar zonas de envío:', error);
        }
    }, []);

    // Fetch payment methods (memoized)
    const fetchPaymentMethods = useCallback(async () => {
        try {
            const response = await api.get('/payment-methods/');
            const methods = Array.isArray(response.data) ? response.data : (response.data?.results || []);
            setPaymentMethods(methods);

            // Si hay métodos y el método actual no está en la lista, seleccionar el primero
            if (methods.length > 0) {
                const currentMethodExists = methods.some(m => m.value === formData.payment_method);
                if (!currentMethodExists) {
                    setFormData(prev => ({ ...prev, payment_method: methods[0].value }));
                }
            }
        } catch (error) {
            console.error('Error al cargar métodos de pago:', error);
            setPaymentMethods([]);
        }
    }, [formData.payment_method]);

    // Calculate shipping cost (memoized)
    const calculateShipping = useCallback(async () => {
        if (!cart?.subtotal || !formData.shipping_department) return;

        try {
            const response = await api.post('/calculate-shipping/', {
                department: formData.shipping_department,
                subtotal: cart.subtotal,
            });
            setShippingCost(response.data.cost);

            if (response.data.free_shipping) {
                toast.success('¡Envío gratis aplicado!');
            }
        } catch (error) {
            console.error('Error al calcular envío:', error);
        }
    }, [cart?.subtotal, formData.shipping_department]);

    // Apply coupon (memoized)
    const handleApplyCoupon = useCallback(async () => {
        if (!couponCode.trim()) {
            toast.error('Ingresa un código de cupón');
            return;
        }

        if (!cart?.subtotal) {
            toast.error('Error: Carrito no disponible');
            return;
        }

        setCouponLoading(true);
        try {
            const response = await api.post('/coupons/validate/', {
                code: couponCode.toUpperCase(),
                subtotal: parseFloat(cart.subtotal)
            });

            if (response.data.valid) {
                setAppliedCoupon(response.data.coupon);
                setDiscount(response.data.coupon.discount_amount);
                toast.success('¡Cupón aplicado exitosamente!');
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Cupón inválido';
            toast.error(errorMsg);
            console.error('Error:', error);
        } finally {
            setCouponLoading(false);
        }
    }, [couponCode, cart?.subtotal]);

    // Remove coupon (memoized)
    const handleRemoveCoupon = useCallback(() => {
        setAppliedCoupon(null);
        setDiscount(0);
        setCouponCode('');
        toast.success('Cupón removido');
    }, []);

    // Handle form field changes (memoized)
    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));

        // Clear error for this field if it exists
        setErrors(prev => {
            if (prev[name]) {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            }
            return prev;
        });
    }, []);

    // Validate form (memoized)
    const validateForm = useCallback(() => {
        const newErrors = {};

        if (!formData.email) newErrors.email = 'El correo es requerido';
        if (!formData.phone) newErrors.phone = 'El teléfono es requerido';
        if (!formData.first_name) newErrors.first_name = 'El nombre es requerido';
        if (!formData.last_name) newErrors.last_name = 'El apellido es requerido';
        if (!formData.shipping_address) newErrors.shipping_address = 'La dirección es requerida';
        if (!formData.shipping_city) newErrors.shipping_city = 'La ciudad es requerida';
        if (!formData.shipping_department) newErrors.shipping_department = 'El departamento es requerido';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login?redirect=/checkout');
            return;
        }
        fetchCart();
        fetchShippingZones();
        fetchPaymentMethods();
    }, [isAuthenticated, fetchCart, fetchShippingZones, fetchPaymentMethods, router]);

    useEffect(() => {
        calculateShipping();
    }, [calculateShipping]);

    // Submit order (memoized)
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Por favor completa todos los campos requeridos');
            return;
        }

        if (!cart || cart.items.length === 0) {
            toast.error('Tu carrito está vacío');
            return;
        }

        setLoading(true);

        try {
            const orderData = {
                ...formData,
                coupon_code: appliedCoupon?.code || '',
                discount_amount: discount || 0,
            };

            const response = await api.post('/orders/create_order/', orderData);

            toast.success('¡Orden creada exitosamente!');
            router.push(`/ordenes/${response.data.order.order_number}`);
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Error al crear la orden';
            toast.error(errorMsg);
            console.error('Error:', error.response?.data);
        } finally {
            setLoading(false);
        }
    }, [validateForm, cart, formData, appliedCoupon, discount, router]);

    // Calculate totals (memoized for performance)
    const { subtotal, total } = useMemo(() => {
        const sub = cart?.subtotal ? parseFloat(cart.subtotal) : 0;
        const ship = parseFloat(shippingCost) || 0;
        const disc = parseFloat(discount) || 0;
        const tot = sub - disc + ship;

        return {
            subtotal: sub,
            total: Math.max(0, tot), // Ensure total is never negative
        };
    }, [cart?.subtotal, shippingCost, discount]);

    // Early return for empty cart
    if (!cart || cart.items.length === 0) {
        return (
            <Layout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        Tu carrito está vacío
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Agrega productos antes de proceder al checkout
                    </p>
                    <button
                        onClick={() => router.push('/productos')}
                        className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700"
                    >
                        Ir a Comprar
                    </button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Finalizar Compra</h1>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column - Forms */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Contact Information */}
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center space-x-2 mb-4">
                                    <Mail className="h-6 w-6 text-purple-600" />
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        Información de Contacto
                                    </h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nombre *
                                        </label>
                                        <input
                                            type="text"
                                            name="first_name"
                                            required
                                            value={formData.first_name}
                                            onChange={handleChange}
                                            className={`w-full px-3 py-2 border ${
                                                errors.first_name ? 'border-red-500' : 'border-gray-300'
                                            } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500`}
                                        />
                                        {errors.first_name && (
                                            <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Apellido *
                                        </label>
                                        <input
                                            type="text"
                                            name="last_name"
                                            required
                                            value={formData.last_name}
                                            onChange={handleChange}
                                            className={`w-full px-3 py-2 border ${
                                                errors.last_name ? 'border-red-500' : 'border-gray-300'
                                            } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500`}
                                        />
                                        {errors.last_name && (
                                            <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Correo Electrónico *
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                            className={`w-full px-3 py-2 border ${
                                                errors.email ? 'border-red-500' : 'border-gray-300'
                                            } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500`}
                                        />
                                        {errors.email && (
                                            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Teléfono *
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            required
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className={`w-full px-3 py-2 border ${
                                                errors.phone ? 'border-red-500' : 'border-gray-300'
                                            } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500`}
                                            placeholder="999 999 999"
                                        />
                                        {errors.phone && (
                                            <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Shipping Address */}
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center space-x-2 mb-4">
                                    <Truck className="h-6 w-6 text-purple-600" />
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        Dirección de Envío
                                    </h2>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Dirección Completa *
                                        </label>
                                        <input
                                            type="text"
                                            name="shipping_address"
                                            required
                                            value={formData.shipping_address}
                                            onChange={handleChange}
                                            className={`w-full px-3 py-2 border ${
                                                errors.shipping_address ? 'border-red-500' : 'border-gray-300'
                                            } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500`}
                                            placeholder="Av. Principal 123, Dpto 456"
                                        />
                                        {errors.shipping_address && (
                                            <p className="mt-1 text-sm text-red-600">{errors.shipping_address}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Departamento *
                                            </label>
                                            <select
                                                name="shipping_department"
                                                required
                                                value={formData.shipping_department}
                                                onChange={handleChange}
                                                className={`w-full px-3 py-2 border ${
                                                    errors.shipping_department ? 'border-red-500' : 'border-gray-300'
                                                } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500`}
                                            >
                                                <option value="">Seleccionar</option>
                                                <option value="Lima">Lima</option>
                                                <option value="Arequipa">Arequipa</option>
                                                <option value="Cusco">Cusco</option>
                                                <option value="Trujillo">Trujillo</option>
                                                <option value="Chiclayo">Chiclayo</option>
                                                <option value="Piura">Piura</option>
                                                <option value="Iquitos">Iquitos</option>
                                                <option value="Ayacucho">Ayacucho</option>
                                                <option value="Huancayo">Huancayo</option>
                                                <option value="Cajamarca">Cajamarca</option>
                                            </select>
                                            {errors.shipping_department && (
                                                <p className="mt-1 text-sm text-red-600">{errors.shipping_department}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Ciudad *
                                            </label>
                                            <input
                                                type="text"
                                                name="shipping_city"
                                                required
                                                value={formData.shipping_city}
                                                onChange={handleChange}
                                                className={`w-full px-3 py-2 border ${
                                                    errors.shipping_city ? 'border-red-500' : 'border-gray-300'
                                                } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500`}
                                            />
                                            {errors.shipping_city && (
                                                <p className="mt-1 text-sm text-red-600">{errors.shipping_city}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Código Postal
                                            </label>
                                            <input
                                                type="text"
                                                name="shipping_postal_code"
                                                value={formData.shipping_postal_code}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center space-x-2 mb-4">
                                    <CreditCard className="h-6 w-6 text-purple-600" />
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        Método de Pago
                                    </h2>
                                </div>

                                <div className="space-y-3">
                                    {paymentMethods.length > 0 ? (
                                        paymentMethods.map((method) => {
                                            const icon = method.icon || '💳';

                                            return (
                                                <label
                                                    key={method.value}
                                                    className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                                                        formData.payment_method === method.value
                                                            ? 'border-purple-600 bg-purple-50'
                                                            : 'border-gray-200 hover:border-purple-300'
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="payment_method"
                                                        value={method.value}
                                                        checked={formData.payment_method === method.value}
                                                        onChange={handleChange}
                                                        className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                                                    />
                                                    <span className="text-2xl">{icon}</span>
                                                    <div className="flex-1">
                                                        <span className="font-medium text-gray-900">{method.label}</span>
                                                        {method.description && (
                                                            <p className="text-xs text-gray-500 mt-1">{method.description}</p>
                                                        )}
                                                    </div>
                                                </label>
                                            );
                                        })
                                    ) : (
                                        // Fallback if API fails
                                        <div className="text-center py-8 text-gray-500">
                                            <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                                            <p>No hay métodos de pago disponibles</p>
                                        </div>
                                    )}
                                </div>

                                {paymentMethods.find(m => m.value === formData.payment_method && m.requires_proof) && (
                                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-sm text-blue-800">
                                            <Lock className="inline h-4 w-4 mr-1" />
                                            Después de crear tu orden, te proporcionaremos los datos para realizar el pago.
                                            Deberás subir tu comprobante de pago para que podamos verificarlo.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Order Notes */}
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                    Notas del Pedido (Opcional)
                                </h2>
                                <textarea
                                    name="customer_notes"
                                    value={formData.customer_notes}
                                    onChange={handleChange}
                                    rows="4"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="¿Alguna instrucción especial para la entrega?"
                                ></textarea>
                            </div>
                        </div>

                        {/* Right Column - Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                    Resumen del Pedido
                                </h2>

                                {/* Products */}
                                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                                    {cart.items.map((item) => (
                                        <CartItemSummary key={item.id} item={item} />
                                    ))}
                                </div>

                                {/* Coupon Section */}
                                <div className="mb-4 pb-4 border-b border-gray-200">
                                    {!appliedCoupon ? (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                ¿Tienes un cupón?
                                            </label>
                                            <div className="flex space-x-2">
                                                <input
                                                    type="text"
                                                    value={couponCode}
                                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                    placeholder="CÓDIGO"
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleApplyCoupon}
                                                    disabled={couponLoading}
                                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 transition"
                                                >
                                                    {couponLoading ? '...' : 'Aplicar'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <Tag className="h-5 w-5 text-green-600" />
                                                    <div>
                                                        <p className="text-sm font-semibold text-green-900">
                                                            {appliedCoupon.code}
                                                        </p>
                                                        {appliedCoupon.description && (
                                                            <p className="text-xs text-green-700">
                                                                {appliedCoupon.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveCoupon}
                                                    className="text-green-600 hover:text-green-800"
                                                >
                                                    <X className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Totals */}
                                <div className="border-t border-gray-200 pt-4 space-y-3">
                                    <div className="flex justify-between text-gray-700">
                                        <span>Subtotal</span>
                                        <span className="font-semibold">S/ {subtotal.toFixed(2)}</span>
                                    </div>

                                    {discount > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Descuento</span>
                                            <span className="font-semibold">- S/ {discount.toFixed(2)}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between text-gray-700">
                                        <span>Envío</span>
                                        {shippingCost === 0 && formData.shipping_department ? (
                                            <span className="font-semibold text-green-600">GRATIS</span>
                                        ) : (
                                            <span className="font-semibold">
                                                {shippingCost > 0 ? `S/ ${shippingCost.toFixed(2)}` : 'Por calcular'}
                                            </span>
                                        )}
                                    </div>

                                    <div className="border-t border-gray-200 pt-3">
                                        <div className="flex justify-between text-xl font-bold text-gray-900">
                                            <span>Total</span>
                                            <span className="text-purple-600">
                                                S/ {total.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full mt-6 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                    {loading ? 'Procesando...' : 'Realizar Pedido'}
                                </button>

                                {/* Security */}
                                <div className="mt-4 flex items-center justify-center text-sm text-gray-600">
                                    <Lock className="h-4 w-4 mr-1" />
                                    <span>Transacción segura y encriptada</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </Layout>
    );
}