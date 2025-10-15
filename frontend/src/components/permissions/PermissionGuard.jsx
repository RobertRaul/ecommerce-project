'use client';

import { AlertCircle } from 'lucide-react';
import usePermissions from '@/hooks/usePermissions';

/**
 * Componente para mostrar contenido solo si el usuario tiene el permiso
 * 
 * @param {Object} props
 * @param {string|string[]} props.permission - Permiso(s) requerido(s)
 * @param {boolean} props.requireAll - Si es true, requiere todos los permisos. Default: false
 * @param {React.ReactNode} props.children - Contenido a mostrar
 * @param {React.ReactNode} props.fallback - Contenido alternativo si no tiene permiso
 * 
 * @example
 * <PermissionGuard permission="products.create">
 *   <button>Crear Producto</button>
 * </PermissionGuard>
 * 
 * @example
 * <PermissionGuard permission={['products.edit', 'products.delete']} requireAll={true}>
 *   <EditButton />
 * </PermissionGuard>
 */
export function PermissionGuard({ permission, requireAll = false, children, fallback = null }) {
    const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions();

    if (loading) {
        return null; // O un loader
    }

    // Si permission es un array
    if (Array.isArray(permission)) {
        const hasAccess = requireAll 
            ? hasAllPermissions(permission)
            : hasAnyPermission(permission);

        return hasAccess ? children : fallback;
    }

    // Si permission es un string
    return hasPermission(permission) ? children : fallback;
}

/**
 * Componente para mostrar contenido solo si el usuario tiene el rol
 * 
 * @param {Object} props
 * @param {string|string[]} props.role - Rol(es) requerido(s)
 * @param {React.ReactNode} props.children - Contenido a mostrar
 * @param {React.ReactNode} props.fallback - Contenido alternativo si no tiene el rol
 * 
 * @example
 * <RoleGuard role="admin">
 *   <AdminPanel />
 * </RoleGuard>
 * 
 * @example
 * <RoleGuard role={['admin', 'inventory_manager']}>
 *   <InventoryTools />
 * </RoleGuard>
 */
export function RoleGuard({ role, children, fallback = null }) {
    const { hasRole, hasAnyRole, loading } = usePermissions();

    if (loading) {
        return null;
    }

    // Si role es un array
    if (Array.isArray(role)) {
        return hasAnyRole(role) ? children : fallback;
    }

    // Si role es un string
    return hasRole(role) ? children : fallback;
}

/**
 * Mensaje de acceso denegado
 */
export function AccessDenied({ message = 'No tienes permiso para ver este contenido' }) {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center max-w-md">
                <div className="mb-4 flex justify-center">
                    <div className="bg-red-100 rounded-full p-4">
                        <AlertCircle className="h-12 w-12 text-red-600" />
                    </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Acceso Denegado</h3>
                <p className="text-gray-600">{message}</p>
            </div>
        </div>
    );
}

/**
 * Componente que verifica permisos y muestra mensaje de acceso denegado
 */
export function ProtectedContent({ permission, role, requireAll = false, children }) {
    if (permission) {
        return (
            <PermissionGuard 
                permission={permission} 
                requireAll={requireAll}
                fallback={<AccessDenied />}
            >
                {children}
            </PermissionGuard>
        );
    }

    if (role) {
        return (
            <RoleGuard role={role} fallback={<AccessDenied />}>
                {children}
            </RoleGuard>
        );
    }

    return children;
}
