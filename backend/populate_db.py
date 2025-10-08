"""
Script para poblar la base de datos con datos de prueba
Guarda este archivo en la raíz del proyecto (junto a manage.py)
Ejecutar con: python .\populate_db.py
"""

import os
import sys
import django

# Configurar Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')  # Cambia 'config' por tu proyecto
django.setup()

from products.models import Category, Brand, Product, ProductImage
from orders.models import ShippingZone
from decimal import Decimal

print("🚀 Poblando base de datos...")

# Crear Categorías
print("\n📁 Creando categorías...")
categorias = [
    {'name': 'Electrónica', 'description': 'Productos electrónicos y gadgets'},
    {'name': 'Computadoras', 'description': 'Laptops, PCs y accesorios'},
    {'name': 'Smartphones', 'description': 'Teléfonos inteligentes y accesorios'},
    {'name': 'Audio', 'description': 'Audífonos, parlantes y equipos de audio'},
    {'name': 'Gaming', 'description': 'Consolas, videojuegos y accesorios'},
    {'name': 'Hogar Inteligente', 'description': 'Dispositivos smart para el hogar'},
]

for cat_data in categorias:
    cat, created = Category.objects.get_or_create(
        name=cat_data['name'],
        defaults={'description': cat_data['description']}
    )
    if created:
        print(f"  ✓ {cat.name}")

# Crear Marcas
print("\n🏷️  Creando marcas...")
marcas = ['Apple', 'Samsung', 'Sony', 'LG', 'HP', 'Lenovo', 'Logitech', 'JBL', 'Xiaomi', 'Huawei']
for marca_name in marcas:
    marca, created = Brand.objects.get_or_create(name=marca_name)
    if created:
        print(f"  ✓ {marca.name}")

# Crear Productos
print("\n📦 Creando productos...")
productos = [
    {
        'name': 'iPhone 15 Pro',
        'sku': 'IPHONE-15-PRO-128',
        'description': 'El iPhone más avanzado con chip A17 Pro y cámara profesional de 48MP. Diseño en titanio premium.',
        'short_description': 'iPhone 15 Pro con chip A17 Pro',
        'category': 'Smartphones',
        'brand': 'Apple',
        'price': Decimal('4999.00'),
        'compare_price': Decimal('5499.00'),
        'stock': 25,
    },
    {
        'name': 'MacBook Air M2',
        'sku': 'MBA-M2-256',
        'description': 'Laptop ultradelgada con chip M2 de Apple. Pantalla Liquid Retina de 13.6 pulgadas.',
        'short_description': 'MacBook Air con chip M2',
        'category': 'Computadoras',
        'brand': 'Apple',
        'price': Decimal('5499.00'),
        'compare_price': Decimal('5999.00'),
        'stock': 15,
    },
    {
        'name': 'Samsung Galaxy S24 Ultra',
        'sku': 'S24-ULTRA-256',
        'description': 'Smartphone premium con S Pen, cámara de 200MP y pantalla AMOLED de 6.8 pulgadas.',
        'short_description': 'Galaxy S24 Ultra con S Pen',
        'category': 'Smartphones',
        'brand': 'Samsung',
        'price': Decimal('5299.00'),
        'stock': 20,
    },
    {
        'name': 'Sony WH-1000XM5',
        'sku': 'SONY-WH1000XM5',
        'description': 'Audífonos con cancelación de ruido líder en la industria. Sonido Hi-Res Audio.',
        'short_description': 'Audífonos con cancelación de ruido',
        'category': 'Audio',
        'brand': 'Sony',
        'price': Decimal('1299.00'),
        'compare_price': Decimal('1499.00'),
        'stock': 40,
    },
    {
        'name': 'Laptop HP Pavilion Gaming',
        'sku': 'HP-PAV-GAMING',
        'description': 'Laptop gaming con procesador Intel i7, 16GB RAM, RTX 3050 y pantalla 144Hz.',
        'short_description': 'Laptop gaming HP con RTX 3050',
        'category': 'Gaming',
        'brand': 'HP',
        'price': Decimal('3999.00'),
        'stock': 12,
    },
    {
        'name': 'iPad Air 5ta Gen',
        'sku': 'IPAD-AIR-5-64',
        'description': 'iPad Air con chip M1, pantalla Liquid Retina de 10.9 pulgadas. Colores vibrantes.',
        'short_description': 'iPad Air con chip M1',
        'category': 'Electrónica',
        'brand': 'Apple',
        'price': Decimal('2799.00'),
        'stock': 18,
    },
    {
        'name': 'Logitech MX Master 3S',
        'sku': 'MX-MASTER-3S',
        'description': 'Mouse ergonómico premium con sensor de 8000 DPI y scroll electromagnético.',
        'short_description': 'Mouse ergonómico premium',
        'category': 'Computadoras',
        'brand': 'Logitech',
        'price': Decimal('399.00'),
        'compare_price': Decimal('449.00'),
        'stock': 50,
    },
    {
        'name': 'JBL Flip 6',
        'sku': 'JBL-FLIP6',
        'description': 'Parlante Bluetooth portátil con sonido potente, resistente al agua IP67.',
        'short_description': 'Parlante Bluetooth resistente al agua',
        'category': 'Audio',
        'brand': 'JBL',
        'price': Decimal('549.00'),
        'stock': 35,
    },
    {
        'name': 'Xiaomi Robot Vacuum S10',
        'sku': 'XIAOMI-VACUUM-S10',
        'description': 'Aspiradora robot inteligente con mapeo láser y succión de 4000Pa.',
        'short_description': 'Aspiradora robot inteligente',
        'category': 'Hogar Inteligente',
        'brand': 'Xiaomi',
        'price': Decimal('1899.00'),
        'stock': 10,
    },
    {
        'name': 'Samsung Monitor 27" 4K',
        'sku': 'SAMSUNG-M27-4K',
        'description': 'Monitor 4K UHD de 27 pulgadas con HDR10 y frecuencia de 60Hz.',
        'short_description': 'Monitor 4K de 27 pulgadas',
        'category': 'Computadoras',
        'brand': 'Samsung',
        'price': Decimal('1599.00'),
        'stock': 22,
    },
]

