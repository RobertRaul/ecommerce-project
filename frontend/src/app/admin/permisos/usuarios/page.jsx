'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Users, UserCog, Search, Plus, X, CheckCircle } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function UsuariosPermisosPage() {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [userRoles, setUserRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedRole, setSelectedRole] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, rolesRes, userRolesRes] = await Promise.all([
                api.get('/auth/users/'),
                api.get('/roles/'),
                api.get('/user-roles/')
            ]);

            setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
            setRoles(Array.isArray(rolesRes.data) ? rolesRes.data : []);
            setUserRoles(Array.isArray(userRolesRes.data) ? userRolesRes.data : []);
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al cargar datos');
            setUsers([]);
            setRoles([]);
            setUserRoles([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAssignRole = async () => {
        if (!selectedUser || !selectedRole) {
            toast.error('Selecciona un usuario y un rol');
            return;
        }

        try {
            await api.post('/user-roles/assign_role/', {
                user_id: selectedUser.id,
                role_id: selectedRole
            });

            toast.success('Rol asignado exitosamente');
            setShowAssignModal(false);
            setSelectedUser(null);
            setSelectedRole('');
            fetchData();
        } catch (error) {
            console.error('Error:', error);
            toast.error(error.response?.data?.error || 'Error al asignar rol');
        }
    };

    const handleRevokeRole = async (userId, roleId) => {
        if (!confirm('¿Estás seguro de revocar este rol?')) return;

        try {
            await api.post('/user-roles/revoke_role/', {
                user_id: userId,
                role_id: roleId
            });

            toast.success('Rol revocado exitosamente');
            fetchData();
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al revocar rol');
        }
    };

    const getUserRoles = (userId) => {
        return userRoles.filter(ur => ur.user === userId && ur.is_active);
    };

    const getRoleById = (roleId) => {
        return roles.find(r => r.id === roleId);
    };

    const getRoleBadgeColor = (roleName) => {
        const colors = {
            'super_admin': 'bg-red-100 text-red-800 border-red-200',
            'admin': 'bg-purple-100 text-purple-800 border-purple-200',
            'inventory_manager': 'bg-blue-100 text-blue-800 border-blue-200',
            'order_manager': 'bg-green-100 text-green-800 border-green-200',
            'viewer': 'bg-gray-100 text-gray-800 border-gray-200',
        };
        return colors[roleName] || 'bg-gray-100 text-gray-800';
    };

    const filteredUsers = users.filter(user => 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                        <UserCog className="h-8 w-8 text-blue-600" />
                        <span>Gestión de Roles de Usuarios</span>
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Asigna roles a usuarios para controlar sus permisos en el sistema
                    </p>
                </div>

                {/* Search Bar */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email o usuario..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Users List */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Usuario
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Roles Asignados
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Estado
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                                <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                                <p>No se encontraron usuarios</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map((user) => {
                                            const userRolesList = getUserRoles(user.id);
                                            return (
                                                <tr key={user.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="h-10 w-10 flex-shrink-0">
                                                                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                                                                    {user.first_name?.[0] || user.username?.[0] || 'U'}
                                                                </div>
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {user.first_name} {user.last_name} {user.username && `(${user.username})`}
                                                                </div>
                                                                {user.is_superuser && (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                                        <Shield className="h-3 w-3 mr-1" />
                                                                        Superusuario
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{user.email}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-wrap gap-2">
                                                            {userRolesList.length === 0 ? (
                                                                <span className="text-sm text-gray-400 italic">Sin roles</span>
                                                            ) : (
                                                                userRolesList.map((ur) => {
                                                                    const role = getRoleById(ur.role);
                                                                    if (!role) return null;
                                                                    return (
                                                                        <div
                                                                            key={ur.id}
                                                                            className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(role.name)}`}
                                                                        >
                                                                            <span>{role.display_name}</span>
                                                                            <button
                                                                                onClick={() => handleRevokeRole(user.id, role.id)}
                                                                                className="hover:bg-black/10 rounded-full p-0.5"
                                                                            >
                                                                                <X className="h-3 w-3" />
                                                                            </button>
                                                                        </div>
                                                                    );
                                                                })
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {user.is_active ? (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                                Activo
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                                                Inactivo
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedUser(user);
                                                                setShowAssignModal(true);
                                                            }}
                                                            className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-900"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                            <span>Asignar Rol</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Assign Role Modal */}
            {showAssignModal && selectedUser && (
                <div 
                    className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setShowAssignModal(false)}
                >
                    <div 
                        className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Asignar Rol</h3>
                            <button
                                onClick={() => setShowAssignModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="mb-6">
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center space-x-3">
                                    <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                                        {selectedUser.first_name?.[0] || selectedUser.username?.[0] || 'U'}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            {selectedUser.first_name} {selectedUser.last_name}
                                        </p>
                                        <p className="text-sm text-gray-600">{selectedUser.email}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Seleccionar Rol
                            </label>
                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">-- Seleccionar rol --</option>
                                {roles.filter(r => r.is_active).map((role) => (
                                    <option key={role.id} value={role.id}>
                                        {role.display_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowAssignModal(false)}
                                className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAssignRole}
                                disabled={!selectedRole}
                                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Asignar Rol
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
