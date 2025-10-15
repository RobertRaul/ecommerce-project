'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    UserPlus, Search, Users, Shield, Edit, Trash2,
    CheckCircle, XCircle, Lock, Unlock,
    Mail, Phone, User, Calendar, Filter, AlertCircle
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function UsuariosPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/auth/users/');
            setUsers(response.data.results || response.data);
        } catch (error) {
            toast.error('Error al cargar usuarios');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async () => {
        try {
            await api.delete(`/auth/users/${selectedUser.id}/`);
            toast.success('Usuario eliminado exitosamente');
            setShowDeleteModal(false);
            setSelectedUser(null);
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Error al eliminar usuario');
        }
    };

    const handleToggleUserStatus = async (userId, isActive) => {
        try {
            await api.patch(`/auth/users/${userId}/`, { is_active: !isActive });
            toast.success(`Usuario ${isActive ? 'desactivado' : 'activado'} exitosamente`);
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Error al cambiar estado del usuario');
        }
    };

    const openDeleteModal = (user) => {
        setSelectedUser(user);
        setShowDeleteModal(true);
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter =
            filterStatus === 'all' ||
            (filterStatus === 'active' && user.is_active) ||
            (filterStatus === 'inactive' && !user.is_active);

        return matchesSearch && matchesFilter;
    });

    const stats = {
        total: users.length,
        active: users.filter(u => u.is_active).length,
        inactive: users.filter(u => !u.is_active).length,
        admins: users.filter(u => u.is_staff || u.is_superuser).length
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                            <Users className="h-8 w-8 text-blue-600"/>
                            <span>Gestión de Usuarios</span>
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Administra los usuarios del sistema
                        </p>
                    </div>
                    <Link
                        href="/admin/usuarios/nuevo"
                        className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-sm"
                    >
                        <UserPlus className="h-5 w-5"/>
                        <span>Crear Usuario</span>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Usuarios"
                        value={stats.total}
                        icon={Users}
                        color="blue"
                    />
                    <StatCard
                        title="Activos"
                        value={stats.active}
                        icon={CheckCircle}
                        color="green"
                    />
                    <StatCard
                        title="Inactivos"
                        value={stats.inactive}
                        icon={XCircle}
                        color="red"
                    />
                    <StatCard
                        title="Administradores"
                        value={stats.admins}
                        icon={Shield}
                        color="purple"
                    />
                </div>

                {/* Filters and Search */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5"/>
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email o usuario..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Filter className="h-5 w-5 text-gray-400"/>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Todos</option>
                            <option value="active">Activos</option>
                            <option value="inactive">Inactivos</option>
                        </select>
                    </div>
                </div>

                {/* Users Table */}
                {loading ? (
                    <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Cargando usuarios...</p>
                        </div>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <Users className="h-16 w-16 text-gray-400 mx-auto mb-4"/>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            No se encontraron usuarios
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {searchTerm || filterStatus !== 'all'
                                ? 'Intenta ajustar tus filtros de búsqueda'
                                : 'Comienza creando tu primer usuario'}
                        </p>
                        <Link
                            href="/admin/usuarios/nuevo"
                            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                        >
                            <UserPlus className="h-5 w-5"/>
                            <span>Crear Usuario</span>
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Usuario
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Contacto
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Rol
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Estado
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Registro
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                                    {user.first_name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || 'U'}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {user.first_name} {user.last_name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        @{user.username}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col space-y-1">
                                                <div className="flex items-center text-sm text-gray-900">
                                                    <Mail className="h-4 w-4 text-gray-400 mr-2"/>
                                                    {user.email}
                                                </div>
                                                {user.phone && (
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <Phone className="h-4 w-4 text-gray-400 mr-2"/>
                                                        {user.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col space-y-1">
                                                {user.is_superuser && (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                                        <Shield className="h-3 w-3 mr-1"/>
                                                        Superadmin
                                                    </span>
                                                )}
                                                {user.is_staff && !user.is_superuser && (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                                                        <Shield className="h-3 w-3 mr-1"/>
                                                        Staff
                                                    </span>
                                                )}
                                                {!user.is_staff && !user.is_superuser && (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                                                        <User className="h-3 w-3 mr-1"/>
                                                        Usuario
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {user.is_active ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                                    <CheckCircle className="h-3 w-3 mr-1"/>
                                                    Activo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                                    <XCircle className="h-3 w-3 mr-1"/>
                                                    Inactivo
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex items-center">
                                                <Calendar className="h-4 w-4 mr-2 text-gray-400"/>
                                                {new Date(user.date_joined).toLocaleDateString('es-PE', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <Link
                                                    href={`/admin/usuarios/${user.id}`}
                                                    className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 p-2 rounded-lg transition"
                                                    title="Editar"
                                                >
                                                    <Edit className="h-5 w-5"/>
                                                </Link>
                                                <button
                                                    onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                                                    className={`${
                                                        user.is_active
                                                            ? 'text-orange-600 hover:text-orange-900 hover:bg-orange-50'
                                                            : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                                                    } p-2 rounded-lg transition`}
                                                    title={user.is_active ? 'Desactivar' : 'Activar'}
                                                >
                                                    {user.is_active ? <Lock className="h-5 w-5"/> : <Unlock className="h-5 w-5"/>}
                                                </button>
                                                <button
                                                    onClick={() => openDeleteModal(user)}
                                                    className="text-red-600 hover:text-red-900 hover:bg-red-50 p-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Eliminar"
                                                    disabled={user.is_superuser}
                                                >
                                                    <Trash2 className="h-5 w-5"/>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Delete Modal */}
                {showDeleteModal && (
                    <DeleteConfirmModal
                        user={selectedUser}
                        onConfirm={handleDeleteUser}
                        onClose={() => {
                            setShowDeleteModal(false);
                            setSelectedUser(null);
                        }}
                    />
                )}
            </div>
        </AdminLayout>
    );
}

// Componente de Tarjeta de Estadísticas
function StatCard({ title, value, icon: Icon, color }) {
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        red: 'bg-red-100 text-red-600',
        purple: 'bg-purple-100 text-purple-600'
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                    <p className="text-3xl font-bold text-gray-900">{value}</p>
                </div>
                <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                    <Icon className="h-8 w-8"/>
                </div>
            </div>
        </div>
    );
}

// Componente de Modal de Confirmación de Eliminación
function DeleteConfirmModal({ user, onConfirm, onClose }) {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mx-auto mb-4">
                    <AlertCircle className="h-7 w-7 text-red-600"/>
                </div>

                <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                    ¿Eliminar Usuario?
                </h3>

                <p className="text-gray-600 text-center mb-6">
                    ¿Estás seguro de que deseas eliminar a <strong>{user.first_name} {user.last_name}</strong>? Esta acción no se puede deshacer.
                </p>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start space-x-2">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5"/>
                        <div className="text-sm text-red-800">
                            <p className="font-semibold mb-1">Esto eliminará:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>El perfil del usuario</li>
                                <li>Todos sus datos personales</li>
                                <li>Su historial de actividad</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="flex space-x-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                    >
                        Sí, Eliminar
                    </button>
                </div>
            </div>
        </div>
    );
}