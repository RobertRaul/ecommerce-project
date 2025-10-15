'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Ticket, Plus, Search, Edit, Trash2, ToggleLeft, ToggleRight, TrendingUp, Users, Calendar, CheckCircle, XCircle } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function CuponesPage() {
    const [coupons, setCoupons] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [couponToDelete, setCouponToDelete] = useState(null);

    useEffect(() => {
        fetchCoupons();
        fetchStats();
    }, [filterType, filterStatus]);

    const fetchCoupons = async () => {
        try {
            const params = new URLSearchParams();
            if (filterType !== 'all') params.append('discount_type', filterType);
            if (filterStatus !== 'all') params.append('is_active', filterStatus === 'active');

            const response = await api.get(`/coupons/?${params.toString()}`);

            // 🔍 Verifica qué está retornando
            console.log('Response completa:', response.data);
            setCoupons(response.data.results || []);
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al cargar cupones');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get('/coupons/stats/');
            setStats(response.data);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleToggleActive = async (coupon) => {
        try {
            await api.post(`/coupons/${coupon.id}/toggle_active/`);
            toast.success(`Cupón ${coupon.is_active ? 'desactivado' : 'activado'}`);
            fetchCoupons();
        } catch (error) {
            toast.error('Error al cambiar estado');
        }
    };

    const handleDelete = (coupon) => {
        setCouponToDelete(coupon);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/coupons/${couponToDelete.id}/`);
            toast.success('Cupón eliminado');
            setShowDeleteModal(false);
            setCouponToDelete(null);
            fetchCoupons();
            fetchStats();
        } catch (error) {
            toast.error('Error al eliminar cupón');
        }
    };

    const filteredCoupons = coupons.filter(coupon =>
        coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coupon.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (coupon) => {
        const { valid, message } = coupon.is_valid_status;
        if (!valid) {
            return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">{message}</span>;
        }
        if (!coupon.is_active) {
            return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Inactivo</span>;
        }
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Activo</span>;
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                            <Ticket className="h-8 w-8 text-purple-600" />
                            <span>Cupones de Descuento</span>
                        </h1>
                        <p className="text-gray-600 mt-2">Gestiona cupones y promociones</p>
                    </div>
                    <Link
                        href="/admin/cupones/crear"
                        className="inline-flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 shadow-lg transition"
                    >
                        <Plus className="h-5 w-5" />
                        <span>Crear Cupón</span>
                    </Link>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between">
                                <Ticket className="h-10 w-10 opacity-80" />
                                <span className="text-3xl font-bold">{stats.total_coupons}</span>
                            </div>
                            <p className="mt-2 text-purple-100">Total Cupones</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between">
                                <CheckCircle className="h-10 w-10 opacity-80" />
                                <span className="text-3xl font-bold">{stats.active_coupons}</span>
                            </div>
                            <p className="mt-2 text-green-100">Activos</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between">
                                <Users className="h-10 w-10 opacity-80" />
                                <span className="text-3xl font-bold">{stats.total_uses}</span>
                            </div>
                            <p className="mt-2 text-blue-100">Usos Totales</p>
                        </div>
                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between">
                                <TrendingUp className="h-10 w-10 opacity-80" />
                                <span className="text-3xl font-bold">S/ {stats.total_discount_given.toFixed(2)}</span>
                            </div>
                            <p className="mt-2 text-orange-100">Descuento Otorgado</p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="Buscar por código o descripción..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="all">Todos los tipos</option>
                            <option value="percentage">Porcentaje</option>
                            <option value="fixed">Monto Fijo</option>
                        </select>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="all">Todos los estados</option>
                            <option value="active">Activos</option>
                            <option value="inactive">Inactivos</option>
                        </select>
                    </div>
                </div>

                {/* Coupons Table */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descuento</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uso</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vigencia</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredCoupons.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                                <Ticket className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                                <p>No se encontraron cupones</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredCoupons.map((coupon) => (
                                            <tr key={coupon.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="font-bold text-purple-600">{coupon.code}</div>
                                                        {coupon.description && (
                                                            <div className="text-sm text-gray-500">{coupon.description.substring(0, 50)}</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-semibold text-green-600">{coupon.discount_display}</span>
                                                    {coupon.minimum_purchase > 0 && (
                                                        <div className="text-xs text-gray-500">Min: S/ {coupon.minimum_purchase}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm">
                                                        <span className="font-semibold">{coupon.times_used}</span>
                                                        {coupon.usage_limit && ` / ${coupon.usage_limit}`}
                                                    </div>
                                                    {coupon.usage_percentage !== null && (
                                                        <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                                                            <div
                                                                className="bg-blue-600 h-2 rounded-full"
                                                                style={{ width: `${coupon.usage_percentage}%` }}
                                                            />
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-xs text-gray-600">
                                                        <div>Desde: {new Date(coupon.valid_from).toLocaleDateString()}</div>
                                                        <div>Hasta: {new Date(coupon.valid_until).toLocaleDateString()}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {getStatusBadge(coupon)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <button
                                                            onClick={() => handleToggleActive(coupon)}
                                                            className="text-gray-600 hover:text-purple-600"
                                                            title={coupon.is_active ? 'Desactivar' : 'Activar'}
                                                        >
                                                            {coupon.is_active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                                                        </button>
                                                        <Link
                                                            href={`/admin/cupones/${coupon.id}/editar`}
                                                            className="text-blue-600 hover:text-blue-900"
                                                        >
                                                            <Edit className="h-5 w-5" />
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(coupon)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            <Trash2 className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Modal */}
            {showDeleteModal && couponToDelete && (
                <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
                    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-start space-x-4 mb-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <Ticket className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Eliminar Cupón</h3>
                                <p className="text-gray-600 text-sm">
                                    ¿Estás seguro de que deseas eliminar el cupón "<strong>{couponToDelete.code}</strong>"?
                                </p>
                                <p className="text-gray-500 text-xs mt-2">
                                    Esta acción no se puede deshacer.
                                </p>
                            </div>
                        </div>
                        <div className="flex space-x-3 mt-6">
                            <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition">Cancelar</button>
                            <button onClick={confirmDelete} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 shadow-lg transition">Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
