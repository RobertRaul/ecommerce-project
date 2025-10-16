"""
Middleware personalizado para autenticación JWT en WebSockets
"""

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from django.contrib.auth import get_user_model
from urllib.parse import parse_qs
import logging

logger = logging.getLogger(__name__)

User = get_user_model()


@database_sync_to_async
def get_user_from_token(token_string):
    """
    Obtener usuario desde token JWT
    """
    try:
        # Validar y decodificar el token
        token = AccessToken(token_string)
        user_id = token['user_id']

        # Obtener usuario de la base de datos
        user = User.objects.get(id=user_id)
        logger.info(f"Usuario autenticado via JWT: {user.username}")
        return user

    except (TokenError, InvalidToken) as e:
        logger.warning(f"Token JWT inválido: {str(e)}")
        return AnonymousUser()

    except User.DoesNotExist:
        logger.warning(f"Usuario no existe para el token JWT")
        return AnonymousUser()

    except Exception as e:
        logger.error(f"Error al autenticar usuario con JWT: {str(e)}")
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """
    Middleware personalizado para autenticar usuarios via JWT en WebSockets
    """

    async def __call__(self, scope, receive, send):
        # Obtener query string de la conexión
        query_string = scope.get('query_string', b'').decode('utf-8')
        query_params = parse_qs(query_string)

        # Extraer token de los parámetros
        token = query_params.get('token', [None])[0]

        if token:
            # Autenticar usuario con el token
            scope['user'] = await get_user_from_token(token)
            logger.info(f"WebSocket: Usuario autenticado = {scope['user']}")
        else:
            # Sin token, usuario anónimo
            scope['user'] = AnonymousUser()
            logger.warning("WebSocket: Sin token, usuario anónimo")

        return await super().__call__(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    """
    Stack de middleware para autenticación JWT
    """
    return JWTAuthMiddleware(inner)
