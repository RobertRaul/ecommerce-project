# 🔐 Sistema de Permisos - Guía de Uso

## 📚 Índice
1. [Hook usePermissions](#hook-usepermissions)
2. [Componentes Guard](#componentes-guard)
3. [Ejemplos Prácticos](#ejemplos-prácticos)
4. [Integración con el Sistema](#integración-con-el-sistema)

---

## 🎣 Hook usePermissions

### Importar y usar:

```javascript
import usePermissions from '@/hooks/usePermissions';

function MyComponent() {
    const { 
        permissions,      // Array de permisos del usuario
        roles,           // Array de roles del usuario
        loading,         // Estado de carga
        hasPermission,   // Función para verificar 1 permiso
        hasAnyPermission, // Función para verificar al menos 1 permiso
        hasAllPermissions, // Función para verificar todos los permisos
        hasRole,         // Función para verificar 1 rol
        hasAnyRole,      // Función para verificar al menos 1 rol
        isSuperuser      // Boolean si es superusuario
    } = usePermissions();

    // Uso básico
    if (hasPermission('products.create')) {
        // Mostrar botón de crear producto
    }
}
```

### Métodos disponibles:

#### `hasPermission(permission)`
Verifica si el usuario tiene un permiso específico.

```javascript
if (hasPermission('products.edit')) {
    // Usuario puede editar productos
}
```

#### `hasAnyPermission(permissionList)`
Verifica si el usuario tiene al menos uno de los permisos.

```javascript
if (hasAnyPermission(['products.edit', 'products.delete'])) {
    // Usuario puede editar O eliminar productos
}
```

#### `hasAllPermissions(permissionList)`
Verifica si el usuario tiene todos los permisos.

```javascript
if (hasAllPermissions(['products.edit', 'products.delete'])) {
    // Usuario puede editar Y eliminar productos
}
```

#### `hasRole(roleName)`
Verifica si el usuario tiene un rol específico.

```javascript
if (hasRole('admin')) {
    // Usuario es administrador
}
```

---

## 🛡️ Componentes Guard

### PermissionGuard

```javascript
import { PermissionGuard } from '@/components/permissions/PermissionGuard';

// Uso básico
<PermissionGuard permission="products.create">
    <button>Crear Producto</button>
</PermissionGuard>

// Con múltiples permisos (requiere al menos uno)
<PermissionGuard permission={['products.edit', 'products.delete']}>
    <EditButton />
</PermissionGuard>

// Con múltiples permisos (requiere todos)
<PermissionGuard 
    permission={['products.edit', 'products.delete']} 
    requireAll={true}
>
    <AdvancedEditor />
</PermissionGuard>
```

### RoleGuard

```javascript
import { RoleGuard } from '@/components/permissions/PermissionGuard';

<RoleGuard role="admin">
    <AdminPanel />
</RoleGuard>

<RoleGuard role={['admin', 'inventory_manager']}>
    <InventoryTools />
</RoleGuard>
```

### ProtectedContent

```javascript
import { ProtectedContent } from '@/components/permissions/PermissionGuard';

// Muestra AccessDenied si no tiene permiso
<ProtectedContent permission="products.create">
    <CreateProductForm />
</ProtectedContent>

<ProtectedContent role="admin">
    <AdminDashboard />
</ProtectedContent>
```

---

## 💡 Ejemplos Prácticos

### 1. Botón de Crear Producto (solo si tiene permiso)

```javascript
import { PermissionGuard } from '@/components/permissions/PermissionGuard';
import { Plus } from 'lucide-react';

function ProductsPage() {
    return (
        <div>
            <h1>Productos</h1>
            
            <PermissionGuard permission="products.create">
                <button className="btn-primary">
                    <Plus className="h-5 w-5" />
                    Crear Producto
                </button>
            </PermissionGuard>
            
            {/* Lista de productos */}
        </div>
    );
}
```

### 2. Botones de Acción Condicionales

```javascript
import usePermissions from '@/hooks/usePermissions';
import { Edit, Trash2, Eye } from 'lucide-react';

function ProductCard({ product }) {
    const { hasPermission } = usePermissions();

    return (
        <div className="product-card">
            <h3>{product.name}</h3>
            
            <div className="actions">
                {/* Todos pueden ver */}
                <button>
                    <Eye className="h-4 w-4" />
                </button>
                
                {/* Solo con permiso de editar */}
                {hasPermission('products.edit') && (
                    <button>
                        <Edit className="h-4 w-4" />
                    </button>
                )}
                
                {/* Solo con permiso de eliminar */}
                {hasPermission('products.delete') && (
                    <button>
                        <Trash2 className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
```

### 3. Menú Dinámico según Permisos

```javascript
import usePermissions from '@/hooks/usePermissions';
import Link from 'next/link';
import { Package, ShoppingCart, Users, Settings } from 'lucide-react';

function AdminMenu() {
    const { hasPermission, hasRole } = usePermissions();

    const menuItems = [
        {
            name: 'Productos',
            href: '/admin/productos',
            icon: Package,
            permission: 'products.view'
        },
        {
            name: 'Órdenes',
            href: '/admin/ordenes',
            icon: ShoppingCart,
            permission: 'orders.view'
        },
        {
            name: 'Clientes',
            href: '/admin/clientes',
            icon: Users,
            permission: 'customers.view'
        },
        {
            name: 'Configuración',
            href: '/admin/configuracion',
            icon: Settings,
            role: 'admin' // Requiere rol específico
        }
    ];

    return (
        <nav>
            {menuItems.map((item) => {
                // Verificar permiso o rol
                const hasAccess = item.permission 
                    ? hasPermission(item.permission)
                    : item.role 
                        ? hasRole(item.role)
                        : true;

                if (!hasAccess) return null;

                const Icon = item.icon;
                return (
                    <Link key={item.href} href={item.href}>
                        <Icon className="h-5 w-5" />
                        {item.name}
                    </Link>
                );
            })}
        </nav>
    );
}
```

### 4. Formulario con Campos Condicionales

```javascript
import usePermissions from '@/hooks/usePermissions';

function ProductForm() {
    const { hasPermission } = usePermissions();

    return (
        <form>
            {/* Campos básicos - todos pueden ver */}
            <input name="name" placeholder="Nombre" />
            <input name="description" placeholder="Descripción" />
            
            {/* Solo gestores de inventario pueden editar precio */}
            {hasPermission('products.manage_stock') && (
                <input name="price" type="number" placeholder="Precio" />
            )}
            
            {/* Solo admins pueden marcar como destacado */}
            {hasPermission('products.edit') && (
                <label>
                    <input type="checkbox" name="featured" />
                    Producto Destacado
                </label>
            )}
            
            <button type="submit">Guardar</button>
        </form>
    );
}
```

### 5. Página Protegida Completa

```javascript
import { ProtectedContent } from '@/components/permissions/PermissionGuard';

function AdminReportsPage() {
    return (
        <ProtectedContent permission="reports.view">
            <div>
                <h1>Reportes</h1>
                {/* Contenido de reportes */}
            </div>
        </ProtectedContent>
    );
}
```

### 6. Dashboard con Secciones Condicionales

```javascript
import { RoleGuard, PermissionGuard } from '@/components/permissions/PermissionGuard';

function Dashboard() {
    return (
        <div className="dashboard">
            {/* Estadísticas generales - todos */}
            <StatsCards />
            
            {/* Solo para admins */}
            <RoleGuard role={['admin', 'super_admin']}>
                <UserManagementSection />
            </RoleGuard>
            
            {/* Solo con permiso de reportes */}
            <PermissionGuard permission="reports.view">
                <SalesCharts />
            </PermissionGuard>
            
            {/* Solo gestores de inventario */}
            <RoleGuard role="inventory_manager">
                <LowStockAlerts />
            </RoleGuard>
        </div>
    );
}
```

---

## 🔧 Integración con el Sistema

### Proteger un ViewSet completo

```javascript
// pages/admin/productos/page.jsx
import { ProtectedContent } from '@/components/permissions/PermissionGuard';

export default function ProductosPage() {
    return (
        <ProtectedContent permission="products.view">
            <AdminLayout>
                {/* Contenido de productos */}
            </AdminLayout>
        </ProtectedContent>
    );
}
```

### Deshabilitar botones según permisos

```javascript
import usePermissions from '@/hooks/usePermissions';

function ActionButtons({ product }) {
    const { hasPermission } = usePermissions();
    const canEdit = hasPermission('products.edit');
    const canDelete = hasPermission('products.delete');

    return (
        <div className="flex space-x-2">
            <button 
                disabled={!canEdit}
                className={!canEdit ? 'opacity-50 cursor-not-allowed' : ''}
            >
                Editar
            </button>
            
            <button 
                disabled={!canDelete}
                className={!canDelete ? 'opacity-50 cursor-not-allowed' : ''}
            >
                Eliminar
            </button>
        </div>
    );
}
```

### Loading state mientras se cargan permisos

```javascript
import usePermissions from '@/hooks/usePermissions';

function MyComponent() {
    const { loading, hasPermission } = usePermissions();

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!hasPermission('products.view')) {
        return <AccessDenied />;
    }

    return <ProductsList />;
}
```

---

## 📋 Lista de Permisos Disponibles

### Productos
- `products.view` - Ver productos
- `products.create` - Crear productos
- `products.edit` - Editar productos
- `products.delete` - Eliminar productos
- `products.manage_stock` - Gestionar stock

### Órdenes
- `orders.view` - Ver órdenes
- `orders.create` - Crear órdenes
- `orders.edit` - Editar órdenes
- `orders.delete` - Eliminar órdenes
- `orders.update_status` - Actualizar estado

### Clientes
- `customers.view` - Ver clientes
- `customers.edit` - Editar clientes
- `customers.delete` - Eliminar clientes

### Reportes
- `reports.view` - Ver reportes
- `reports.export` - Exportar reportes

### Configuración
- `settings.view` - Ver configuración
- `settings.edit` - Editar configuración

### Usuarios
- `users.view` - Ver usuarios
- `users.create` - Crear usuarios
- `users.edit` - Editar usuarios
- `users.delete` - Eliminar usuarios
- `users.manage_roles` - Gestionar roles

### Cupones
- `coupons.view` - Ver cupones
- `coupons.create` - Crear cupones
- `coupons.edit` - Editar cupones
- `coupons.delete` - Eliminar cupones

---

## 🎯 Mejores Prácticas

1. **Siempre verifica permisos en el frontend Y backend**
   - Frontend: Para UX (ocultar/deshabilitar elementos)
   - Backend: Para seguridad (proteger endpoints)

2. **Usa los componentes Guard para UI condicional**
   ```javascript
   <PermissionGuard permission="products.create">
       <CreateButton />
   </PermissionGuard>
   ```

3. **Usa el hook para lógica condicional**
   ```javascript
   const { hasPermission } = usePermissions();
   if (hasPermission('products.edit')) {
       // Lógica...
   }
   ```

4. **Combina permisos y roles según necesites**
   ```javascript
   {(hasPermission('products.edit') || hasRole('admin')) && (
       <EditButton />
   )}
   ```

5. **Proporciona feedback al usuario**
   ```javascript
   <PermissionGuard 
       permission="products.delete"
       fallback={<p className="text-gray-500">No tienes permiso para eliminar</p>}
   >
       <DeleteButton />
   </PermissionGuard>
   ```
