'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import CategoryForm from '@/components/admin/CategoryForm';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function EditarCategoriaPage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;
    
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [category, setCategory] = useState(null);

    useEffect(() => {
        fetchCategory();
    }, [id]);

    const fetchCategory = async () => {
        try {
            const response = await api.get(`/categories/${id}/`);
            setCategory(response.data);
        } catch (error) {
            console.error('Error al cargar categoría:', error);
            toast.error('Error al cargar categoría');
        } finally {
            setLoadingData(false);
        }
    };

    const handleSubmit = async (formData) => {
        setLoading(true);
        try {
            await api.patch(`/categories/${id}/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            toast.success('Categoría actualizada exitosamente');
            router.push('/admin/categorias');
        } catch (error) {
            console.error('Error al actualizar categoría:', error);
            toast.error(error.response?.data?.detail || 'Error al actualizar categoría');
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

    if (!category) {
        return (
            <AdminLayout>
                <div className="text-center py-12">
                    <h2 className="text-2xl font-bold text-gray-900">Categoría no encontrada</h2>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Editar Categoría</h1>
                    <p className="text-gray-600 mt-1">
                        Actualiza la información de la categoría
                    </p>
                </div>

                <CategoryForm
                    onSubmit={handleSubmit}
                    loading={loading}
                    initialData={category}
                    isEdit
                />
            </div>
        </AdminLayout>
    );
}
