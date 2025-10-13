from mcp_server import ModelQueryToolset
from .models import User, UserProfile


class UserTool(ModelQueryToolset):
    model = User

    def get_queryset(self):
        # IMPORTANTE: Excluir campos sensibles
        return super().get_queryset().only(
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'is_staff',
            'is_active',
            'date_joined'
        ).filter(is_active=True)


class UserProfileTool(ModelQueryToolset):
    model = UserProfile

    def get_queryset(self):
        # Excluir datos muy sensibles si los hay
        return super().get_queryset()