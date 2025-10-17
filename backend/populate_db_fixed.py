"""
Script para poblar la base de datos con datos de prueba masivos
Genera ~10,000+ registros para pruebas de rendimiento
Ejecutar con: python populate_db.py

Requisitos:
pip install faker

"""

import os
import sys
import django
import random
import uuid
from datetime import timedelta, datetime
from decimal import Decimal

# Configurar Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone
from django.contrib.auth import get_user_model
from faker import Faker

from products.models import Category, Brand, Product, ProductImage, ProductVariant, Review
from orders.models import Order, OrderItem, OrderStatusHistory, ShippingZone
from coupons.models import Coupon, CouponUsage
from notifications.models import Notification, NotificationPreference
from users.models import UserProfile

# Inicializar Faker con locale español
fake = Faker('es_ES')
User = get_user_model()

# Configuración
CONFIG = {
    'users': 1000,
    'categories': 30,
    'brands': 50,
    'products': 1000,
    'orders': 5000,
    'reviews': 2000,
    'coupons': 100,
    'notifications': 3000,
}

print("[INICIO] Iniciando población masiva de base de datos...")
print(f"[INFO] Configuración: {sum(CONFIG.values())} registros aproximados\n")


# ==================== UTILIDADES ====================

def random_price(min_val=10, max_val=10000):
    """Genera precio aleatorio"""
    return Decimal(str(round(random.uniform(min_val, max_val), 2)))


def random_stock():
    """Genera stock aleatorio con distribución realista"""
    weights = [0.1, 0.3, 0.4, 0.15, 0.05]  # Mayoría con stock medio
    ranges = [(0, 5), (6, 20), (21, 100), (101, 500), (501, 1000)]
    range_selected = random.choices(ranges, weights=weights)[0]
    return random.randint(*range_selected)


def random_date_between(start_days_ago=365, end_days_ago=0):
    """Genera fecha aleatoria en un rango"""
    start = timezone.now() - timedelta(days=start_days_ago)
    end = timezone.now() - timedelta(days=end_days_ago)
    time_between = end - start
    random_time = random.random() * time_between.total_seconds()
    return start + timedelta(seconds=random_time)


# ==================== CREACIÓN DE DATOS ====================

def create_categories():
    """Crear categorías y subcategorías"""
    print("[->] Creando categorías...")

    main_categories = [
        {'name': 'Electrónica', 'desc': 'Productos electrónicos y gadgets'},
        {'name': 'Computadoras', 'desc': 'Laptops, PCs y accesorios'},
        {'name': 'Smartphones', 'desc': 'Teléfonos inteligentes'},
        {'name': 'Audio', 'desc': 'Equipos de audio y accesorios'},
        {'name': 'Gaming', 'desc': 'Videojuegos y consolas'},
        {'name': 'Hogar Inteligente', 'desc': 'Dispositivos smart'},
        {'name': 'Cámaras', 'desc': 'Fotografía y video'},
        {'name': 'Wearables', 'desc': 'Tecnología portable'},
        {'name': 'Oficina', 'desc': 'Equipos para oficina'},
        {'name': 'Networking', 'desc': 'Redes y conectividad'},
    ]

    categories = []
    for cat_data in main_categories:
        cat = Category.objects.create(
            name=cat_data['name'],
            description=cat_data['desc'],
            is_active=True
        )
        categories.append(cat)

        # Crear subcategorías
        num_subcats = random.randint(2, 4)
        for i in range(num_subcats):
            Category.objects.create(
                name=f"{cat.name} - {fake.word().title()}",
                description=fake.sentence(),
                parent=cat,
                is_active=random.choice([True, True, True, False])  # 75% activas
            )

    total = Category.objects.count()
    print(f"  [OK] {total} categorías creadas\n")
    return categories


