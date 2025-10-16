#!/bin/bash
set -e

echo "🔄 Waiting for PostgreSQL..."
while ! nc -z db 5432; do
  sleep 0.1
done
echo "✅ PostgreSQL is ready!"

echo "🔄 Waiting for Redis..."
while ! nc -z redis 6379; do
  sleep 0.1
done
echo "✅ Redis is ready!"

echo "🗄️  Running migrations..."
python manage.py migrate --no-input

echo "📦 Collecting static files..."
python manage.py collectstatic --no-input --clear

echo "✅ Starting application..."
exec "$@"