for prod_data in productos:
    category = Category.objects.get(name=prod_data['category'])
    brand = Brand.objects.get(name=prod_data['brand'])

    product, created = Product.objects.get_or_create(
        sku=prod_data['sku'],
        defaults={
            'name': prod_data['name'],
            'description': prod_data['description'],
            'short_description': prod_data['short_description'],
            'category': category,
            'brand': brand,
            'price': prod_data['price'],
            'compare_price': prod_data.get('compare_price'),
            'stock': prod_data['stock'],
            'is_active': True,
            'is_featured': True if prod_data['stock'] > 20 else False,
        }
    )
    if created:
        print(f"  ✓ {product.name} - S/ {product.price}")

# Crear Zonas de Envío
print("\n🚚 Creando zonas de envío...")
zonas = [
    {
        'name': 'Lima Metropolitana',
        'departments': ['Lima'],
        'cost': Decimal('15.00'),
        'free_shipping_threshold': Decimal('200.00'),
        'estimated_days': '1-2 días',
    },
    {
        'name': 'Provincias - Costa',
        'departments': ['Arequipa', 'Trujillo', 'Chiclayo', 'Piura'],
        'cost': Decimal('25.00'),
        'free_shipping_threshold': Decimal('300.00'),
        'estimated_days': '3-5 días',
    },
    {
        'name': 'Provincias - Sierra',
        'departments': ['Cusco', 'Ayacucho', 'Huancayo', 'Cajamarca'],
        'cost': Decimal('30.00'),
        'free_shipping_threshold': Decimal('350.00'),
        'estimated_days': '4-7 días',
    },
    {
        'name': 'Provincias - Selva',
        'departments': ['Iquitos', 'Pucallpa', 'Tarapoto'],
        'cost': Decimal('35.00'),
        'free_shipping_threshold': Decimal('400.00'),
        'estimated_days': '5-8 días',
    },
]

for zona_data in zonas:
    zona, created = ShippingZone.objects.get_or_create(
        name=zona_data['name'],
        defaults={
            'departments': zona_data['departments'],
            'cost': zona_data['cost'],
            'free_shipping_threshold': zona_data['free_shipping_threshold'],
            'estimated_days': zona_data['estimated_days'],
        }
    )
    if created:
        print(f"  ✓ {zona.name} - S/ {zona.cost}")

print("\n✅ Base de datos poblada exitosamente!")
print(f"📊 Resumen:")
print(f"  - Categorías: {Category.objects.count()}")
print(f"  - Marcas: {Brand.objects.count()}")
print(f"  - Productos: {Product.objects.count()}")
print(f"  - Zonas de envío: {ShippingZone.objects.count()}")