def create_brands():
    """Crear marcas"""
    print("[->]  Creando marcas...")

    real_brands = [
        'Apple', 'Samsung', 'Sony', 'LG', 'HP', 'Lenovo', 'Dell', 'Asus',
        'Acer', 'Logitech', 'Razer', 'Corsair', 'JBL', 'Bose', 'Xiaomi',
        'Huawei', 'OnePlus', 'Google', 'Microsoft', 'Nintendo', 'Canon',
        'Nikon', 'GoPro', 'DJI', 'Philips', 'Panasonic', 'Toshiba', 'Seagate'
    ]

    brands = []
    for brand_name in real_brands:
        brand = Brand.objects.create(
            name=brand_name,
            description=fake.sentence(),
            is_active=True
        )
        brands.append(brand)

    # Agregar algunas marcas adicionales ficticias
    for _ in range(CONFIG['brands'] - len(real_brands)):
        brand = Brand.objects.create(
            name=fake.company(),
            description=fake.sentence(),
            is_active=random.choice([True, True, False])
        )
        brands.append(brand)

    print(f"  [OK] {len(brands)} marcas creadas\n")
    return brands


def create_products(categories, brands):
    """Crear productos de forma masiva"""
    print(f"[->] Creando {CONFIG['products']} productos...")

    product_templates = [
        'Laptop', 'Mouse', 'Teclado', 'Monitor', 'Audífonos', 'Parlante',
        'Smartphone', 'Tablet', 'Smartwatch', 'Cámara', 'Micrófono',
        'Webcam', 'Router', 'Switch', 'Disco Duro', 'SSD', 'Memoria RAM',
        'Tarjeta Gráfica', 'Procesador', 'Motherboard', 'Fuente de Poder',
        'Case', 'Cooler', 'Consola', 'Control', 'Juego', 'Auriculares VR',
        'Impresora', 'Scanner', 'Proyector', 'Cable HDMI', 'Adaptador',
        'Hub USB', 'Dock', 'Cargador', 'Batería Externa', 'Lámpara LED'
    ]

    products = []
    for i in range(CONFIG['products']):
        template = random.choice(product_templates)
        brand = random.choice(brands)
        category = random.choice(categories)

        price = random_price(50, 8000)
        has_discount = random.random() < 0.3  # 30% con descuento

        product = Product(
            name=f"{brand.name} {template} {fake.word().title()}",
            sku=f"SKU-{fake.unique.bothify(text='????-########')}",
            slug=f"{brand.name.lower().replace(' ', '-')}-{template.lower().replace(' ', '-')}-{fake.unique.bothify(text='????-####')}",
            description=fake.paragraph(nb_sentences=5),
            short_description=fake.sentence(),
            category=category,
            brand=brand,
            price=price,
            compare_price=price * Decimal('1.2') if has_discount else None,
            cost=price * Decimal('0.6'),  # 40% de margen
            stock=random_stock(),
            low_stock_threshold=random.randint(5, 15),
            track_inventory=True,
            weight=Decimal(str(round(random.uniform(0.1, 5.0), 2))),
            is_active=random.random() < 0.9,  # 90% activos
            is_featured=random.random() < 0.2,  # 20% destacados
            views=random.randint(0, 10000),
            sales_count=random.randint(0, 500),
            created_at=random_date_between(365, 0),
        )
        products.append(product)

        if (i + 1) % 100 == 0:
            print(f"  -> Progreso: {i + 1}/{CONFIG['products']}")

    # Bulk create para mejor performance
    Product.objects.bulk_create(products, batch_size=100)
    print(f"  [OK] {len(products)} productos creados\n")
    return Product.objects.all()


