# 🛒 Ecommerce Full Stack

Ecommerce completo con Django REST Framework + React/Next.js, con integración de pagos (Yape, Plin, Transferencias), sistema de inventario, carrito de compras y análisis con Data Science.

## 🚀 Tecnologías

### Backend
- Python 3.11+
- Django 5.0
- Django REST Framework
- PostgreSQL / SQLite
- JWT Authentication
- Celery (tareas asíncronas)
- Pandas & Scikit-learn (Data Science)

### Frontend
- React 18
- Next.js 14
- Tailwind CSS
- Zustand (State Management)
- Axios

## 📁 Estructura del Proyecto

```
ecommerce-project/
├── backend/           # API Django REST Framework
│   ├── config/       # Configuración del proyecto
│   ├── users/        # App de usuarios
│   ├── products/     # App de productos
│   ├── orders/       # App de órdenes
│   └── core/         # App principal
├── frontend/         # Aplicación Next.js
│   ├── src/
│   │   ├── app/     # Pages (App Router)
│   │   ├── components/
│   │   ├── store/   # Zustand stores
│   │   └── lib/     # Utilidades
│   └── public/
└── README.md
```

## 🔧 Instalación

### Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Ejecutar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Poblar base de datos (opcional)
python manage.py shell < populate_db.py

# Ejecutar servidor
python manage.py runserver
```

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local

# Ejecutar en desarrollo
npm run dev
```

## 🌐 URLs

- **Backend API:** http://localhost:8000/api/
- **Admin Panel:** http://localhost:8000/admin/
- **API Docs:** http://localhost:8000/api/docs/
- **Frontend:** http://localhost:3000/

## 📚 Documentación API

La documentación completa de la API está disponible en `/api/docs/` (Swagger UI)

### Endpoints principales:

- `POST /api/auth/register/` - Registro de usuario
- `POST /api/auth/login/` - Login
- `GET /api/products/` - Lista de productos
- `POST /api/cart/add/` - Agregar al carrito
- `POST /api/orders/create/` - Crear orden

## 🎯 Características

- ✅ Autenticación con JWT
- ✅ Carrito de compras persistente
- ✅ Sistema de órdenes completo
- ✅ Múltiples métodos de pago (Yape, Plin, Transferencia)
- ✅ Gestión de inventario
- ✅ Sistema de reseñas
- ✅ Zonas de envío configurables
- ✅ Panel de administración
- ⏳ Sistema de recomendaciones (Data Science)
- ⏳ Dashboard de analytics
- ⏳ Notificaciones por email

## 📝 Variables de Entorno

### Backend (.env)
```
SECRET_KEY=tu-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_MEDIA_URL=http://localhost:8000
```

## 👨‍💻 Autor

Robert Raul - [@RobertRaul](https://github.com/RobertRaul)