'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Ticket } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function CrearCuponPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
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
        fetchProducts();
        fetchCategories();
    }, []);

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
        setLoading(true);

        try {
            // Preparar datos
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

            await api.post('/coupons/', data);
            toast.success('Cupón creado exitosamente');
            router.push('/admin/cupones');
        } catch (error) {
            console.error('Error:', error);
            toast.error(error.response?.data?.detail || 'Error al crear cupón');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Link
                        href="/admin/cupones"
                        className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver a Cupones
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                        <Ticket className="h-8 w-8 text-purple-600" />
                        <span>Crear Cupón</span>
                    </h1>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">

                    {/* Información Básica */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Código del Cupón *
                                </label>
                                <input
                                    type="text"
                                    name="code"
                                    value={formData.code}
                                    onChange={handleChange}
                                    placeholder="DESCUENTO10"
                                    required
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase"
                                />
                                <p className="text-xs text-gray-500 mt-1">El código se convertirá a mayúsculas</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Estado
                                </label>
                                <div className="flex items-center space-x-2 h-11">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={formData.is_active}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                    />
                                    <span className="text-sm text-gray-700">Cupón activo</span>
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descripción
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="Descripción del cupón..."
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Descuento */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuración de Descuento</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo de Descuento *
                                </label>
                                <select
                                    name="discount_type"
                                    value={formData.discount_type}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value="percentage">Porcentaje (%)</option>
                                    <option value="fixed">Monto Fijo (S/)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Valor del Descuento *
                                </label>
                                <input
                                    type="number"
                                    name="discount_value"
                                    value={formData.discount_value}
                                    onChange={handleChange}
                                    placeholder={formData.discount_type === 'percentage' ? '10' : '50.00'}
                                    step="0.01"
                                    min="0"
                                    required
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {formData.discount_type === 'percentage' ? 'Porcentaje de descuento (ej: 10)' : 'Monto en soles (ej: 50.00)'}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Compra Mínima (S/)
                                </label>
                                <input
                                    type="number"
                                    name="minimum_purchase"
                                    value={formData.minimum_purchase}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descuento Máximo (S/)
                                </label>
                                <input
                                    type="number"
                                    name="max_discount_amount"
                                    value={formData.max_discount_amount}
                                    onChange={handleChange}
                                    placeholder="Opcional"
                                    step="0.01"
                                    min="0"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                                <p className="text-xs text-gray-500 mt-1">Solo para descuentos porcentuales</p>
                            </div>
                        </div>
                    </div>

                    {/* Límites de Uso */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Límites de Uso</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Límite Total de Usos
                                </label>
                                <input
                                    type="number"
                                    name="usage_limit"
                                    value={formData.usage_limit}
                                    onChange={handleChange}
                                    placeholder="Ilimitado"
                                    min="1"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                                <p className="text-xs text-gray-500 mt-1">Dejar vacío para uso ilimitado</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Límite por Usuario *
                                </label>
                                <input
                                    type="number"
                                    name="usage_limit_per_user"
                                    value={formData.usage_limit_per_user}
                                    onChange={handleChange}
                                    min="1"
                                    required
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Vigencia */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Período de Vigencia</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Válido Desde *
                                </label>
                                <input
                                    type="datetime-local"
                                    name="valid_from"
                                    value={formData.valid_from}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Válido Hasta *
                                </label>
                                <input
                                    type="datetime-local"
                                    name="valid_until"
                                    value={formData.valid_until}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Aplicabilidad */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Aplicabilidad</h2>

                        <div className="mb-4">
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    name="applicable_to_all"
                                    checked={formData.applicable_to_all}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Aplicable a todos los productos</span>
                            </label>
                        </div>

                        {!formData.applicable_to_all && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Productos Específicos
                                    </label>
                                    <select
                                        multiple
                                        size="6"
                                        onChange={(e) => handleMultiSelect(e, 'applicable_products')}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Categorías
                                    </label>
                                    <select
                                        multiple
                                        size="6"
                                        onChange={(e) => handleMultiSelect(e, 'applicable_categories')}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center space-x-2 bg-purple-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-purple-700 shadow-lg transition disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    <span>Creando...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="h-5 w-5" />
                                    <span>Crear Cupón</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}