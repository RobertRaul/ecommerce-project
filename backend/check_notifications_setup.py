#!/usr/bin/env python
"""
Script de verificación del sistema de notificaciones.
Ejecutar: python check_notifications_setup.py
"""

import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.conf import settings
from django.core.management import call_command
from django.db import connection

print("\n" + "="*70)
print("🔍 VERIFICACIÓN DEL SISTEMA DE NOTIFICACIONES")
print("="*70 + "\n")

errors = []
warnings = []
success = []

# 1. Verificar Django Channels instalado
print("1️⃣  Verificando Django Channels...")
try:
    import channels
    print(f"   ✅ Django Channels instalado (v{channels.__version__})")
    success.append("Django Channels")
except ImportError:
    print("   ❌ Django Channels NO instalado")
    errors.append("Django Channels no instalado. Ejecuta: pip install channels")

# 2. Verificar channels-redis
print("\n2️⃣  Verificando channels-redis...")
try:
    import channels_redis
    print(f"   ✅ channels-redis instalado")
    success.append("channels-redis")
except ImportError:
    print("   ❌ channels-redis NO instalado")
    errors.append("channels-redis no instalado. Ejecuta: pip install channels-redis")

# 3. Verificar daphne
print("\n3️⃣  Verificando Daphne...")
try:
    import daphne
    print(f"   ✅ Daphne instalado (v{daphne.__version__})")
    success.append("Daphne")
except ImportError:
    print("   ❌ Daphne NO instalado")
    errors.append("Daphne no instalado. Ejecuta: pip install daphne")

# 4. Verificar Redis
print("\n4️⃣  Verificando conexión a Redis...")
try:
    import redis
    r = redis.Redis(host='127.0.0.1', port=6379)
    r.ping()
    print("   ✅ Redis conectado y funcionando")
    success.append("Redis")
except Exception as e:
    print(f"   ❌ Redis NO disponible: {str(e)}")
    warnings.append("Redis no está corriendo. Inicia Redis antes de usar WebSockets")

# 5. Verificar app notifications en INSTALLED_APPS
print("\n5️⃣  Verificando configuración de INSTALLED_APPS...")
if 'notifications' in settings.INSTALLED_APPS:
    print("   ✅ App 'notifications' en INSTALLED_APPS")
    success.append("notifications en INSTALLED_APPS")
else:
    print("   ❌ App 'notifications' NO está en INSTALLED_APPS")
    errors.append("Agregar 'notifications' a INSTALLED_APPS")

# 6. Verificar channels en INSTALLED_APPS
if 'channels' in settings.INSTALLED_APPS:
    print("   ✅ 'channels' en INSTALLED_APPS")
    success.append("channels en INSTALLED_APPS")
else:
    print("   ❌ 'channels' NO está en INSTALLED_APPS")
    errors.append("Agregar 'channels' a INSTALLED_APPS")

# 7. Verificar daphne en INSTALLED_APPS
if 'daphne' in settings.INSTALLED_APPS:
    print("   ✅ 'daphne' en INSTALLED_APPS")
    success.append("daphne en INSTALLED_APPS")
else:
    print("   ⚠️  'daphne' NO está en INSTALLED_APPS")
    warnings.append("Agregar 'daphne' al inicio de INSTALLED_APPS para WebSockets")

# 8. Verificar CHANNEL_LAYERS
print("\n6️⃣  Verificando CHANNEL_LAYERS...")
if hasattr(settings, 'CHANNEL_LAYERS'):
    print("   ✅ CHANNEL_LAYERS configurado")
    success.append("CHANNEL_LAYERS")
else:
    print("   ❌ CHANNEL_LAYERS NO configurado")
    errors.append("Configurar CHANNEL_LAYERS en settings.py")

# 9. Verificar ASGI_APPLICATION
print("\n7️⃣  Verificando ASGI_APPLICATION...")
if hasattr(settings, 'ASGI_APPLICATION'):
    print(f"   ✅ ASGI_APPLICATION: {settings.ASGI_APPLICATION}")
    success.append("ASGI_APPLICATION")
else:
    print("   ❌ ASGI_APPLICATION NO configurado")
    errors.append("Configurar ASGI_APPLICATION en settings.py")

# 10. Verificar migraciones
print("\n8️⃣  Verificando migraciones de notifications...")
try:
    from notifications.models import Notification
    # Intentar hacer una consulta simple
    Notification.objects.count()
    print("   ✅ Modelo Notification funcional")
    success.append("Migraciones aplicadas")
except Exception as e:
    print(f"   ❌ Error con modelo Notification: {str(e)}")
    errors.append("Ejecutar migraciones: python manage.py migrate notifications")

# 11. Verificar archivos críticos
print("\n9️⃣  Verificando archivos críticos...")
files_to_check = [
    ('notifications/models.py', 'Modelos'),
    ('notifications/serializers.py', 'Serializers'),
    ('notifications/views.py', 'Views'),
    ('notifications/consumers.py', 'WebSocket Consumer'),
    ('notifications/routing.py', 'Routing'),
    ('notifications/signals.py', 'Signals'),
    ('notifications/utils.py', 'Utils'),
    ('config/asgi.py', 'ASGI config'),
]

for filepath, name in files_to_check:
    full_path = os.path.join(settings.BASE_DIR, filepath)
    if os.path.exists(full_path):
        print(f"   ✅ {name}: {filepath}")
        success.append(name)
    else:
        print(f"   ❌ {name} NO encontrado: {filepath}")
        errors.append(f"Crear archivo: {filepath}")

# 12. Verificar URLs
print("\n🔟 Verificando URLs...")
try:
    from django.urls import get_resolver
    resolver = get_resolver()
    
    # Verificar si la ruta de notifications está registrada
    has_notifications_route = any('notifications' in str(pattern) for pattern in resolver.url_patterns)
    
    if has_notifications_route:
        print("   ✅ Rutas de notifications registradas")
        success.append("URLs configuradas")
    else:
        print("   ❌ Rutas de notifications NO encontradas")
        errors.append("Registrar NotificationViewSet en urls.py")
except Exception as e:
    print(f"   ⚠️  No se pudo verificar URLs: {str(e)}")
    warnings.append("Verificar manualmente las URLs")

# Resumen
print("\n" + "="*70)
print("📊 RESUMEN DE VERIFICACIÓN")
print("="*70)
print(f"\n✅ Exitosos: {len(success)}")
print(f"⚠️  Advertencias: {len(warnings)}")
print(f"❌ Errores: {len(errors)}")

if errors:
    print("\n❌ ERRORES ENCONTRADOS:")
    for i, error in enumerate(errors, 1):
        print(f"   {i}. {error}")

if warnings:
    print("\n⚠️  ADVERTENCIAS:")
    for i, warning in enumerate(warnings, 1):
        print(f"   {i}. {warning}")

if not errors and not warnings:
    print("\n🎉 ¡PERFECTO! El sistema de notificaciones está completamente configurado.")
    print("\n📝 Próximos pasos:")
    print("   1. Asegúrate de que Redis esté corriendo")
    print("   2. Ejecuta: python manage.py runserver")
    print("   3. En el frontend: npm run dev")
    print("   4. Prueba con: python manage.py shell < test_notifications.py")
elif errors:
    print("\n⚠️  HAY ERRORES QUE DEBES CORREGIR ANTES DE USAR EL SISTEMA")
else:
    print("\n✅ El sistema está mayormente configurado, revisa las advertencias")

print("\n" + "="*70 + "\n")

sys.exit(len(errors))