def create_users():
    """Crear usuarios"""
    print(f"[->] Creando {CONFIG['users']} usuarios...")

    departments = ['Lima', 'Arequipa', 'Cusco', 'Trujillo', 'Chiclayo', 'Piura']

    users = []
    profiles = []

    # Crear admin si no existe
    if not User.objects.filter(email='admin@ecommerce.com').exists():
        admin = User.objects.create_superuser(
            username='admin',
            email='admin@ecommerce.com',
            password='admin123',
            first_name='Admin',
            last_name='Sistema'
        )
        print("  [OK] Usuario admin creado (admin@ecommerce.com / admin123)")

    for i in range(CONFIG['users']):
        user = User(
            username=fake.unique.user_name(),
            email=fake.unique.email(),
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            phone=fake.phone_number(),
            address=fake.address(),
            city=fake.city(),
            department=random.choice(departments),
            postal_code=fake.postcode(),
            email_verified=random.random() < 0.8,  # 80% verificados
            is_active=random.random() < 0.95,  # 95% activos
            created_at=random_date_between(730, 0),
        )
        user.set_password('password123')
        users.append(user)

        if (i + 1) % 100 == 0:
            print(f"  -> Progreso: {i + 1}/{CONFIG['users']}")

    User.objects.bulk_create(users, batch_size=100)

    # Crear perfiles para los usuarios
    all_users = User.objects.all()
    for user in all_users:
        profile = UserProfile(
            user=user,
            total_orders=random.randint(0, 50),
            total_spent=random_price(0, 10000),
            last_purchase=random_date_between(180, 0) if random.random() < 0.7 else None,
            rfm_score=random.randint(1, 10),
            customer_segment=random.choice(['VIP', 'Regular', 'Ocasional', 'Nuevo'])
        )
        profiles.append(profile)

    UserProfile.objects.bulk_create(profiles, batch_size=100, ignore_conflicts=True)

    print(f"  [OK] {len(users)} usuarios y perfiles creados\n")
    return all_users


def create_orders(users, products):
    """Crear órdenes"""
    print(f"[->] Creando {CONFIG['orders']} órdenes...")

    statuses = ['pending', 'payment_verified', 'processing', 'shipped', 'delivered', 'cancelled']
    status_weights = [0.05, 0.10, 0.15, 0.25, 0.40, 0.05]  # Mayoría entregadas

    payment_methods = ['yape', 'plin', 'transfer', 'card', 'cash']

    departments = ['Lima', 'Arequipa', 'Cusco', 'Trujillo', 'Chiclayo', 'Piura']

    orders = []
    order_items = []
    status_histories = []

    for i in range(CONFIG['orders']):
        user = random.choice(users)
        status = random.choices(statuses, weights=status_weights)[0]

        # Calcular subtotal
        num_items = random.randint(1, 5)
        subtotal = Decimal('0')

        # Generar order_number único manualmente
        order_number = f"ORD-{uuid.uuid4().hex[:8].upper()}"

        order = Order(
            order_number=order_number,
            user=user,
            email=user.email,
            phone=user.phone,
            shipping_address=fake.address(),
            shipping_city=random.choice(departments),
            shipping_department=random.choice(departments),
            shipping_postal_code=fake.postcode(),
            subtotal=Decimal('0'),  # Se calculará después
            shipping_cost=random_price(10, 40),
            tax=Decimal('0'),
            discount=random_price(0, 100) if random.random() < 0.3 else Decimal('0'),
            total=Decimal('0'),  # Se calculará después
            payment_method=random.choice(payment_methods),
            payment_status='confirmed' if status in ['processing', 'shipped', 'delivered'] else 'pending',
            status=status,
            customer_notes=fake.sentence() if random.random() < 0.3 else '',
            created_at=random_date_between(365, 0),
        )

        # Calcular total
        for _ in range(num_items):
            product = random.choice(products)
            quantity = random.randint(1, 3)
            price = product.price
            subtotal += price * quantity

        order.subtotal = subtotal
        order.total = subtotal + order.shipping_cost - order.discount
        orders.append(order)

        if (i + 1) % 500 == 0:
            print(f"  -> Progreso: {i + 1}/{CONFIG['orders']}")

    Order.objects.bulk_create(orders, batch_size=100)

    # Crear items de órdenes
    print("  -> Creando items de órdenes...")
    all_orders = Order.objects.all()
    for order in all_orders:
        num_items = random.randint(1, 5)
        for _ in range(num_items):
            product = random.choice(products)
            item = OrderItem(
                order=order,
                product=product,
                product_name=product.name,
                product_sku=product.sku,
                quantity=random.randint(1, 3),
                price=product.price
            )
            order_items.append(item)

    OrderItem.objects.bulk_create(order_items, batch_size=500)

    print(f"  [OK] {len(orders)} órdenes con {len(order_items)} items creados\n")
    return all_orders


