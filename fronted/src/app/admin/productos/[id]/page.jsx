'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import ProductForm from '@/components/admin/ProductForm';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function EditarProductoPage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;
    
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [product, setProduct] = useState(null);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const [productRes, categoriesRes, brandsRes] = await Promise.all([
                api.get(`/products/${id}/`),
                api.get('/categories/'),
                api.get('/brands/')
            ]);
            
            setProduct(productRes.data);
            setCategories(categoriesRes.data.results || categoriesRes.data || []);
            setBrands(brandsRes.data.results || brandsRes.data || []);
        } catch (error) {
            console.error('Error al cargar datos:', error);
            toast.error('Error al cargar producto');
        } finally {
            setLoadingData(false);
        }
    };

    const handleSubmit = async (formData) => {
        setLoading(true);
        try {
            await api.patch(`/products/${id}/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            toast.success('Producto actualizado exitosamente');
            router.push('/admin/productos');
        } catch (error) {
            console.error('Error al actualizar producto:', error);
            toast.error(error.response?.data?.detail || 'Error al actualizar producto');
        } finally {
            setLoading(false);
        }
    };

    if (loadingData) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
            </AdminLayout>
        );
    }

    if (!product) {
        return (
            <AdminLayout>
                <div className="text-center py-12">
                    <h2 className="text-2xl font-bold text-gray-900">Producto no encontrado</h2>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Editar Producto</h1>
                    <p className="text-gray-600 mt-1">
                        Actualiza la información del producto
                    </p>
                </div>

                <ProductForm
                    onSubmit={handleSubmit}
                    categories={categories}
                    brands={brands}
                    loading={loading}
                    initialData={product}
                    isEdit
                />
            </div>
        </AdminLayout>
    );
}
