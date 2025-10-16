from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'type', 'title', 'priority', 'read', 'created_at')
    list_filter = ('type', 'priority', 'read', 'created_at')
    search_fields = ('title', 'message', 'user__username', 'user__email')
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('user', 'type', 'title', 'message')
        }),
        ('Configuración', {
            'fields': ('priority', 'read', 'read_at')
        }),
        ('Metadata', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
        ('Fechas', {
            'fields': ('created_at',)
        }),
    )
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        # Los admin pueden ver todas las notificaciones
        if request.user.is_superuser:
            return qs
        # Los staff solo ven sus propias notificaciones
        return qs.filter(user=request.user)
