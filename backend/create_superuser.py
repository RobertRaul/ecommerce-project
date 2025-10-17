"""
Script para crear superusuario
Ejecutar con: python create_superuser.py
"""

import os
import sys
import django

# Configurar Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Datos del superusuario
USERNAME = 'robert'
EMAIL = 'admin@gmail.com'
PASSWORD = 'robert'
FIRST_NAME = 'Robert'
LAST_NAME = 'Admin'

print("Creando superusuario...")

try:
    if User.objects.filter(username=USERNAME).exists():
        print(f"[INFO] El usuario '{USERNAME}' ya existe")
        user = User.objects.get(username=USERNAME)
        print(f"   Email: {user.email}")
        print(f"   Superuser: {user.is_superuser}")
    else:
        user = User.objects.create_superuser(
            username=USERNAME,
            email=EMAIL,
            password=PASSWORD,
            first_name=FIRST_NAME,
            last_name=LAST_NAME
        )
        print("[OK] Superusuario creado exitosamente!")
        print(f"\nCredenciales:")
        print(f"   Username: {USERNAME}")
        print(f"   Email: {EMAIL}")
        print(f"   Password: {PASSWORD}")
        print(f"\nAcceso:")
        print(f"   Django Admin: http://localhost:8000/admin")
        print(f"   Frontend Admin: http://localhost:3000/admin")

except Exception as e:
    print(f"[ERROR] Error al crear superusuario: {str(e)}")
    sys.exit(1)
