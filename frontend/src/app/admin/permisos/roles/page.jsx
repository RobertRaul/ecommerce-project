'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Users, Key, Edit, CheckCircle, XCircle, Eye } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function RolesPage() {
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedRole, setSelectedRole] = useState(null);
    const [showPermissionsModal, setShowPermissionsModal] = useState(false);

    useEffect(() => {
        fetchRoles();
        fetchPermissions();
    }, []);

    const fetchRoles = async () => {
        try {
            const response = await api.get('/roles/');
            const data = response.data.results || response.data;
            setRoles(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al cargar roles');
            setRoles([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchPermissions = async () => {
        try {
            const response = await api.get('/permissions/by_category/');
            setPermissions(response.data || {});
        } catch (error) {
            console.error('Error:', error);
            setPermissions({});
        }
    };

    const handleViewPermissions = (role) => {
        setSelectedRole(role);
        setShowPermissionsModal(true);
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
                        <Shield className="h-8 w-8 text-purple-600" />
                        <span>Roles del Sistema</span>
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Gestiona los roles y sus permisos asociados
                    </p>
                </div>

                {/* Roles Grid */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {roles.map((role) => (
                            <div
                                key={role.id}
                                className="bg-white rounded-lg shadow-sm border-2 border-gray-200 hover:border-purple-500 transition overflow-hidden"
                            >
                                {/* Header */}
                                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
                                    <div className="flex items-start justify-between mb-3">
                                        <Shield className="h-8 w-8 text-purple-600" />
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(role.name)}`}>
                                            {role.is_active ? (
                                                <span className="flex items-center space-x-1">
                                                    <CheckCircle className="h-3 w-3" />
                                                    <span>Activo</span>
                                                </span>
                                            ) : (
                                                <span className="flex items-center space-x-1">
                                                    <XCircle className="h-3 w-3" />
                                                    <span>Inactivo</span>
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">{role.display_name}</h3>
                                    <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                                </div>

                                {/* Stats */}
                                <div className="p-6">
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                                            <div className="flex items-center justify-center mb-1">
                                                <Key className="h-5 w-5 text-purple-600" />
                                            </div>
                                            <p className="text-2xl font-bold text-purple-600">{role.permission_count}</p>
                                            <p className="text-xs text-gray-600">Permisos</p>
                                        </div>
                                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                                            <div className="flex items-center justify-center mb-1">
                                                <Users className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <p className="text-2xl font-bold text-blue-600">{role.user_count}</p>
                                            <p className="text-xs text-gray-600">Usuarios</p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <button
                                        onClick={() => handleViewPermissions(role)}
                                        className="w-full inline-flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition"
                                    >
                                        <Eye className="h-4 w-4" />
                                        <span>Ver Permisos</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Permissions Modal */}
            {showPermissionsModal && selectedRole && (
                <div 
                    className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setShowPermissionsModal(false)}
                >
                    <div 
                        className="bg-white rounded-xl max-w-3xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-500 to-blue-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold text-white">{selectedRole.display_name}</h3>
                                    <p className="text-purple-100 text-sm mt-1">
                                        {selectedRole.permission_count} permisos asignados
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowPermissionsModal(false)}
                                    className="text-white hover:bg-white/20 p-2 rounded-lg transition"
                                >
                                    <XCircle className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            <div className="space-y-4">
                                {selectedRole.permissions && selectedRole.permissions.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {selectedRole.permissions.map((permission, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
                                            >
                                                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                                <span className="text-sm text-gray-700">{permission}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Key className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-gray-600">Este rol no tiene permisos asignados</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
