'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';
import Layout from '@/components/Layout';
import useAuthStore from '@/store/authStore';
import toast from 'react-hot-toast';

export default function RegisterPage() {
    const router = useRouter();
    const { register } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);
    const [showPassword2, setShowPassword2] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: '',
        password2: '',
        first_name: '',
        last_name: '',
        phone: '',
    });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        // Limpiar error del campo al escribir
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: '' });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.email) newErrors.email = 'El correo es requerido';
        if (!formData.username) newErrors.username = 'El usuario es requerido';
        if (!formData.password) newErrors.password = 'La contraseña es requerida';
        if (formData.password.length < 8) newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
        if (formData.password !== formData.password2) newErrors.password2 = 'Las contraseñas no coinciden';
        if (!formData.first_name) newErrors.first_name = 'El nombre es requerido';
        if (!formData.last_name) newErrors.last_name = 'El apellido es requerido';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Por favor corrige los errores del formulario');
            return;
        }

        setLoading(true);

        const result = await register(formData);

        if (result.success) {
            toast.success('¡Cuenta creada exitosamente!');
            router.push('/');
        } else {
            if (typeof result.error === 'object') {
                setErrors(result.error);
                Object.values(result.error).forEach(err => {
                    if (Array.isArray(err)) {
                        err.forEach(msg => toast.error(msg));
                    } else {
                        toast.error(err);
                    }
                });
            } else {
                toast.error(result.error || 'Error al crear cuenta');
            }
        }

        setLoading(false);
    };

    return (
        <Layout>
            <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl w-full space-y-8">
                    <div>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                            Crea tu cuenta
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            ¿Ya tienes cuenta?{' '}
                            <Link href="/login" className="font-medium text-purple-600 hover:text-purple-500">
                                Inicia sesión aquí
                            </Link>
                        </p>
                    </div>

                    <form className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-md" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* First Name */}
                            <div>
                                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="first_name"
                                        name="first_name"
                                        type="text"
                                        required
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        className={`appearance-none block w-full pl-10 px-3 py-2 border ${
                                            errors.first_name ? 'border-red-500' : 'border-gray-300'
                                        } rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
                                        placeholder="Juan"
                                    />
                                </div>
                                {errors.first_name && (
                                    <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                                )}
                            </div>

                            {/* Last Name */}
                            <div>
                                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                                    Apellido *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="last_name"
                                        name="last_name"
                                        type="text"
                                        required
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        className={`appearance-none block w-full pl-10 px-3 py-2 border ${
                                            errors.last_name ? 'border-red-500' : 'border-gray-300'
                                        } rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
                                        placeholder="Pérez"
                                    />
                                </div>
                                {errors.last_name && (
                                    <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                                )}
                            </div>

                            {/* Username */}
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                                    Usuario *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="username"
                                        name="username"
                                        type="text"
                                        required
                                        value={formData.username}
                                        onChange={handleChange}
                                        className={`appearance-none block w-full pl-10 px-3 py-2 border ${
                                            errors.username ? 'border-red-500' : 'border-gray-300'
                                        } rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
                                        placeholder="juanperez"
                                    />
                                </div>
                                {errors.username && (
                                    <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Correo Electrónico *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={`appearance-none block w-full pl-10 px-3 py-2 border ${
                                            errors.email ? 'border-red-500' : 'border-gray-300'
                                        } rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
                                        placeholder="tu@email.com"
                                    />
                                </div>
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                )}
                            </div>

                            {/* Phone */}
                            <div className="md:col-span-2">
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                                    Teléfono
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Phone className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="999 999 999"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                    Contraseña *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className={`appearance-none block w-full pl-10 pr-10 px-3 py-2 border ${
                                            errors.password ? 'border-red-500' : 'border-gray-300'
                                        } rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                        ) : (
                                            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label htmlFor="password2" className="block text-sm font-medium text-gray-700 mb-1">
                                    Confirmar Contraseña *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="password2"
                                        name="password2"
                                        type={showPassword2 ? 'text' : 'password'}
                                        required
                                        value={formData.password2}
                                        onChange={handleChange}
                                        className={`appearance-none block w-full pl-10 pr-10 px-3 py-2 border ${
                                            errors.password2 ? 'border-red-500' : 'border-gray-300'
                                        } rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword2(!showPassword2)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    >
                                        {showPassword2 ? (
                                            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                        ) : (
                                            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                        )}
                                    </button>
                                </div>
                                {errors.password2 && (
                                    <p className="mt-1 text-sm text-red-600">{errors.password2}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center">
                            <input
                                id="terms"
                                name="terms"
                                type="checkbox"
                                required
                                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            />
                            <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                                Acepto los{' '}
                                <Link href="/terminos" className="text-purple-600 hover:text-purple-500">
                                    términos y condiciones
                                </Link>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                        </button>
                    </form>
                </div>
            </div>
        </Layout>
    );
}