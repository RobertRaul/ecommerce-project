"""
Script para poblar métodos de pago iniciales
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from orders.models import PaymentMethod


def populate_payment_methods():
    """Crear métodos de pago predeterminados"""

    payment_methods = [
        {
            'name': 'Yape',
            'code': 'yape',
            'description': 'Transferencias instantáneas por Yape',
            'is_enabled': True,
            'requires_proof': True,
            'icon': '📱',
            'display_order': 1
        },
        {
            'name': 'Plin',
            'code': 'plin',
            'description': 'Transferencias instantáneas por Plin',
            'is_enabled': True,
            'requires_proof': True,
            'icon': '💳',
            'display_order': 2
        },
        {
            'name': 'Transferencia Bancaria',
            'code': 'transfer',
            'description': 'Depósito o transferencia bancaria directa',
            'is_enabled': True,
            'requires_proof': True,
            'icon': '🏦',
            'display_order': 3
        },
        {
            'name': 'Tarjeta de Crédito/Débito',
            'code': 'card',
            'description': 'Pagos con tarjeta (requiere integración con pasarela de pagos)',
            'is_enabled': False,
            'requires_proof': False,
            'icon': '💳',
            'display_order': 4
        },
        {
            'name': 'Contraentrega',
            'code': 'cash',
            'description': 'Pago en efectivo al recibir el producto',
            'is_enabled': False,
            'requires_proof': False,
            'icon': '💵',
            'display_order': 5
        },
    ]

    created_count = 0
    updated_count = 0

    for method_data in payment_methods:
        method, created = PaymentMethod.objects.update_or_create(
            code=method_data['code'],
            defaults={
                'name': method_data['name'],
                'description': method_data['description'],
                'is_enabled': method_data['is_enabled'],
                'requires_proof': method_data['requires_proof'],
                'icon': method_data['icon'],
                'display_order': method_data['display_order']
            }
        )

        if created:
            created_count += 1
            print(f'[OK] Creado: {method.name} ({method.code})')
        else:
            updated_count += 1
            print(f'[UPDATE] Actualizado: {method.name} ({method.code})')

    print(f'\n[SUCCESS] Proceso completado:')
    print(f'   - {created_count} metodos de pago creados')
    print(f'   - {updated_count} metodos de pago actualizados')
    print(f'   - Total: {PaymentMethod.objects.count()} metodos de pago en base de datos')


if __name__ == '__main__':
    print('Poblando metodos de pago...\n')
    populate_payment_methods()
