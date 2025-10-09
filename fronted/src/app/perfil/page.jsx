'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, MapPin, Lock, Save, Edit2 } from 'lucide-react';
import Layout from '@/components/Layout';
import useAuthStore from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, updateProfile, refreshUser, init } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    city: '',
    department: '',
    postal_code: '',
  });

  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    new_password2: '',
  });

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/perfil');
      return;
    }

    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        department: user.department || '',
        postal_code: user.postal_code || '',
      });
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Resto del código igual...
  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await updateProfile(profileData);

    if (result.success) {
      toast.success('Perfil actualizado exitosamente');
      await refreshUser(); // Refrescar datos del usuario
    } else {
      toast.error(result.error || 'Error al actualizar perfil');
    }

    setLoading(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.new_password !== passwordData.new_password2) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (passwordData.new_password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);

    try {
      await api.put('/auth/change-password/', passwordData);
      toast.success('Contraseña actualizada exitosamente');
      setPasswordData({
        old_password: '',
        new_password: '',
        new_password2: '',
      });
    } catch (error) {
      const errorMsg = error.response?.data?.old_password?.[0] || 'Error al cambiar contraseña';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Mostrar loading mientras se inicializa
  if (isLoading) {
    return (
        <Layout>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando...</p>
          </div>
        </Layout>
    );
  }

  return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Mi Perfil</h1>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-white text-3xl font-bold mb-4">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {user?.first_name} {user?.last_name}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</p>
                </div>

                <nav className="space-y-2">
                  <button
                      onClick={() => setActiveTab('info')}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                          activeTab === 'info'
                              ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                  >
                    <User className="h-5 w-5" />
                    <span className="font-medium">Información Personal</span>
                  </button>

                  <button
                      onClick={() => setActiveTab('password')}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                          activeTab === 'password'
                              ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                  >
                    <Lock className="h-5 w-5" />
                    <span className="font-medium">Cambiar Contraseña</span>
                  </button>
                </nav>

                {/* Stats */}
                {user?.profile && (
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Total de órdenes:</span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                        {user.profile.total_orders}
                      </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Total gastado:</span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                        S/ {user.profile.total_spent}
                      </span>
                        </div>
                      </div>
                    </div>
                )}
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {activeTab === 'info' && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Información Personal
                      </h2>
                      <Edit2 className="h-5 w-5 text-gray-400" />
                    </div>

                    <form onSubmit={handleProfileSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* First Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Nombre
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                name="first_name"
                                value={profileData.first_name}
                                onChange={handleProfileChange}
                                className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                        </div>

                        {/* Last Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Apellido
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                name="last_name"
                                value={profileData.last_name}
                                onChange={handleProfileChange}
                                className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                        </div>

                        {/* Email (read-only) */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Correo Electrónico
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="email"
                                value={user.email || ''}
                                disabled
                                className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                            />
                          </div>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            El correo no se puede cambiar
                          </p>
                        </div>

                        {/* Phone */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Teléfono
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Phone className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="tel"
                                name="phone"
                                value={profileData.phone}
                                onChange={handleProfileChange}
                                className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                placeholder="999 999 999"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Address Section */}
                      <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                          <MapPin className="h-5 w-5 text-purple-600" />
                          <span>Dirección</span>
                        </h3>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Dirección Completa
                            </label>
                            <input
                                type="text"
                                name="address"
                                value={profileData.address}
                                onChange={handleProfileChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                placeholder="Av. Principal 123, Dpto 456"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Departamento
                              </label>
                              <select
                                  name="department"
                                  value={profileData.department}
                                  onChange={handleProfileChange}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              >
                                <option value="">Seleccionar</option>
                                <option value="Lima">Lima</option>
                                <option value="Arequipa">Arequipa</option>
                                <option value="Cusco">Cusco</option>
                                <option value="Trujillo">Trujillo</option>
                                <option value="Chiclayo">Chiclayo</option>
                                <option value="Piura">Piura</option>
                                <option value="Iquitos">Iquitos</option>
                                <option value="Ayacucho">Ayacucho</option>
                                <option value="Huancayo">Huancayo</option>
                                <option value="Cajamarca">Cajamarca</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Ciudad
                              </label>
                              <input
                                  type="text"
                                  name="city"
                                  value={profileData.city}
                                  onChange={handleProfileChange}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Código Postal
                              </label>
                              <input
                                  type="text"
                                  name="postal_code"
                                  value={profileData.postal_code}
                                  onChange={handleProfileChange}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                          type="submit"
                          disabled={loading}
                          className="w-full flex items-center justify-center space-x-2 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        <Save className="h-5 w-5" />
                        <span>{loading ? 'Guardando...' : 'Guardar Cambios'}</span>
                      </button>
                    </form>
                  </div>
              )}

              {/* Password tab - código anterior igual */}
              {activeTab === 'password' && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    {/* ...código anterior de cambio de contraseña... */}
                  </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
  );
}