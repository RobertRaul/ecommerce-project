from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import UserProfile

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer para el perfil del usuario"""

    class Meta:
        model = UserProfile
        fields = [
            'total_orders', 'total_spent', 'last_purchase',
            'favorite_categories', 'customer_segment'
        ]
        read_only_fields = [
            'total_orders', 'total_spent', 'last_purchase',
            'customer_segment'
        ]


class UserSerializer(serializers.ModelSerializer):
    """Serializer base de usuario"""
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'phone', 'address', 'city', 'department', 'postal_code',
            'email_verified', 'date_joined', 'profile', 'is_staff',
            'is_superuser', 'is_active'
        ]
        read_only_fields = ['id', 'email_verified', 'date_joined']


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer para registro público de usuarios"""
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = [
            'email', 'username', 'password', 'password2',
            'first_name', 'last_name', 'phone'
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({
                "password": "Las contraseñas no coinciden."
            })
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)

        # Crear perfil automáticamente
        UserProfile.objects.get_or_create(user=user)

        return user


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear usuarios desde admin"""
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    confirm_password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = [
            'email', 'username', 'first_name', 'last_name',
            'phone', 'password', 'confirm_password',
            'is_staff', 'is_superuser', 'is_active'
        ]
        extra_kwargs = {
            'email': {'required': True},
            'username': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True}
        }

    def validate_email(self, value):
        """Validar email único"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este email ya está registrado")
        return value

    def validate_username(self, value):
        """Validar username único"""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Este nombre de usuario ya existe")
        return value

    def validate(self, attrs):
        """Validar que las contraseñas coincidan"""
        if attrs['password'] != attrs.pop('confirm_password'):
            raise serializers.ValidationError({
                "password": "Las contraseñas no coinciden"
            })
        return attrs

    def create(self, validated_data):
        """Crear usuario con todos los permisos"""
        password = validated_data.pop('password')
        is_staff = validated_data.pop('is_staff', False)
        is_superuser = validated_data.pop('is_superuser', False)
        is_active = validated_data.pop('is_active', True)

        # Crear usuario
        user = User.objects.create_user(
            password=password,
            **validated_data
        )

        # Asignar permisos
        user.is_staff = is_staff
        user.is_superuser = is_superuser
        user.is_active = is_active
        user.save()

        # Crear perfil
        UserProfile.objects.get_or_create(user=user)

        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar usuarios"""

    class Meta:
        model = User
        fields = [
            'email', 'username', 'first_name', 'last_name',
            'phone', 'is_staff', 'is_superuser', 'is_active'
        ]
        extra_kwargs = {
            'email': {'required': False},
            'username': {'required': False}
        }

    def validate_email(self, value):
        """Validar email único (excepto el actual)"""
        user = self.instance
        if User.objects.filter(email=value).exclude(id=user.id).exists():
            raise serializers.ValidationError("Este email ya está registrado")
        return value

    def validate_username(self, value):
        """Validar username único (excepto el actual)"""
        user = self.instance
        if User.objects.filter(username=value).exclude(id=user.id).exists():
            raise serializers.ValidationError("Este nombre de usuario ya existe")
        return value

    def update(self, instance, validated_data):
        """Actualizar usuario con todos los campos permitidos"""
        # Campos básicos
        instance.email = validated_data.get('email', instance.email)
        instance.username = validated_data.get('username', instance.username)
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.phone = validated_data.get('phone', instance.phone)

        # Permisos (solo si están en validated_data)
        if 'is_active' in validated_data:
            instance.is_active = validated_data['is_active']
        if 'is_staff' in validated_data:
            instance.is_staff = validated_data['is_staff']
        if 'is_superuser' in validated_data:
            instance.is_superuser = validated_data['is_superuser']

        instance.save()
        return instance


class UserListSerializer(serializers.ModelSerializer):
    """Serializer para listar usuarios"""
    profile = UserProfileSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'full_name', 'phone', 'is_active', 'is_staff', 'is_superuser',
            'date_joined', 'profile', 'product_count'
        ]
        read_only_fields = ['id', 'date_joined']

    def get_full_name(self, obj):
        """Nombre completo del usuario"""
        return f"{obj.first_name} {obj.last_name}".strip()

    def get_product_count(self, obj):
        """Cantidad de productos (órdenes) del usuario"""
        return obj.orders.count() if hasattr(obj, 'orders') else 0


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer para cambiar contraseña"""
    old_password = serializers.CharField(
        required=True,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    new_password2 = serializers.CharField(
        required=True,
        style={'input_type': 'password'}
    )

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({
                "new_password": "Las contraseñas no coinciden."
            })
        return attrs

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("La contraseña actual es incorrecta.")
        return value


class UpdateProfileSerializer(serializers.ModelSerializer):
    """Serializer para actualizar perfil propio"""

    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'phone',
            'address', 'city', 'department', 'postal_code'
        ]