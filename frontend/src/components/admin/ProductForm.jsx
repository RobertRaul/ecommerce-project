'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Upload, AlertCircle, Save, ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ProductForm({ 
    onSubmit, 
    categories = [], 
    brands = [], 
    loading = false,
    initialData = null,
    isEdit = false
}) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        short_description: '',
        price: '',
        compare_price: '',
        cost: '',
        sku: '',
        stock: '',
        low_stock_threshold: '10',
        weight: '',
        length: '',
        width: '',
        height: '',
        category: '',
        brand: '',
        is_active: true,
        is_featured: false,
        track_inventory: true,
        meta_title: '',
        meta_description: '',
    });

    const [existingImages, setExistingImages] = useState([]);
    const [newImages, setNewImages] = useState([]);
    const [newImagePreviews, setNewImagePreviews] = useState([]);
    const [imagesToDelete, setImagesToDelete] = useState([]);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                description: initialData.description || '',
                short_description: initialData.short_description || '',
                price: initialData.price || '',
                compare_price: initialData.compare_price || '',
                cost: initialData.cost || '',
                sku: initialData.sku || '',
                stock: initialData.stock || '',
                low_stock_threshold: initialData.low_stock_threshold || '10',
                weight: initialData.weight || '',
                length: initialData.length || '',
                width: initialData.width || '',
                height: initialData.height || '',
                category: initialData.category?.id || initialData.category || '',
                brand: initialData.brand?.id || initialData.brand || '',
                is_active: initialData.is_active ?? true,
                is_featured: initialData.is_featured ?? false,
                track_inventory: initialData.track_inventory ?? true,
                meta_title: initialData.meta_title || '',
                meta_description: initialData.meta_description || '',
            });

            if (initialData.images && initialData.images.length > 0) {
                setExistingImages(initialData.images);
            }
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        
        if (files.length === 0) return;

        const validFiles = files.filter(file => {
            const isValidType = file.type.startsWith('image/');
            const isValidSize = file.size <= 5 * 1024 * 1024;
            
            if (!isValidType) {
                toast.error('Solo se permiten archivos de imagen');
                return false;
            }
            if (!isValidSize) {
                toast.error('Las imágenes deben pesar menos de 5MB');
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) return;

        setNewImages(prev => [...prev, ...validFiles]);

        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewImagePreviews(prev => [...prev, reader.result]);
            };
            reader.readAsDataURL(file);
        });

        setErrors(prev => ({ ...prev, images: null }));
    };

    const removeNewImage = (index) => {
        setNewImages(prev => prev.filter((_, i) => i !== index));
        setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingImage = (imageId) => {
        setImagesToDelete(prev => [...prev, imageId]);
        setExistingImages(prev => prev.filter(img => img.id !== imageId));
        toast.success('Imagen marcada para eliminar');
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
        if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'El precio debe ser mayor a 0';
        if (!formData.sku.trim()) newErrors.sku = 'El SKU es requerido';
        if (!formData.category) newErrors.category = 'Debes seleccionar una categoría';
        if (!formData.brand) newErrors.brand = 'Debes seleccionar una marca';
        if (!isEdit && newImages.length === 0) newErrors.images = 'Debes agregar al menos una imagen';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) {
            toast.error('Por favor completa todos los campos requeridos');
            return;
        }

        const submitData = new FormData();

        Object.keys(formData).forEach(key => {
            if (typeof formData[key] === 'boolean') {
                submitData.append(key, formData[key]);
            } else if (formData[key] !== null && formData[key] !== '') {
                submitData.append(key, formData[key]);
            }
        });

        newImages.forEach((image) => {
            submitData.append('images', image);
        });

        if (isEdit && imagesToDelete.length > 0) {
            submitData.append('delete_images', JSON.stringify(imagesToDelete));
        }

        await onSubmit(submitData);
    };

    const totalImages = existingImages.length + newImages.length;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between">
                <Link href="/admin/productos" className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition">
                    <ArrowLeft className="h-5 w-5" />
                    <span>Volver a productos</span>
                </Link>
                <button type="submit" disabled={loading} className="inline-flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl">
                    <Save className="h-5 w-5" />
                    <span>{loading ? 'Guardando...' : isEdit ? 'Actualizar Producto' : 'Crear Producto'}</span>
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="w-2 h-6 bg-purple-600 rounded-full mr-3"></span>
                    Información Básica
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre del Producto <span className="text-red-500">*</span>
                        </label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition ${errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} placeholder="Ej: iPhone 14 Pro Max 256GB" />
                        {errors.name && <p className="text-red-500 text-sm mt-1 flex items-center space-x-1"><AlertCircle className="h-4 w-4" /><span>{errors.name}</span></p>}
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Descripción Corta</label>
                        <input type="text" name="short_description" value={formData.short_description} onChange={handleChange} maxLength={500} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Breve descripción del producto (máx 500 caracteres)" />
                        <p className="text-xs text-gray-500 mt-1">{formData.short_description.length}/500 caracteres</p>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Descripción Completa</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows={6} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" placeholder="Describe el producto en detalle..." />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Categoría <span className="text-red-500">*</span></label>
                        <select name="category" value={formData.category} onChange={handleChange} className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.category ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}>
                            <option value="">Selecciona una categoría</option>
                            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                        {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Marca <span className="text-red-500">*</span></label>
                        <select name="brand" value={formData.brand} onChange={handleChange} className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.brand ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}>
                            <option value="">Selecciona una marca</option>
                            {brands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                        </select>
                        {errors.brand && <p className="text-red-500 text-sm mt-1">{errors.brand}</p>}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="w-2 h-6 bg-green-600 rounded-full mr-3"></span>
                    Precios e Inventario
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Precio <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">S/</span>
                            <input type="number" name="price" value={formData.price} onChange={handleChange} step="0.01" min="0" className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.price ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} placeholder="0.00" />
                        </div>
                        {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Precio de Comparación</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">S/</span>
                            <input type="number" name="compare_price" value={formData.compare_price} onChange={handleChange} step="0.01" min="0" className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="0.00" />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Para mostrar descuentos</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Costo</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">S/</span>
                            <input type="number" name="cost" value={formData.cost} onChange={handleChange} step="0.01" min="0" className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="0.00" />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Tu costo del producto</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">SKU <span className="text-red-500">*</span></label>
                        <input type="text" name="sku" value={formData.sku} onChange={handleChange} className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono ${errors.sku ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} placeholder="IPH14PM-256-BLK" />
                        {errors.sku && <p className="text-red-500 text-sm mt-1">{errors.sku}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Stock Disponible</label>
                        <input type="number" name="stock" value={formData.stock} onChange={handleChange} min="0" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="0" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Umbral Stock Bajo</label>
                        <input type="number" name="low_stock_threshold" value={formData.low_stock_threshold} onChange={handleChange} min="0" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="10" />
                        <p className="text-xs text-gray-500 mt-1">Alerta cuando stock ≤ este valor</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="w-2 h-6 bg-blue-600 rounded-full mr-3"></span>
                    Dimensiones y Peso
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div><label className="block text-sm font-medium text-gray-700 mb-2">Peso (kg)</label><input type="number" name="weight" value={formData.weight} onChange={handleChange} step="0.01" min="0" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="0.00" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-2">Largo (cm)</label><input type="number" name="length" value={formData.length} onChange={handleChange} step="0.01" min="0" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="0.00" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-2">Ancho (cm)</label><input type="number" name="width" value={formData.width} onChange={handleChange} step="0.01" min="0" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="0.00" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-2">Alto (cm)</label><input type="number" name="height" value={formData.height} onChange={handleChange} step="0.01" min="0" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="0.00" /></div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="w-2 h-6 bg-pink-600 rounded-full mr-3"></span>
                    Imágenes del Producto {!isEdit && <span className="text-red-500 ml-1">*</span>}
                </h2>
                <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-500 transition cursor-pointer bg-gray-50 hover:bg-purple-50">
                        <input type="file" id="images" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                        <label htmlFor="images" className="cursor-pointer">
                            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <p className="text-sm font-medium text-gray-900 mb-1">Haz clic para subir imágenes o arrastra aquí</p>
                            <p className="text-xs text-gray-500">PNG, JPG, WEBP hasta 5MB cada una</p>
                        </label>
                    </div>
                    {errors.images && <p className="text-red-500 text-sm flex items-center space-x-1"><AlertCircle className="h-4 w-4" /><span>{errors.images}</span></p>}
                    {totalImages > 0 && (
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-3">{totalImages} {totalImages === 1 ? 'imagen' : 'imágenes'}</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {existingImages.map((img, index) => (
                                    <div key={`existing-${img.id}`} className="relative group">
                                        <div className="relative w-full h-32 bg-gray-200 rounded-lg overflow-hidden border-2 border-gray-300">
                                            <Image src={img.image} alt={img.alt_text || `Imagen ${index + 1}`} fill className="object-cover" />
                                        </div>
                                        <button type="button" onClick={() => removeExistingImage(img.id)} className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg hover:bg-red-700" title="Eliminar imagen"><Trash2 className="h-4 w-4" /></button>
                                        {img.is_primary && <span className="absolute bottom-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded font-semibold shadow">Principal</span>}
                                    </div>
                                ))}
                                {newImagePreviews.map((preview, index) => (
                                    <div key={`new-${index}`} className="relative group">
                                        <div className="relative w-full h-32 bg-gray-200 rounded-lg overflow-hidden border-2 border-green-500">
                                            <Image src={preview} alt={`Nueva imagen ${index + 1}`} fill className="object-cover" />
                                        </div>
                                        <button type="button" onClick={() => removeNewImage(index)} className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg hover:bg-red-700" title="Eliminar imagen"><X className="h-4 w-4" /></button>
                                        <span className="absolute bottom-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded font-semibold shadow">Nueva</span>
                                        {existingImages.length === 0 && index === 0 && <span className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded font-semibold shadow">Principal</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="w-2 h-6 bg-orange-600 rounded-full mr-3"></span>
                    Opciones del Producto
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="flex items-center space-x-3 cursor-pointer p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                        <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500" />
                        <div><span className="text-sm font-medium text-gray-900 block">Producto Activo</span><span className="text-xs text-gray-500">Visible en la tienda</span></div>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                        <input type="checkbox" name="is_featured" checked={formData.is_featured} onChange={handleChange} className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500" />
                        <div><span className="text-sm font-medium text-gray-900 block">Producto Destacado</span><span className="text-xs text-gray-500">Aparece en destacados</span></div>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                        <input type="checkbox" name="track_inventory" checked={formData.track_inventory} onChange={handleChange} className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500" />
                        <div><span className="text-sm font-medium text-gray-900 block">Rastrear Inventario</span><span className="text-xs text-gray-500">Controlar stock</span></div>
                    </label>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="w-2 h-6 bg-indigo-600 rounded-full mr-3"></span>
                    SEO (Opcional)
                </h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Meta Título</label>
                        <input type="text" name="meta_title" value={formData.meta_title} onChange={handleChange} maxLength={200} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Título para SEO" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Meta Descripción</label>
                        <textarea name="meta_description" value={formData.meta_description} onChange={handleChange} rows={3} maxLength={300} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" placeholder="Descripción para motores de búsqueda" />
                        <p className="text-xs text-gray-500 mt-1">{formData.meta_description.length}/300 caracteres</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <Link href="/admin/productos" className="text-gray-600 hover:text-gray-900 font-medium">Cancelar</Link>
                <button type="submit" disabled={loading} className="inline-flex items-center space-x-2 bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl">
                    <Save className="h-5 w-5" />
                    <span>{loading ? 'Guardando...' : isEdit ? 'Actualizar Producto' : 'Crear Producto'}</span>
                </button>
            </div>
        </form>
    );
}
