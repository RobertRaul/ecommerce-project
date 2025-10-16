"""
Script de prueba para el sistema de notificaciones en tiempo real.
Ejecutar con: python manage.py shell < test_notifications.py
"""

from notifications.utils import send_notification
from notifications.models import NotificationType, NotificationPriority
from django.contrib.auth import get_user_model

User = get_user_model()

print("\n🚀 INICIANDO PRUEBAS DE NOTIFICACIONES\n")

# Obtener un usuario de prueba
try:
    user = User.objects.filter(is_staff=True).first()
    if not user:
        user = User.objects.first()
    
    if not user:
        print("❌ No hay usuarios en la base de datos")
        exit()
    
    print(f"✅ Usuario de prueba: {user.username} ({user.email})")
    print()
    
    # Test 1: Notificación de baja prioridad
    print("📝 Test 1: Notificación de baja prioridad (SYSTEM)")
    notif1 = send_notification(
        user=user,
        notification_type=NotificationType.SYSTEM,
        title="Sistema Actualizado",
        message="El sistema ha sido actualizado a la versión 2.0",
        priority=NotificationPriority.LOW
    )
    print(f"✅ Notificación creada: ID {notif1.id}")
    print()
    
    # Test 2: Notificación de media prioridad
    print("📝 Test 2: Notificación de media prioridad (ORDER)")
    notif2 = send_notification(
        user=user,
        notification_type=NotificationType.ORDER,
        title="Nueva Orden Recibida",
        message="Has recibido una nueva orden #12345 por $250.00",
        priority=NotificationPriority.MEDIUM,
        metadata={'order_id': 12345, 'amount': 250.00}
    )
    print(f"✅ Notificación creada: ID {notif2.id}")
    print()
    
    # Test 3: Notificación de alta prioridad
    print("📝 Test 3: Notificación de alta prioridad (STOCK)")
    notif3 = send_notification(
        user=user,
        notification_type=NotificationType.STOCK,
        title="⚠️ Stock Crítico",
        message="El producto 'iPhone 15 Pro' tiene solo 2 unidades restantes",
        priority=NotificationPriority.HIGH,
        metadata={'product_id': 1, 'stock': 2}
    )
    print(f"✅ Notificación creada: ID {notif3.id}")
    print()
    
    # Test 4: Notificación de pago
    print("📝 Test 4: Notificación de pago confirmado")
    notif4 = send_notification(
        user=user,
        notification_type=NotificationType.PAYMENT,
        title="💳 Pago Confirmado",
        message="El pago de la orden #12345 ha sido confirmado exitosamente",
        priority=NotificationPriority.MEDIUM,
        metadata={'order_id': 12345, 'payment_method': 'credit_card'}
    )
    print(f"✅ Notificación creada: ID {notif4.id}")
    print()
    
    # Test 5: Notificación de usuario
    print("📝 Test 5: Notificación de nuevo usuario")
    notif5 = send_notification(
        user=user,
        notification_type=NotificationType.USER,
        title="👤 Nuevo Usuario Registrado",
        message="Un nuevo usuario se ha registrado: johndoe@example.com",
        priority=NotificationPriority.LOW,
        metadata={'new_user_email': 'johndoe@example.com'}
    )
    print(f"✅ Notificación creada: ID {notif5.id}")
    print()
    
    # Resumen
    print("=" * 60)
    print("📊 RESUMEN DE PRUEBAS")
    print("=" * 60)
    from django.db.models import Count
    from notifications.models import Notification
    
    total = Notification.objects.filter(user=user).count()
    unread = Notification.objects.filter(user=user, read=False).count()
    by_type = dict(Notification.objects.filter(user=user).values_list('type').annotate(count=Count('id')))
    by_priority = dict(Notification.objects.filter(user=user).values_list('priority').annotate(count=Count('id')))
    
    print(f"Total de notificaciones: {total}")
    print(f"No leídas: {unread}")
    print(f"\nPor tipo:")
    for tipo, count in by_type.items():
        print(f"  - {tipo}: {count}")
    print(f"\nPor prioridad:")
    for priority, count in by_priority.items():
        print(f"  - {priority}: {count}")
    print()
    
    print("✅ TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE")
    print()
    print("🔔 Revisa el frontend para ver las notificaciones en tiempo real!")
    print("💡 URL: http://localhost:3000/admin")
    print()

except Exception as e:
    print(f"❌ Error durante las pruebas: {str(e)}")
    import traceback
    traceback.print_exc()
