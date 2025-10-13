from mcp_server import ModelQueryToolset
from .models import (
    Product,
    ProductImage,
    ProductVariant,
    Category,
    Brand,
    Review
)


class ProductTool(ModelQueryToolset):
    model = Product

    def get_queryset(self):
        return super().get_queryset().filter(is_active=True)


class ProductImageTool(ModelQueryToolset):
    model = ProductImage


class ProductVariantTool(ModelQueryToolset):
    model = ProductVariant

    def get_queryset(self):
        return super().get_queryset().filter(is_active=True)


class CategoryTool(ModelQueryToolset):
    model = Category

    def get_queryset(self):
        return super().get_queryset().filter(is_active=True)


class BrandTool(ModelQueryToolset):
    model = Brand

    def get_queryset(self):
        return super().get_queryset().filter(is_active=True)


class ReviewTool(ModelQueryToolset):
    model = Review

    def get_queryset(self):
        # Solo reviews verificadas
        return super().get_queryset().filter(is_verified_purchase=True)