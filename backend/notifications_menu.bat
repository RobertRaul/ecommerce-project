@echo off
REM ========================================
REM Sistema de Notificaciones - Utilidades
REM ========================================

:menu
cls
echo ========================================
echo  SISTEMA DE NOTIFICACIONES - MENU
echo ========================================
echo.
echo 1. Verificar configuracion
echo 2. Ejecutar migraciones
echo 3. Validar sistema completo
echo 4. Enviar notificacion de prueba
echo 5. Iniciar Redis (WSL)
echo 6. Iniciar Backend
echo 7. Iniciar Frontend
echo 8. Ver estadisticas
echo 9. Limpiar notificaciones
echo 0. Salir
echo.
set /p choice="Selecciona una opcion: "

if "%choice%"=="1" goto check
if "%choice%"=="2" goto migrate
if "%choice%"=="3" goto validate
if "%choice%"=="4" goto test
if "%choice%"=="5" goto redis
if "%choice%"=="6" goto backend
if "%choice%"=="7" goto frontend
if "%choice%"=="8" goto stats
if "%choice%"=="9" goto clean
if "%choice%"=="0" goto end
goto menu

:check
cls
echo Verificando configuracion...
python check_notifications_setup.py
pause
goto menu

:migrate
cls
echo Ejecutando migraciones...
python manage.py makemigrations notifications
python manage.py migrate
pause
goto menu

:validate
cls
echo Validando sistema completo...
python validate_notifications.py
pause
goto menu

:test
cls
echo Enviando notificacion de prueba...
python manage.py send_test_notification --all-admins --type=system --priority=high
pause
goto menu

:redis
cls
echo Iniciando Redis en WSL...
start wsl redis-server
echo Redis iniciado en segundo plano
pause
goto menu

:backend
cls
echo Iniciando Backend Django...
start cmd /k "python manage.py runserver"
echo Backend iniciado en nueva ventana
pause
goto menu

:frontend
cls
echo Iniciando Frontend Next.js...
cd ..\frontend
start cmd /k "npm run dev"
cd ..\backend
echo Frontend iniciado en nueva ventana
pause
goto menu

:stats
cls
echo Mostrando estadisticas...
python manage.py shell -c "from notifications.models import Notification; from django.db.models import Count; print('Total:', Notification.objects.count()); print('No leidas:', Notification.objects.filter(read=False).count()); print('Por tipo:', dict(Notification.objects.values_list('type').annotate(count=Count('id'))))"
pause
goto menu

:clean
cls
echo ADVERTENCIA: Esto eliminara TODAS las notificaciones
set /p confirm="Estas seguro? (S/N): "
if /i "%confirm%"=="S" (
    python manage.py shell -c "from notifications.models import Notification; deleted = Notification.objects.all().delete(); print(f'Eliminadas {deleted[0]} notificaciones')"
    echo Notificaciones eliminadas
) else (
    echo Operacion cancelada
)
pause
goto menu

:end
echo.
echo Hasta luego!
exit
