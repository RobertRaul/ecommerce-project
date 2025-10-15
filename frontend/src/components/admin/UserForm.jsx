'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    User, Mail, Phone, Shield, Eye, EyeOff,
    AlertCircle, ArrowLeft, Save
} from 'lucide-react';

export default function UserForm({ onSubmit, loading = false, initialData = null, isEdit = false }) {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [formData, setFormData] = useState({
        email: '',
        username: '',
        first_name: '',
        last_name: '',
        phone: '',
        password: '',
        confirm_password: '',
        is_staff: false,
        is_superuser: false,
        is_active: true
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (initialData) {
            setFormData({
                email: initialData.email || '',
                username: initialData.username || '',
                first_name: initialData.first_name || '',
                last_name: initialData.last_name || '',
                phone: initialData.phone || '',
                password: '',
                confirm_password: '',
                is_staff: initialData.is_staff || false,
                is_superuser: initialData.is_superuser || false,
                is_active: initialData.is_active !== undefined ? initialData.is_active : true
            });
        }
    }, [initialData]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.email) {
            newErrors.email = 'El email es requerido';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email inválido';
        }

        if (!formData.username) {
            newErrors.username = 'El nombre de usuario es requerido';
        } else if (formData.username.length < 3) {
            newErrors.username = 'Mínimo 3 caracteres';
        }

        if (!formData.first_name) {
            newErrors.first_name = 'El nombre es requerido';
        }

        if (!formData.last_name) {
            newErrors.last_name = 'El apellido es requerido';
        }

        if (!isEdit) {
            if (!formData.password) {
                newErrors.password = 'La contraseña es requerida';
            } else if (formData.password.length < 8) {
                newErrors.password = 'Mínimo 8 caracteres';
            }

            if (!formData.confirm_password) {
                newErrors.confirm_password = 'Confirma la contraseña';
            } else if (formData.password !== formData.confirm_password) {
                newErrors.confirm_password = 'Las contraseñas no coinciden';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const submitData = {
            email: formData.email,
            username: formData.username,
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone,
            is_staff: formData.is_staff,
            is_superuser: formData.is_superuser,
            is_active: formData.is_active
        };

        if (!isEdit) {
            submitData.password = formData.password;
        }

        onSubmit(submitData);
    };

    return (
        <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
                <button
                    onClick={() => router.back()}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition mb-4"
                >
                    <ArrowLeft className="h-5 w-5" />
                    <span>Volver</span>
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-8">
                {/* Información Personal */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                        <User className="h-5 w-5 text-blue-600" />
                        <span>Información Personal</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nombre *
                            </label>
                            <input
                                type="text"
                                value={formData.first_name}
                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                className={`w-full px-4 py-2.5 border ${
                                    errors.first_name ? 'border-red-500' : 'border-gray-300'
                                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                placeholder="Juan"
                            />
                            {errors.first_name && (
                                <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>{errors.first_name}</span>
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Apellido *
                            </label>
                            <input
                                type="text"
                                value={formData.last_name}
                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                className={`w-full px-4 py-2.5 border ${
                                    errors.last_name ? 'border-red-500' : 'border-gray-300'
                                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                placeholder="Pérez"
                            />
                            {errors.last_name && (
                                <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>{errors.last_name}</span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Información de Cuenta */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                        <Mail className="h-5 w-5 text-blue-600" />
                        <span>Información de Cuenta</span>
                    </h3>
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className={`w-full px-4 py-2.5 border ${
                                        errors.email ? 'border-red-500' : 'border-gray-300'
                                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    placeholder="usuario@ejemplo.com"
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                                        <AlertCircle className="h-4 w-4" />
                                        <span>{errors.email}</span>
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nombre de Usuario *
                                </label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className={`w-full px-4 py-2.5 border ${
                                        errors.username ? 'border-red-500' : 'border-gray-300'
                                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    placeholder="juanperez"
                                />
                                {errors.username && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                                        <AlertCircle className="h-4 w-4" />
                                        <span>{errors.username}</span>
                                    </p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Teléfono
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="999 999 999"
                            />
                        </div>
                    </div>
                </div>

                {/* Contraseña (solo para crear) */}
                {!isEdit && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Contraseña
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Contraseña *
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className={`w-full px-4 py-2.5 pr-12 border ${
                                            errors.password ? 'border-red-500' : 'border-gray-300'
                                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                                        <AlertCircle className="h-4 w-4" />
                                        <span>{errors.password}</span>
                                    </p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">Mínimo 8 caracteres</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Confirmar Contraseña *
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={formData.confirm_password}
                                        onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                                        className={`w-full px-4 py-2.5 pr-12 border ${
                                            errors.confirm_password ? 'border-red-500' : 'border-gray-300'
                                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                {errors.confirm_password && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                                        <AlertCircle className="h-4 w-4" />
                                        <span>{errors.confirm_password}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Permisos y Estado */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                        <Shield className="h-5 w-5 text-blue-600" />
                        <span>Permisos y Estado</span>
                    </h3>
                    <div className="space-y-4">
                        <label className="flex items-start space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer transition">
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="mt-1 w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                            />
                            <div className="flex-1">
                                <div className="font-semibold text-gray-900">Usuario Activo</div>
                                <p className="text-sm text-gray-600 mt-1">
                                    El usuario puede iniciar sesión y acceder al sistema
                                </p>
                            </div>
                        </label>

                        <label className="flex items-start space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50/50 cursor-pointer transition">
                            <input
                                type="checkbox"
                                checked={formData.is_staff}
                                onChange={(e) => setFormData({ ...formData, is_staff: e.target.checked })}
                                className="mt-1 w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                            />
                            <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                    <Shield className="h-5 w-5 text-purple-600" />
                                    <span className="font-semibold text-gray-900">Staff</span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                    Permite acceso al panel de administración
                                </p>
                            </div>
                        </label>

                        <label className="flex items-start space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50/50 cursor-pointer transition">
                            <input
                                type="checkbox"
                                checked={formData.is_superuser}
                                onChange={(e) => setFormData({ ...formData, is_superuser: e.target.checked })}
                                className="mt-1 w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                            />
                            <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                    <Shield className="h-5 w-5 text-red-600" />
                                    <span className="font-semibold text-gray-900">Superusuario</span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                    Acceso total al sistema sin restricciones
                                </p>
                            </div>
                        </label>
                    </div>

                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start space-x-2">
                            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-yellow-800">
                                <strong>Nota:</strong> Los superusuarios tienen control total sobre el sistema.
                                Otorga este permiso solo a usuarios de confianza.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Botones */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                <span>Guardando...</span>
                            </>
                        ) : (
                            <>
                                <Save className="h-5 w-5" />
                                <span>{isEdit ? 'Actualizar Usuario' : 'Crear Usuario'}</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}