def create_reviews(users, products):
    """Crear reseñas"""
    print(f"[->] Creando {CONFIG['reviews']} reseñas...")

    reviews = []
    created_pairs = set()

    for i in range(CONFIG['reviews']):
        # Evitar duplicados (un usuario solo puede reseñar un producto una vez)
        max_attempts = 10
        for _ in range(max_attempts):
            user = random.choice(users)
            product = random.choice(products)
            pair = (user.id, product.id)

            if pair not in created_pairs:
                created_pairs.add(pair)
                break
        else:
            continue  # Skip si no se encontró par único

        rating = random.choices([1, 2, 3, 4, 5], weights=[0.05, 0.10, 0.15, 0.30, 0.40])[0]

        review = Review(
            product=product,
            user=user,
            rating=rating,
            title=fake.sentence(),
            comment=fake.paragraph(nb_sentences=3),
            is_verified_purchase=random.random() < 0.7,
            is_approved=random.random() < 0.95,
            created_at=random_date_between(365, 0)
        )
        reviews.append(review)

        if (i + 1) % 200 == 0:
            print(f"  -> Progreso: {i + 1}/{CONFIG['reviews']}")

    Review.objects.bulk_create(reviews, batch_size=100)
    print(f"  [OK] {len(reviews)} reseñas creadas\n")


def create_coupons(products, categories):
    """Crear cupones"""
    print(f"[->] Creando {CONFIG['coupons']} cupones...")

    coupons = []
    used_codes = set()

    coupon_prefixes = ['SAVE', 'DISCOUNT', 'PROMO', 'SALE', 'DEAL', 'OFFER']

    for i in range(CONFIG['coupons']):
        # Generar código único
        max_attempts = 100
        for _ in range(max_attempts):
            code = f"{random.choice(coupon_prefixes)}{random.randint(10, 99)}{fake.unique.bothify(text='??##')}"
            if code not in used_codes:
                used_codes.add(code)
                break
        else:
            # Si no se pudo generar único, usar UUID
            code = f"COUPON-{uuid.uuid4().hex[:8].upper()}"
            used_codes.add(code)

        discount_type = random.choice(['percentage', 'fixed'])

        if discount_type == 'percentage':
            discount_value = Decimal(str(random.randint(5, 50)))
        else:
            discount_value = random_price(10, 200)

        valid_from = random_date_between(60, 30)
        valid_until = valid_from + timedelta(days=random.randint(7, 90))

        coupon = Coupon(
            code=code,
            description=fake.sentence(),
            discount_type=discount_type,
            discount_value=discount_value,
            minimum_purchase=random_price(50, 500) if random.random() < 0.7 else Decimal('0'),
            max_discount_amount=random_price(50, 300) if discount_type == 'percentage' else None,
            usage_limit=random.randint(10, 1000) if random.random() < 0.8 else None,
            usage_limit_per_user=random.randint(1, 5),
            times_used=random.randint(0, 50),
            valid_from=valid_from,
            valid_until=valid_until,
            applicable_to_all=random.random() < 0.6,  # 60% aplican a todos
            is_active=random.random() < 0.8
        )
        coupons.append(coupon)

    Coupon.objects.bulk_create(coupons, batch_size=50)
    print(f"  [OK] {len(coupons)} cupones creados\n")


