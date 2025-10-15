from django.core.management.base import BaseCommand
from permissions.models import Role, Permission, RolePermission

#
# # 1. Crear migraciones
# python manage.py makemigrations permissions
#
# # 2. Aplicar migraciones
# python manage.py migrate
#
# # 3. Inicializar permisos y roles
# python manage.py init_permissions
#
# # 4. Asignar rol a tu usuario (en shell)
# # 5. Reiniciar servidores
# #

class Command(BaseCommand):
    help = 'Inicializar roles y permisos del sistema'

    def handle(self, *args, **kwargs):
        self.stdout.write('Creando permisos...')
        self.create_permissions()
        
        self.stdout.write('Creando roles...')
        self.create_roles()
        
        self.stdout.write('Asignando permisos a roles...')
        self.assign_permissions_to_roles()
        
        self.stdout.write(self.style.SUCCESS('✓ Sistema de permisos inicializado exitosamente'))

    def create_permissions(self):
        """Crear todos los permisos del sistema"""
        permissions_data = [
            # Productos
            {'codename': 'products.view', 'name': 'Ver Productos', 'category': 'products', 'action': 'view'},
            {'codename': 'products.create', 'name': 'Crear Productos', 'category': 'products', 'action': 'create'},
            {'codename': 'products.edit', 'name': 'Editar Productos', 'category': 'products', 'action': 'edit'},
            {'codename': 'products.delete', 'name': 'Eliminar Productos', 'category': 'products', 'action': 'delete'},
            {'codename': 'products.manage_stock', 'name': 'Gestionar Stock', 'category': 'products', 'action': 'manage'},
            
            # Órdenes
            {'codename': 'orders.view', 'name': 'Ver Órdenes', 'category': 'orders', 'action': 'view'},
            {'codename': 'orders.create', 'name': 'Crear Órdenes', 'category': 'orders', 'action': 'create'},
            {'codename': 'orders.edit', 'name': 'Editar Órdenes', 'category': 'orders', 'action': 'edit'},
            {'codename': 'orders.delete', 'name': 'Eliminar Órdenes', 'category': 'orders', 'action': 'delete'},
            {'codename': 'orders.update_status', 'name': 'Actualizar Estado de Órdenes', 'category': 'orders', 'action': 'manage'},
            
            # Clientes
            {'codename': 'customers.view', 'name': 'Ver Clientes', 'category': 'customers', 'action': 'view'},
            {'codename': 'customers.edit', 'name': 'Editar Clientes', 'category': 'customers', 'action': 'edit'},
            {'codename': 'customers.delete', 'name': 'Eliminar Clientes', 'category': 'customers', 'action': 'delete'},
            
            # Reportes
            {'codename': 'reports.view', 'name': 'Ver Reportes', 'category': 'reports', 'action': 'view'},
            {'codename': 'reports.export', 'name': 'Exportar Reportes', 'category': 'reports', 'action': 'export'},
            
            # Configuración
            {'codename': 'settings.view', 'name': 'Ver Configuración', 'category': 'settings', 'action': 'view'},
            {'codename': 'settings.edit', 'name': 'Editar Configuración', 'category': 'settings', 'action': 'edit'},
            
            # Usuarios
            {'codename': 'users.view', 'name': 'Ver Usuarios', 'category': 'users', 'action': 'view'},
            {'codename': 'users.create', 'name': 'Crear Usuarios', 'category': 'users', 'action': 'create'},
            {'codename': 'users.edit', 'name': 'Editar Usuarios', 'category': 'users', 'action': 'edit'},
            {'codename': 'users.delete', 'name': 'Eliminar Usuarios', 'category': 'users', 'action': 'delete'},
            {'codename': 'users.manage_roles', 'name': 'Gestionar Roles de Usuarios', 'category': 'users', 'action': 'manage'},
            
            # Cupones
            {'codename': 'coupons.view', 'name': 'Ver Cupones', 'category': 'coupons', 'action': 'view'},
            {'codename': 'coupons.create', 'name': 'Crear Cupones', 'category': 'coupons', 'action': 'create'},
            {'codename': 'coupons.edit', 'name': 'Editar Cupones', 'category': 'coupons', 'action': 'edit'},
            {'codename': 'coupons.delete', 'name': 'Eliminar Cupones', 'category': 'coupons', 'action': 'delete'},
        ]

        for perm_data in permissions_data:
            permission, created = Permission.objects.get_or_create(
                codename=perm_data['codename'],
                defaults={
                    'name': perm_data['name'],
                    'category': perm_data['category'],
                    'action': perm_data['action'],
                    'is_active': True
                }
            )
            if created:
                self.stdout.write(f'  ✓ Creado: {permission.name}')

    def create_roles(self):
        """Crear roles del sistema"""
        roles_data = [
            {
                'name': 'super_admin',
                'display_name': 'Super Administrador',
                'description': 'Acceso total al sistema. Puede gestionar usuarios, roles y configuración.'
            },
            {
                'name': 'admin',
                'display_name': 'Administrador',
                'description': 'Puede gestionar productos, órdenes y clientes. No puede modificar configuración del sistema.'
            },
            {
                'name': 'inventory_manager',
                'display_name': 'Gestor de Inventario',
                'description': 'Solo puede gestionar productos y stock. Puede ver órdenes relacionadas.'
            },
            {
                'name': 'order_manager',
                'display_name': 'Gestor de Órdenes',
                'description': 'Gestiona órdenes y actualiza estados. Puede ver información de clientes.'
            },
            {
                'name': 'viewer',
                'display_name': 'Visor',
                'description': 'Solo lectura. Puede ver productos, órdenes y reportes sin poder modificar.'
            },
        ]

        for role_data in roles_data:
            role, created = Role.objects.get_or_create(
                name=role_data['name'],
                defaults={
                    'display_name': role_data['display_name'],
                    'description': role_data['description'],
                    'is_active': True
                }
            )
            if created:
                self.stdout.write(f'  ✓ Creado: {role.display_name}')

    def assign_permissions_to_roles(self):
        """Asignar permisos a cada rol"""
        
        # Super Admin - Todos los permisos
        super_admin = Role.objects.get(name='super_admin')
        all_permissions = Permission.objects.filter(is_active=True)
        for permission in all_permissions:
            RolePermission.objects.get_or_create(role=super_admin, permission=permission)
        self.stdout.write(f'  ✓ {super_admin.display_name}: {all_permissions.count()} permisos')

        # Admin - Todo excepto gestión de usuarios y roles
        admin = Role.objects.get(name='admin')
        admin_permissions = Permission.objects.filter(
            is_active=True
        ).exclude(
            codename__in=['users.manage_roles', 'settings.edit']
        )
        for permission in admin_permissions:
            RolePermission.objects.get_or_create(role=admin, permission=permission)
        self.stdout.write(f'  ✓ {admin.display_name}: {admin_permissions.count()} permisos')

        # Inventory Manager - Solo productos
        inventory_manager = Role.objects.get(name='inventory_manager')
        inventory_permissions = Permission.objects.filter(
            is_active=True,
            codename__in=[
                'products.view', 'products.create', 'products.edit',
                'products.manage_stock', 'orders.view'
            ]
        )
        for permission in inventory_permissions:
            RolePermission.objects.get_or_create(role=inventory_manager, permission=permission)
        self.stdout.write(f'  ✓ {inventory_manager.display_name}: {inventory_permissions.count()} permisos')

        # Order Manager - Solo órdenes y clientes
        order_manager = Role.objects.get(name='order_manager')
        order_permissions = Permission.objects.filter(
            is_active=True,
            codename__in=[
                'orders.view', 'orders.edit', 'orders.update_status',
                'customers.view', 'products.view'
            ]
        )
        for permission in order_permissions:
            RolePermission.objects.get_or_create(role=order_manager, permission=permission)
        self.stdout.write(f'  ✓ {order_manager.display_name}: {order_permissions.count()} permisos')

        # Viewer - Solo lectura
        viewer = Role.objects.get(name='viewer')
        viewer_permissions = Permission.objects.filter(
            is_active=True,
            action='view'
        )
        for permission in viewer_permissions:
            RolePermission.objects.get_or_create(role=viewer, permission=permission)
        self.stdout.write(f'  ✓ {viewer.display_name}: {viewer_permissions.count()} permisos')
