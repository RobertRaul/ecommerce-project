'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Ticket } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function EditarCuponPage() {
    const router = useRouter();
    const params = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);

    const [formData, setFormData] = useState({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: '',
        minimum_purchase: '0',
        max_discount_amount: '',
        usage_limit: '',
        usage_limit_per_user: '1',
        valid_from: '',
        valid_until: '',
        applicable_to_all: true,
        applicable_products: [],
        applicable_categories: [],
        is_active: true
    });

    useEffect(() => {
        fetchCoupon();
        fetchProducts();
        fetchCategories();
    }, [params.id]);

    const fetchCoupon = async () => {
        try {
            const response = await api.get(`/coupons/${params.id}/`);
            const coupon = response.data;

            // Convertir fechas al formato datetime-local
            const formatDateTime = (dateString) => {
                const date = new Date(dateString);
                return date.toISOString().slice(0, 16);
            };

            setFormData({
                code: coupon.code || '',
                description: coupon.description || '',
                discount_type: coupon.discount_type || 'percentage',
                discount_value: coupon.discount_value || '',
                minimum_purchase: coupon.minimum_purchase || '0',
                max_discount_amount: coupon.max_discount_amount || '',
                usage_limit: coupon.usage_limit || '',
                usage_limit_per_user: coupon.usage_limit_per_user || '1',
                valid_from: formatDateTime(coupon.valid_from),
                valid_until: formatDateTime(coupon.valid_until),
                applicable_to_all: coupon.applicable_to_all,
                applicable_products: coupon.applicable_products || [],
                applicable_categories: coupon.applicable_categories || [],
                is_active: coupon.is_active
            });
        } catch (error) {
            console.error('Error al cargar cupón:', error);
            toast.error('Error al cargar cupón');
            router.push('/admin/cupones');
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products/');
            setProducts(response.data.results || []);
        } catch (error) {
            console.error('Error al cargar productos:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await api.get('/categories/');
            setCategories(response.data.results || []);
        } catch (error) {
            console.error('Error al cargar categorías:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleMultiSelect = (e, field) => {
        const options = e.target.options;
        const selected = [];
        for (let i = 0; i < options.length; i++) {
            if (options[i].selected) {
                selected.push(parseInt(options[i].value));
            }
        }
        setFormData(prev => ({ ...prev, [field]: selected }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const data = {
                code: formData.code.toUpperCase(),
                description: formData.description,
                discount_type: formData.discount_type,
                discount_value: parseFloat(formData.discount_value),
                minimum_purchase: parseFloat(formData.minimum_purchase) || 0,
                max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
                usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
                usage_limit_per_user: parseInt(formData.usage_limit_per_user),
                valid_from: formData.valid_from,
                valid_until: formData.valid_until,
                applicable_to_all: formData.applicable_to_all,
                applicable_products: formData.applicable_to_all ? [] : formData.applicable_products,
                applicable_categories: formData.applicable_to_all ? [] : formData.applicable_categories,
                is_active: formData.is_active
            };

            await api.put(`/coupons/${params.id}/`, data);
            toast.success('Cupón actualizado exitosamente');
            router.push('/admin/cupones');
        } catch (error) {
            console.error('Error:', error);
            toast.error(error.response?.data?.detail || 'Error al actualizar cupón');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Link href="/admin/cupones" className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver a Cupones
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                        <Ticket className="h-8 w-8 text-purple-600" />
                        <span>Editar Cupón</span>
                    </h1>
                    <p className="text-gray-600 mt-2">Código: {formData.code}</p>
                </div>

                {/* Formulario */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">

                    {/* Información Básica */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Código del Cupón *</label>
                                <input
                                    type="text"
                                    name="code"
                                    value={formData.code}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 uppercase"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                <div className="flex items-center space-x-2 h-11">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={formData.is_active}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-purple-600 rounded"
                                    />
                                    <span className="text-sm text-gray-700">Cupón activo</span>
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Descuento */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuración de Descuento</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Descuento *</label>
                                <select
                                    name="discount_type"
                                    value={formData.discount_type}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="percentage">Porcentaje (%)</option>
                                    <option value="fixed">Monto Fijo (S/)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Valor del Descuento *</label>
                                <input
                                    type="number"
                                    name="discount_value"
                                    value={formData.discount_value}
                                    onChange={handleChange}
                                    step="0.01"
                                    min="0"
                                    required
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Compra Mínima (S/)</label>
                                <input
                                    type="number"
                                    name="minimum_purchase"
                                    value={formData.minimum_purchase}
                                    onChange={handleChange}
                                    step="0.01"
                                    min="0"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descuento Máximo (S/)</label>
                                <input
                                    type="number"
                                    name="max_discount_amount"
                                    value={formData.max_discount_amount}
                                    onChange={handleChange}
                                    step="0.01"
                                    min="0"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Límites */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Límites de Uso</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Límite Total</label>
                                <input
                                    type="number"
                                    name="usage_limit"
                                    value={formData.usage_limit}
                                    onChange={handleChange}
                                    min="1"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">Dejar vacío para uso ilimitado</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Límite por Usuario *</label>
                                <input
                                    type="number"
                                    name="usage_limit_per_user"
                                    value={formData.usage_limit_per_user}
                                    onChange={handleChange}
                                    min="1"
                                    required
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Vigencia */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Período de Vigencia</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Válido Desde *</label>
                                <input
                                    type="datetime-local"
                                    name="valid_from"
                                    value={formData.valid_from}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Válido Hasta *</label>
                                <input
                                    type="datetime-local"
                                    name="valid_until"
                                    value={formData.valid_until}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Aplicabilidad */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Aplicabilidad</h2>
                        <label className="flex items-center space-x-2 mb-4">
                            <input
                                type="checkbox"
                                name="applicable_to_all"
                                checked={formData.applicable_to_all}
                                onChange={handleChange}
                                className="w-4 h-4 text-purple-600 rounded"
                            />
                            <span className="text-sm font-medium text-gray-700">Aplicable a todos los productos</span>
                        </label>

                        {!formData.applicable_to_all && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Productos Específicos</label>
                                    <select
                                        multiple
                                        size="6"
                                        value={formData.applicable_products}
                                        onChange={(e) => handleMultiSelect(e, 'applicable_products')}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    >
                                        {products.map(product => (
                                            <option key={product.id} value={product.id}>
                                                {product.name}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">Mantén Ctrl/Cmd para seleccionar múltiples</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Categorías</label>
                                    <select
                                        multiple
                                        size="6"
                                        value={formData.applicable_categories}
                                        onChange={(e) => handleMultiSelect(e, 'applicable_categories')}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    >
                                        {categories.map(category => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">Mantén Ctrl/Cmd para seleccionar múltiples</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Botones */}
                    <div className="flex items-center justify-end space-x-4 pt-4 border-t">
                        <Link
                            href="/admin/cupones"
                            className="px-6 py-2.5 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
                        >
                            Cancelar
                        </Link>
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="inline-flex items-center space-x-2 bg-purple-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-purple-700 shadow-lg transition disabled:opacity-50"
                        >
                            {saving ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    <span>Guardando...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="h-5 w-5" />
                                    <span>Guardar Cambios</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}