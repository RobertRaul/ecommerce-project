'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { X, Upload, AlertCircle, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ProductForm({ 
    onSubmit, 
    categories = [], 
    brands = [], 
    loading = false,
    initialData = null,
    isEdit = false
}) {
    const router = useRouter();
    
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        compare_price: '',
        cost: '',
        sku: '',
        barcode: '',
        stock: '',
        weight: '',
        category: '',
        brand: '',
        tags: '',
        is_active: true,
        is_featured: false,
        is_on_sale: false,
        meta_title: '',
        meta_description: '',
        meta_keywords: '',
    });

    const [images, setImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                description: initialData.description || '',
                price: initialData.price || '',
                compare_price: initialData.compare_price || '',
                cost: initialData.cost || '',
                sku: initialData.sku || '',
                barcode: initialData.barcode || '',
                stock: initialData.stock || '',
                weight: initialData.weight || '',
                category: initialData.category || '',
                brand: initialData.brand || '',
                tags: Array.isArray(initialData.tags) ? initialData.tags.join(', ') : '',
                is_active: initialData.is_active ?? true,
                is_featured: initialData.is_featured ?? false,
                is_on_sale: initialData.is_on_sale ?? false,
                meta_title: initialData.meta_title || '',
                meta_description: initialData.meta_description || '',
                meta_keywords: initialData.meta_keywords || '',
            });

            // Si hay imágenes existentes, mostrar previews
            if (initialData.images && initialData.images.length > 0) {
                setImagePreviews(initialData.images.map(img => img.image));
            }
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Limpiar error del campo
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        
        if (files.length === 0) return;

        // Validar tamaño y tipo
        const validFiles = files.filter(file => {
            const isValidType = file.type.startsWith('image/');
            const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
            
            if (!isValidType) {
                setErrors(prev => ({ ...prev, images: 'Solo se permiten archivos de imagen' }));
                return false;
            }
            if (!isValidSize) {
                setErrors(prev => ({ ...prev, images: 'Las imágenes deben pesar menos de 5MB' }));
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) return;

        setImages(prev => [...prev, ...validFiles]);

        // Crear previews
        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviews(prev => [...prev, reader.result]);
            };
            reader.readAsDataURL(file);
        });

        setErrors(prev => ({ ...prev, images: null }));
    };

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'El nombre es requerido';
        }

        if (!formData.price || parseFloat(formData.price) <= 0) {
            newErrors.price = 'El precio debe ser mayor a 0';
        }

        if (!formData.sku.trim()) {
            newErrors.sku = 'El SKU es requerido';
        }

        if (!formData.category) {
            newErrors.category = 'Debes seleccionar una categoría';
        }

        if (!formData.brand) {
            newErrors.brand = 'Debes seleccionar una marca';
        }

        if (!isEdit && images.length === 0) {
            newErrors.images = 'Debes agregar al menos una imagen';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        const submitData = new FormData();

        // Agregar campos de texto
        Object.keys(formData).forEach(key => {
            if (key === 'tags') {
                // Convertir tags a array
                const tagsArray = formData.tags
                    .split(',')
                    .map(tag => tag.trim())
                    .filter(tag => tag);
                submitData.append(key, JSON.stringify(tagsArray));
            } else if (typeof formData[key] === 'boolean') {
                submitData.append(key, formData[key]);
            } else if (formData[key]) {
                submitData.append(key, formData[key]);
            }
        });

        // Agregar imágenes
        images.forEach((image, index) => {
            submitData.append('images', image);
            if (index === 0) {
                submitData.append('is_primary', 'true');
            }
        });

        await onSubmit(submitData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Botones de acción superiores */}
            <div className="flex items-center justify-between">
                <Link
                    href="/admin/productos"
                    className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft className="h-5 w-5" />
                    <span>Volver</span>
                </Link>

                <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save className="h-5 w-5" />
                    <span>{loading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear'} Producto</span>
                </button>
            </div>

            {/* Información Básica */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                    Información Básica
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nombre */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre del Producto <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                errors.name ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Ej: iPhone 14 Pro Max"
                        />
                        {errors.name && (
                            <p className="text-red-500 text-sm mt-1 flex items-center space-x-1">
                                <AlertCircle className="h-4 w-4" />
                                <span>{errors.name}</span>
                            </p>
                        )}
                    </div>

                    {/* Descripción */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Descripción
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={5}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Describe el producto..."
                        />
                    </div>

                    {/* Categoría */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Categoría <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                errors.category ? 'border-red-500' : 'border-gray-300'
                            }`}
                        >
                            <option value="">Selecciona una categoría</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                        {errors.category && (
                            <p className="text-red-500 text-sm mt-1">{errors.category}</p>
                        )}
                    </div>

                    {/* Marca */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Marca <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="brand"
                            value={formData.brand}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                errors.brand ? 'border-red-500' : 'border-gray-300'
                            }`}
                        >
                            <option value="">Selecciona una marca</option>
                            {brands.map(brand => (
                                <option key={brand.id} value={brand.id}>
                                    {brand.name}
                                </option>
                            ))}
                        </select>
                        {errors.brand && (
                            <p className="text-red-500 text-sm mt-1">{errors.brand}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Precios e Inventario */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                    Precios e Inventario
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Precio */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Precio <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                S/
                            </span>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                step="0.01"
                                min="0"
                                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                    errors.price ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="0.00"
                            />
                        </div>
                        {errors.price && (
                            <p className="text-red-500 text-sm mt-1">{errors.price}</p>
                        )}
                    </div>

                    {/* Precio de comparación */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Precio de comparación
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                S/
                            </span>
                            <input
                                type="number"
                                name="compare_price"
                                value={formData.compare_price}
                                onChange={handleChange}
                                step="0.01"
                                min="0"
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="0.00"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Para mostrar descuentos
                        </p>
                    </div>

                    {/* Costo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Costo
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                S/
                            </span>
                            <input
                                type="number"
                                name="cost"
                                value={formData.cost}
                                onChange={handleChange}
                                step="0.01"
                                min="0"
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* SKU */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            SKU <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="sku"
                            value={formData.sku}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                errors.sku ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Ej: IPH14PM-256-BLK"
                        />
                        {errors.sku && (
                            <p className="text-red-500 text-sm mt-1">{errors.sku}</p>
                        )}
                    </div>

                    {/* Código de barras */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Código de barras
                        </label>
                        <input
                            type="text"
                            name="barcode"
                            value={formData.barcode}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Ej: 1234567890123"
                        />
                    </div>

                    {/* Stock */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Stock
                        </label>
                        <input
                            type="number"
                            name="stock"
                            value={formData.stock}
                            onChange={handleChange}
                            min="0"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="0"
                        />
                    </div>

                    {/* Peso */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Peso (kg)
                        </label>
                        <input
                            type="number"
                            name="weight"
                            value={formData.weight}
                            onChange={handleChange}
                            step="0.01"
                            min="0"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="0.00"
                        />
                    </div>
                </div>
            </div>

            {/* Imágenes */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                    Imágenes {!isEdit && <span className="text-red-500">*</span>}
                </h2>

                <div className="space-y-4">
                    {/* Upload área */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-500 transition">
                        <input
                            type="file"
                            id="images"
                            multiple
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                        />
                        <label
                            htmlFor="images"
                            className="cursor-pointer"
                        >
                            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <p className="text-sm font-medium text-gray-900 mb-1">
                                Haz clic para subir imágenes
                            </p>
                            <p className="text-xs text-gray-500">
                                PNG, JPG, WEBP hasta 5MB
                            </p>
                        </label>
                    </div>

                    {errors.images && (
                        <p className="text-red-500 text-sm flex items-center space-x-1">
                            <AlertCircle className="h-4 w-4" />
                            <span>{errors.images}</span>
                        </p>
                    )}

                    {/* Previews */}
                    {imagePreviews.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {imagePreviews.map((preview, index) => (
                                <div key={index} className="relative group">
                                    <div className="relative w-full h-32 bg-gray-200 rounded-lg overflow-hidden">
                                        <Image
                                            src={preview}
                                            alt={`Preview ${index + 1}`}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                    {index === 0 && (
                                        <span className="absolute bottom-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded">
                                            Principal
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Etiquetas y Opciones */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                    Etiquetas y Opciones
                </h2>

                <div className="space-y-6">
                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Etiquetas
                        </label>
                        <input
                            type="text"
                            name="tags"
                            value={formData.tags}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Separadas por comas: nuevo, oferta, destacado"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Separa las etiquetas con comas
                        </p>
                    </div>

                    {/* Checkboxes */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                name="is_active"
                                checked={formData.is_active}
                                onChange={handleChange}
                                className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
                                Producto activo
                            </span>
                        </label>

                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                name="is_featured"
                                checked={formData.is_featured}
                                onChange={handleChange}
                                className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
                                Producto destacado
                            </span>
                        </label>

                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                name="is_on_sale"
                                checked={formData.is_on_sale}
                                onChange={handleChange}
                                className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
                                En oferta
                            </span>
                        </label>
                    </div>
                </div>
            </div>

            {/* SEO */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                    SEO (Opcional)
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Meta título
                        </label>
                        <input
                            type="text"
                            name="meta_title"
                            value={formData.meta_title}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Título para SEO"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Meta descripción
                        </label>
                        <textarea
                            name="meta_description"
                            value={formData.meta_description}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Descripción para motores de búsqueda"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Meta keywords
                        </label>
                        <input
                            type="text"
                            name="meta_keywords"
                            value={formData.meta_keywords}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Palabras clave separadas por comas"
                        />
                    </div>
                </div>
            </div>

            {/* Botones de acción inferiores */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <Link
                    href="/admin/productos"
                    className="text-gray-600 hover:text-gray-900 font-medium"
                >
                    Cancelar
                </Link>

                <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center space-x-2 bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save className="h-5 w-5" />
                    <span>{loading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear'} Producto</span>
                </button>
            </div>
        </form>
    );
}