def create_notifications(users):
    """Crear notificaciones"""
    print(f"[->] Creando {CONFIG['notifications']} notificaciones...")

    notification_types = [
        'new_order', 'order_status', 'payment_confirmed', 'payment_failed',
        'low_stock', 'out_of_stock', 'new_user', 'new_review', 'system', 'promotion'
    ]

    priorities = ['low', 'medium', 'high', 'urgent']
    priority_weights = [0.3, 0.4, 0.2, 0.1]

    notifications = []

    for i in range(CONFIG['notifications']):
        notif_type = random.choice(notification_types)

        notification = Notification(
            user=random.choice(users) if random.random() < 0.95 else None,  # 5% globales
            type=notif_type,
            title=fake.sentence(),
            message=fake.paragraph(nb_sentences=2),
            priority=random.choices(priorities, weights=priority_weights)[0],
            read=random.random() < 0.6,  # 60% leídas
            read_at=random_date_between(30, 0) if random.random() < 0.6 else None,
            is_broadcast=random.random() < 0.05,  # 5% broadcast
            created_at=random_date_between(180, 0)
        )
        notifications.append(notification)

        if (i + 1) % 300 == 0:
            print(f"  -> Progreso: {i + 1}/{CONFIG['notifications']}")

    Notification.objects.bulk_create(notifications, batch_size=200)
    print(f"  [OK] {len(notifications)} notificaciones creadas\n")


def create_shipping_zones():
    """Crear zonas de envío"""
    print("[->] Creando zonas de envío...")

    zones = [
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

    for zona_data in zones:
        ShippingZone.objects.get_or_create(
            name=zona_data['name'],
            defaults=zona_data
        )

    print(f"  [OK] {len(zones)} zonas de envío creadas\n")


# ==================== MAIN ====================

def main():
    """Función principal"""
    start_time = datetime.now()

    try:
        # Crear datos en orden correcto (respetando dependencias)
        categories = create_categories()
        brands = create_brands()
        products = create_products(categories, brands)
        users = create_users()
        orders = create_orders(list(users), list(products))
        create_reviews(list(users), list(products))
        create_coupons(list(products), list(categories))
        create_notifications(list(users))
        create_shipping_zones()

        # Resumen final
        print("\n" + "="*60)
        print("[OK] BASE DE DATOS POBLADA EXITOSAMENTE!")
        print("="*60)
        print(f"\n[INFO] RESUMEN DE DATOS CREADOS:")
        print(f"  * Usuarios:        {User.objects.count():,}")
        print(f"  * Categorías:      {Category.objects.count():,}")
        print(f"  * Marcas:          {Brand.objects.count():,}")
        print(f"  * Productos:       {Product.objects.count():,}")
        print(f"  * Órdenes:         {Order.objects.count():,}")
        print(f"  * Items de órden:  {OrderItem.objects.count():,}")
        print(f"  * Reseñas:         {Review.objects.count():,}")
        print(f"  * Cupones:         {Coupon.objects.count():,}")
        print(f"  * Notificaciones:  {Notification.objects.count():,}")
        print(f"  * Zonas de envío:  {ShippingZone.objects.count():,}")

        total_records = (
            User.objects.count() +
            Category.objects.count() +
            Brand.objects.count() +
            Product.objects.count() +
            Order.objects.count() +
            OrderItem.objects.count() +
            Review.objects.count() +
            Coupon.objects.count() +
            Notification.objects.count()
        )

        print(f"\n   TOTAL DE REGISTROS: {total_records:,}")

        elapsed_time = datetime.now() - start_time
        print(f"\n[TIME]  Tiempo total: {elapsed_time.total_seconds():.2f} segundos")

        print("\n[INFO] CREDENCIALES DE ADMIN:")
        print("  Email:    admin@ecommerce.com")
        print("  Password: admin123")

        print("\n[INFO] CREDENCIALES DE USUARIOS:")
        print("  Password: password123 (para todos los usuarios)")

    except Exception as e:
        print(f"\n[ERROR] Error durante la población: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
