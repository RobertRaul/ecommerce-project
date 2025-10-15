'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import UserForm from '@/components/admin/UserForm';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function NuevoUsuarioPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (formData) => {
        setLoading(true);
        try {
            await api.post('/auth/users/', formData);
            toast.success('Usuario creado exitosamente');
            router.push('/admin/usuarios');
        } catch (error) {
            const errorMsg = error.response?.data?.error ||
                error.response?.data?.email?.[0] ||
                error.response?.data?.username?.[0] ||
                'Error al crear usuario';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Nuevo Usuario</h1>
                    <p className="text-gray-600 mt-1">Completa la información del usuario</p>
                </div>
                <UserForm onSubmit={handleSubmit} loading={loading} />
            </div>
        </AdminLayout>
    );
}