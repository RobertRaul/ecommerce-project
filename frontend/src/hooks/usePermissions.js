import { useState, useEffect } from 'react';
import api from '@/lib/api';
import useAuthStore from '@/store/authStore';

/**
 * Hook personalizado para gestionar permisos del usuario
 * 
 * @returns {Object} - Objeto con permisos y funciones de verificación
 * 
 * @example
 * const { permissions, hasPermission, hasAnyPermission, hasRole, loading } = usePermissions();
 * 
 * if (hasPermission('products.create')) {
 *   // Mostrar botón de crear
 * }
 */
export default function usePermissions() {
    const [permissions, setPermissions] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuthStore();

    useEffect(() => {
        if (user) {
            fetchPermissions();
        } else {
            setPermissions([]);
            setRoles([]);
            setLoading(false);
        }
    }, [user]);

    const fetchPermissions = async () => {
        try {
            const response = await api.get('/user-roles/my_permissions/');
            setPermissions(response.data.permissions || []);
            setRoles(response.data.roles || []);
        } catch (error) {
            console.error('Error al cargar permisos:', error);
            setPermissions([]);
            setRoles([]);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Verifica si el usuario tiene un permiso específico
     * @param {string} permission - Código del permiso (ej: 'products.create')
     * @returns {boolean}
     */
    const hasPermission = (permission) => {
        if (!user) return false;
        if (user.is_superuser) return true;
        return permissions.includes(permission);
    };

    /**
     * Verifica si el usuario tiene al menos uno de los permisos
     * @param {string[]} permissionList - Array de códigos de permisos
     * @returns {boolean}
     */
    const hasAnyPermission = (permissionList) => {
        if (!user) return false;
        if (user.is_superuser) return true;
        return permissionList.some(perm => permissions.includes(perm));
    };

    /**
     * Verifica si el usuario tiene todos los permisos
     * @param {string[]} permissionList - Array de códigos de permisos
     * @returns {boolean}
     */
    const hasAllPermissions = (permissionList) => {
        if (!user) return false;
        if (user.is_superuser) return true;
        return permissionList.every(perm => permissions.includes(perm));
    };

    /**
     * Verifica si el usuario tiene un rol específico
     * @param {string} role - Nombre del rol (ej: 'admin')
     * @returns {boolean}
     */
    const hasRole = (roleName) => {
        if (!user) return false;
        if (user.is_superuser && roleName === 'super_admin') return true;
        return roles.includes(roleName);
    };

    /**
     * Verifica si el usuario tiene alguno de los roles
     * @param {string[]} roleList - Array de nombres de roles
     * @returns {boolean}
     */
    const hasAnyRole = (roleList) => {
        if (!user) return false;
        if (user.is_superuser) return true;
        return roleList.some(role => roles.includes(role));
    };

    return {
        permissions,
        roles,
        loading,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasRole,
        hasAnyRole,
        isSuperuser: user?.is_superuser || false
    };
}
