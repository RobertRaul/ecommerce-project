'use client'

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import BrandForm from '@/components/admin/BrandForm';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function NuevaMarcaPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (formData) => {
        setLoading(true);
        try {
            await api.post('/brands/', formData, {
                headers: {
                    'Content-Type':
                        'multipart/form-data'
                }
                ,
            })
            ;
            toast.success('Marca creada exitosamente');
            router.push('/admin/marcas');
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al crear marca');
        } finally {
            setLoading(false);
        }
    };
    return (< AdminLayout>
        < div
            className="max-w-4xl ">
            <div className="mb-8 "><h1 className="text-3xl font-bold text-gray-900 ">Nueva
                Marca
            </h1>
                <p className=
                       "text-gray-600 mt-1 ">Completa la información de la marca</p></div>
            <BrandForm onSubmit={handleSubmit} loading={loading}/></div>
    </AdminLayout>);
}
