'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import CategoryForm from '@/components/admin/CategoryForm';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function NuevaCategoriaPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (formData) => {
        setLoading(true);
        try {
            await api.post('/categories/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            toast.success('Categoría creada exitosamente');
            router.push('/admin/categorias');
        } catch (error) {
            console.error('Error al crear categoría:', error);
            toast.error(error.response?.data?.detail || 'Error al crear categoría');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Nueva Categoría</h1>
                    <p className="text-gray-600 mt-1">
                        Completa la información de la categoría
                    </p>
                </div>

                <CategoryForm
                    onSubmit={handleSubmit}
                    loading={loading}
                />
            </div>
        </AdminLayout>
    );
}
