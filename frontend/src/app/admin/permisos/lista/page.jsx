'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Key, Shield } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function PermisosListaPage() {
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPermissions();
    }, []);

    const fetchPermissions = async () => {
        try {
            const response = await api.get('/permissions/by_category/');
            setPermissions(response.data || {});
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al cargar permisos');
            setPermissions({});
        } finally {
            setLoading(false);
        }
    };

    const categoryColors = {
        'products': 'bg-blue-100 text-blue-800 border-blue-200',
        'orders': 'bg-green-100 text-green-800 border-green-200',
        'customers': 'bg-purple-100 text-purple-800 border-purple-200',
        'reports': 'bg-orange-100 text-orange-800 border-orange-200',
        'settings': 'bg-red-100 text-red-800 border-red-200',
        'users': 'bg-indigo-100 text-indigo-800 border-indigo-200',
        'coupons': 'bg-pink-100 text-pink-800 border-pink-200',
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link
                            href="/admin/permisos"
                            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            <span>Volver</span>
                        </Link>
                    </div>
                </div>

                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                        <Key className="h-8 w-8 text-green-600" />
                        <span>Todos los Permisos</span>
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Lista completa de permisos del sistema organizados por categoría
                    </p>
                </div>

                {/* Permissions by Category */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {Object.entries(permissions).map(([categoryCode, categoryData]) => (
                            <div key={categoryCode} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                                            <Shield className="h-6 w-6 text-gray-600" />
                                            <span>{categoryData.name}</span>
                                        </h3>
                                        <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm font-semibold">
                                            {categoryData.permissions?.length || 0} permisos
                                        </span>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {categoryData.permissions?.map((permission) => (
                                            <div
                                                key={permission.id}
                                                className={`flex items-center space-x-3 p-4 rounded-lg border-2 ${categoryColors[categoryCode] || 'bg-gray-100 text-gray-800 border-gray-200'}`}
                                            >
                                                <Key className="h-5 w-5 flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold truncate">{permission.name}</p>
                                                    <p className="text-xs opacity-75 truncate">{permission.codename}</p>
                                                </div>
                                            </div>
                                        )) || (
                                            <p className="text-gray-500 col-span-full text-center py-4">
                                                No hay permisos en esta categoría
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {Object.keys(permissions).length === 0 && (
                            <div className="text-center py-12">
                                <Key className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">No se encontraron permisos</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
