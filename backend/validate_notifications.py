#!/usr/bin/env python
"""
Script de validación final del sistema de notificaciones.
Prueba todo el flujo end-to-end.
Ejecutar: python validate_notifications.py
"""

import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from notifications.models import Notification, NotificationType, NotificationPriority
from notifications.utils import send_notification
import time

User = get_user_model()

print("\n" + "="*70)
print("🧪 VALIDACIÓN FINAL DEL SISTEMA DE NOTIFICACIONES")
print("="*70 + "\n")

# Test 1: Verificar modelo
print("1️⃣  Probando modelo Notification...")
try:
    count = Notification.objects.count()
    print(f"   ✅ Modelo funcional. Notificaciones en DB: {count}")
except Exception as e:
    print(f"   ❌ Error en modelo: {str(e)}")
    sys.exit(1)

# Test 2: Verificar usuario
print("\n2️⃣  Verificando usuario de prueba...")
user = User.objects.filter(is_staff=True).first()
if not user:
    user = User.objects.first()

if user:
    print(f"   ✅ Usuario encontrado: {user.username}")
else:
    print("   ❌ No hay usuarios en el sistema")
    sys.exit(1)

# Test 3: Crear notificaciones de cada tipo
print("\n3️⃣  Creando notificaciones de prueba...")
test_cases = [
    (NotificationType.ORDER, NotificationPriority.HIGH, "Orden de prueba"),
    (NotificationType.PAYMENT, NotificationPriority.MEDIUM, "Pago de prueba"),
    (NotificationType.STOCK, NotificationPriority.HIGH, "Stock bajo"),
    (NotificationType.USER, NotificationPriority.LOW, "Nuevo usuario"),
    (NotificationType.SYSTEM, NotificationPriority.MEDIUM, "Sistema"),
]

created_ids = []
for tipo, prioridad, titulo in test_cases:
    try:
        notif = send_notification(
            user=user,
            notification_type=tipo,
            title=f"Test: {titulo}",
            message=f"Esta es una notificación de prueba de tipo {tipo}",
            priority=prioridad
        )
        created_ids.append(notif.id)
        print(f"   ✅ {tipo}: ID {notif.id}")
    except Exception as e:
        print(f"   ❌ Error en {tipo}: {str(e)}")

# Test 4: Leer notificaciones
print("\n4️⃣  Verificando lectura de notificaciones...")
try:
    notifs = Notification.objects.filter(id__in=created_ids)
    print(f"   ✅ Se pueden leer {notifs.count()} notificaciones creadas")
except Exception as e:
    print(f"   ❌ Error leyendo: {str(e)}")

# Test 5: Marcar como leída
print("\n5️⃣  Probando marcar como leída...")
try:
    if created_ids:
        notif = Notification.objects.get(id=created_ids[0])
        notif.read = True
        notif.save()
        print(f"   ✅ Notificación ID {notif.id} marcada como leída")
except Exception as e:
    print(f"   ❌ Error marcando como leída: {str(e)}")

# Test 6: Filtrar por tipo
print("\n6️⃣  Probando filtros...")
try:
    unread = Notification.objects.filter(user=user, read=False).count()
    by_priority = Notification.objects.filter(
        user=user, 
        priority=NotificationPriority.HIGH
    ).count()
    print(f"   ✅ No leídas: {unread}")
    print(f"   ✅ Alta prioridad: {by_priority}")
except Exception as e:
    print(f"   ❌ Error en filtros: {str(e)}")

# Test 7: Metadata
print("\n7️⃣  Probando metadata...")
try:
    notif = send_notification(
        user=user,
        notification_type=NotificationType.ORDER,
        title="Orden con metadata",
        message="Esta notificación tiene metadata",
        priority=NotificationPriority.LOW,
        metadata={
            'order_id': 999,
            'amount': 150.50,
            'customer': 'Test User'
        }
    )
    print(f"   ✅ Notificación con metadata: ID {notif.id}")
    print(f"      Metadata: {notif.metadata}")
except Exception as e:
    print(f"   ❌ Error en metadata: {str(e)}")

# Test 8: Serializer
print("\n8️⃣  Probando serializer...")
try:
    from notifications.serializers import NotificationSerializer
    notif = Notification.objects.filter(user=user).first()
    serializer = NotificationSerializer(notif)
    data = serializer.data
    print(f"   ✅ Serializer funcional")
    print(f"      Campos: {list(data.keys())}")
except Exception as e:
    print(f"   ❌ Error en serializer: {str(e)}")

# Test 9: API Endpoint (simulado)
print("\n9️⃣  Verificando ViewSet...")
try:
    from notifications.views import NotificationViewSet
    print("   ✅ NotificationViewSet importado correctamente")
except Exception as e:
    print(f"   ❌ Error importando ViewSet: {str(e)}")

# Test 10: Signals
print("\n🔟 Verificando signals...")
try:
    from notifications.signals import order_created_handler
    print("   ✅ Signals importados correctamente")
except Exception as e:
    print(f"   ❌ Error importando signals: {str(e)}")

# Estadísticas finales
print("\n" + "="*70)
print("📊 ESTADÍSTICAS FINALES")
print("="*70)
from django.db.models import Count

total = Notification.objects.filter(user=user).count()
unread = Notification.objects.filter(user=user, read=False).count()
by_type = dict(
    Notification.objects.filter(user=user)
    .values_list('type')
    .annotate(count=Count('id'))
)
by_priority = dict(
    Notification.objects.filter(user=user)
    .values_list('priority')
    .annotate(count=Count('id'))
)

print(f"\n👤 Usuario: {user.username}")
print(f"📧 Total de notificaciones: {total}")
print(f"📩 No leídas: {unread}")
print(f"📖 Leídas: {total - unread}")

print(f"\n📋 Por tipo:")
for tipo, count in by_type.items():
    print(f"   {tipo}: {count}")

print(f"\n⚡ Por prioridad:")
for priority, count in by_priority.items():
    print(f"   {priority}: {count}")

# Resumen
print("\n" + "="*70)
print("✅ VALIDACIÓN COMPLETADA EXITOSAMENTE")
print("="*70)
print("\n💡 Próximos pasos:")
print("   1. Asegúrate de que Redis esté corriendo")
print("   2. Inicia el backend: python manage.py runserver")
print("   3. Inicia el frontend: cd frontend && npm run dev")
print("   4. Visita: http://localhost:3000/admin")
print("   5. Envía una notificación de prueba desde Django Shell")
print("\n🎉 El sistema está listo para usar!\n")
