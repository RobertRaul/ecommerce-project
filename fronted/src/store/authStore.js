import {create} from 'zustand';
import api from '@/lib/api';

const useAuthStore = create((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,

    // Inicializar desde localStorage
    init: () => {
        if (typeof window !== 'undefined') {
            const user = localStorage.getItem('user');
            const token = localStorage.getItem('access_token');

            if (user && token) {
                try {
                    set({
                        user: JSON.parse(user),
                        isAuthenticated: true,
                        isLoading: false
                    });
                } catch (error) {
                    console.error('Error al parsear usuario:', error);
                    localStorage.removeItem('user');
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    set({isLoading: false, isAuthenticated: false, user: null});
                }
            } else {
                set({isLoading: false});
            }
        }
    },

    // Login
    login: async (email, password) => {
        try {
            const response = await api.post('/auth/login/', {email, password});

            // Manejar diferentes formatos de respuesta
            const access = response.data.access || response.data.tokens?.access;
            const refresh = response.data.refresh || response.data.tokens?.refresh;
            const user = response.data.user;

            if (!access || !user) {
                throw new Error('Respuesta de login inválida');
            }

            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);
            localStorage.setItem('user', JSON.stringify(user));

            set({user, isAuthenticated: true});
            return {success: true};
        } catch (error) {
            console.error('Error en login:', error);
            return {
                success: false,
                error: error.response?.data?.detail || error.message || 'Error al iniciar sesión'
            };
        }
    },

    // Register
    register: async (userData) => {
        try {
            const response = await api.post('/auth/register/', userData);
            const {tokens, user} = response.data;

            if (!tokens?.access || !user) {
                throw new Error('Respuesta de registro inválida');
            }

            localStorage.setItem('access_token', tokens.access);
            localStorage.setItem('refresh_token', tokens.refresh);
            localStorage.setItem('user', JSON.stringify(user));

            set({user, isAuthenticated: true});
            return {success: true};
        } catch (error) {
            console.error('Error en registro:', error);
            return {
                success: false,
                error: error.response?.data || 'Error al registrarse'
            };
        }
    },

    // Logout
    logout: async () => {
        try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
                try {
                    await api.post('/auth/logout/', {refresh: refreshToken});
                    console.log('✅ Token invalidado en el servidor');
                } catch (error) {
                    // Si falla el blacklist, no es crítico
                    // El token expirará eventualmente
                    console.warn('⚠️ No se pudo invalidar el token en el servidor:', error.response?.data);
                }
            }
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        } finally {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            set({user: null, isAuthenticated: false});
        }
    },

    // Actualizar perfil
    updateProfile: async (profileData) => {
        try {
            const response = await api.put('/auth/profile/', profileData);
            const updatedUser = response.data;

            localStorage.setItem('user', JSON.stringify(updatedUser));
            set({user: updatedUser});
            return {success: true};
        } catch (error) {
            console.error('Error al actualizar perfil:', error);
            return {
                success: false,
                error: error.response?.data || 'Error al actualizar perfil'
            };
        }
    },

    // Refrescar datos del usuario desde el servidor
    refreshUser: async () => {
        try {
            const response = await api.get('/auth/profile/');
            const user = response.data;

            localStorage.setItem('user', JSON.stringify(user));
            set({user});

            return {success: true};
        } catch (error) {
            console.error('Error al refrescar usuario:', error);
            return {success: false};
        }
    },
}));

export default useAuthStore;