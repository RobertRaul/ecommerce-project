'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import ProductForm from '@/components/admin/ProductForm';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function NuevoProductoPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);

    useEffect(() => {
        fetchOptions();
    }, []);

    const fetchOptions = async () => {
        try {
            const [categoriesRes, brandsRes] = await Promise.all([
                api.get('/categories/'),
                api.get('/brands/')
            ]);
            
            setCategories(categoriesRes.data.results || categoriesRes.data || []);
            setBrands(brandsRes.data.results || brandsRes.data || []);
        } catch (error) {
            console.error('Error al cargar opciones:', error);
            toast.error('Error al cargar categorías y marcas');
        }
    };

    const handleSubmit = async (formData) => {
        setLoading(true);
        try {
            const response = await api.post('/products/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            toast.success('Producto creado exitosamente');
            router.push('/admin/productos');
        } catch (error) {
            console.error('Error al crear producto:', error);
            toast.error(error.response?.data?.detail || 'Error al crear producto');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Nuevo Producto</h1>
                    <p className="text-gray-600 mt-1">
                        Completa la información del producto
                    </p>
                </div>

                <ProductForm
                    onSubmit={handleSubmit}
                    categories={categories}
                    brands={brands}
                    loading={loading}
                />
            </div>
        </AdminLayout>
    );
}
