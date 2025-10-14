'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Upload, AlertCircle, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function BrandForm({ 
    onSubmit, 
    loading = false,
    initialData = null,
    isEdit = false
}) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        is_active: true,
    });

    const [logo, setLogo] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [existingLogo, setExistingLogo] = useState(null);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                description: initialData.description || '',
                is_active: initialData.is_active ?? true,
            });

            if (initialData.logo) {
                setExistingLogo(initialData.logo);
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

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        
        if (!file) return;

        const isValidType = file.type.startsWith('image/');
        const isValidSize = file.size <= 5 * 1024 * 1024;
        
        if (!isValidType) {
            toast.error('Solo se permiten archivos de imagen');
            return;
        }
        if (!isValidSize) {
            toast.error('La imagen debe pesar menos de 5MB');
            return;
        }

        setLogo(file);

        const reader = new FileReader();
        reader.onloadend = () => {
            setLogoPreview(reader.result);
        };
        reader.readAsDataURL(file);

        setErrors(prev => ({ ...prev, logo: null }));
    };

    const removeLogo = () => {
        setLogo(null);
        setLogoPreview(null);
    };

    const removeExistingLogo = () => {
        setExistingLogo(null);
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'El nombre es requerido';
        }

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

        if (logo) {
            submitData.append('logo', logo);
        }

        await onSubmit(submitData);
    };

    const displayLogo = logoPreview || existingLogo;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between">
                <Link href="/admin/marcas" className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition">
                    <ArrowLeft className="h-5 w-5" />
                    <span>Volver a marcas</span>
                </Link>

                <button type="submit" disabled={loading} className="inline-flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl">
                    <Save className="h-5 w-5" />
                    <span>{loading ? 'Guardando...' : isEdit ? 'Actualizar Marca' : 'Crear Marca'}</span>
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="w-2 h-6 bg-purple-600 rounded-full mr-3"></span>
                    Información Básica
                </h2>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre de la Marca <span className="text-red-500">*</span>
                        </label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition ${errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} placeholder="Ej: Nike" />
                        {errors.name && (
                            <p className="text-red-500 text-sm mt-1 flex items-center space-x-1">
                                <AlertCircle className="h-4 w-4" />
                                <span>{errors.name}</span>
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" placeholder="Describe la marca..." />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="w-2 h-6 bg-pink-600 rounded-full mr-3"></span>
                    Logo de la Marca
                </h2>

                <div className="space-y-4">
                    {!displayLogo && (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-500 transition cursor-pointer bg-gray-50 hover:bg-purple-50">
                            <input type="file" id="logo" accept="image/*" onChange={handleLogoChange} className="hidden" />
                            <label htmlFor="logo" className="cursor-pointer">
                                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                <p className="text-sm font-medium text-gray-900 mb-1">Haz clic para subir un logo</p>
                                <p className="text-xs text-gray-500">PNG, JPG, SVG hasta 5MB</p>
                            </label>
                        </div>
                    )}

                    {displayLogo && (
                        <div className="relative group">
                            <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                                <Image src={displayLogo} alt="Logo preview" width={200} height={200} className="object-contain" />
                            </div>
                            <button type="button" onClick={logoPreview ? removeLogo : removeExistingLogo} className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg hover:bg-red-700">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="w-2 h-6 bg-orange-600 rounded-full mr-3"></span>
                    Opciones
                </h2>

                <label className="flex items-center space-x-3 cursor-pointer p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                    <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500" />
                    <div>
                        <span className="text-sm font-medium text-gray-900 block">Marca Activa</span>
                        <span className="text-xs text-gray-500">Visible en la tienda</span>
                    </div>
                </label>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <Link href="/admin/marcas" className="text-gray-600 hover:text-gray-900 font-medium">Cancelar</Link>
                <button type="submit" disabled={loading} className="inline-flex items-center space-x-2 bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl">
                    <Save className="h-5 w-5" />
                    <span>{loading ? 'Guardando...' : isEdit ? 'Actualizar Marca' : 'Crear Marca'}</span>
                </button>
            </div>
        </form>
    );
}
