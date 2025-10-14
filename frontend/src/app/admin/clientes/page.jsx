'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Users, UserCheck, Eye, Mail, Phone, MapPin, ShoppingBag } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ClientesPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchUsers();
    }, [currentPage, searchTerm]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage,
                page_size: 20,
            });
            if (searchTerm) params.append('search', searchTerm);

            const response = await api.get(`/auth/users/?${params.toString()}`);
            const data = response.data.results || response.data;
            
            setUsers(Array.isArray(data) ? data.filter(u => !u.is_staff) : []);
            
            if (response.data.count) {
                setTotalPages(Math.ceil(response.data.count / 20));
            }
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
            toast.error('Error al cargar clientes');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
                    <p className="text-gray-600 mt-1">Gestiona los usuarios de tu tienda</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Clientes</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{users.length}</p>
                            </div>
                            <Users className="h-10 w-10 text-purple-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Activos</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {users.filter(u => u.is_active).length}
                                </p>
                            </div>
                            <UserCheck className="h-10 w-10 text-green-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Con Compras</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {users.filter(u => u.profile?.total_orders > 0).length}
                                </p>
                            </div>
                            <ShoppingBag className="h-10 w-10 text-blue-500" />
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay clientes</h3>
                            <p className="text-gray-600">Los clientes aparecerán aquí cuando se registren</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ubicación</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Órdenes</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Gastado</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registro</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {users.map((user) => (
                                            <tr key={user.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {user.first_name} {user.last_name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">{user.username}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center space-x-2 text-sm text-gray-900">
                                                            <Mail className="h-4 w-4 text-gray-400" />
                                                            <span>{user.email}</span>
                                                        </div>
                                                        {user.phone && (
                                                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                                                                <Phone className="h-4 w-4 text-gray-400" />
                                                                <span>{user.phone}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {user.city && user.department ? (
                                                        <div className="flex items-center space-x-2 text-sm text-gray-900">
                                                            <MapPin className="h-4 w-4 text-gray-400" />
                                                            <span>{user.city}, {user.department}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-semibold text-gray-900">
                                                        {user.profile?.total_orders || 0}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-semibold text-gray-900">
                                                        S/ {parseFloat(user.profile?.total_spent || 0).toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(user.created_at).toLocaleDateString('es-PE')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Link
                                                        href={`/admin/clientes/${user.id}`}
                                                        className="inline-flex items-center space-x-1 text-purple-600 hover:text-purple-700 font-medium"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        <span>Ver</span>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {totalPages > 1 && (
                                <div className="px-6 py-4 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            Anterior
                                        </button>
                                        <span className="text-sm text-gray-700">Página {currentPage} de {totalPages}</span>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            Siguiente
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
