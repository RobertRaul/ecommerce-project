'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import BrandForm from '@/components/admin/BrandForm';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function EditarMarcaPage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;
    
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [brand, setBrand] = useState(null);

    useEffect(() => {
        fetchBrand();
    }, [id]);

    const fetchBrand = async () => {
        try {
            const response = await api.get(`/brands/${id}/`);
            setBrand(response.data);
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al cargar marca');
        } finally {
            setLoadingData(false);
        }
    };

    const handleSubmit = async (formData) => {
        setLoading(true);
        try {
            await api.patch(`/brands/${id}/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('Marca actualizada exitosamente');
            router.push('/admin/marcas');
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al actualizar marca');
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

    if (!brand) {
        return (
            <AdminLayout>
                <div className="text-center py-12">
                    <h2 className="text-2xl font-bold text-gray-900">Marca no encontrada</h2>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Editar Marca</h1>
                    <p className="text-gray-600 mt-1">Actualiza la información de la marca</p>
                </div>
                <BrandForm onSubmit={handleSubmit} loading={loading} initialData={brand} isEdit />
            </div>
        </AdminLayout>
    );
}
