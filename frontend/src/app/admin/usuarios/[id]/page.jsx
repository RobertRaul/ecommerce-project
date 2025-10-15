'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import UserForm from '@/components/admin/UserForm';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function EditarUsuarioPage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;

    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetchUser();
    }, [id]);

    const fetchUser = async () => {
        try {
            const response = await api.get(`/auth/users/${id}/`);
            setUser(response.data);
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al cargar usuario');
        } finally {
            setLoadingData(false);
        }
    };

    const handleSubmit = async (formData) => {
        setLoading(true);
        try {
            await api.patch(`/auth/users/${id}/`, formData);
            toast.success('Usuario actualizado exitosamente');
            router.push('/admin/usuarios');
        } catch (error) {
            const errorMsg = error.response?.data?.error ||
                error.response?.data?.email?.[0] ||
                error.response?.data?.username?.[0] ||
                'Error al actualizar usuario';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    if (loadingData) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </AdminLayout>
        );
    }

    if (!user) {
        return (
            <AdminLayout>
                <div className="text-center py-12">
                    <h2 className="text-2xl font-bold text-gray-900">Usuario no encontrado</h2>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Editar Usuario</h1>
                    <p className="text-gray-600 mt-1">Actualiza la información del usuario</p>
                </div>
                <UserForm onSubmit={handleSubmit} loading={loading} initialData={user} isEdit />
            </div>
        </AdminLayout>
    );
}