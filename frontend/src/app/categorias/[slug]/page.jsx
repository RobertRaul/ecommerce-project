'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Star, ArrowLeft, Grid } from 'lucide-react';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import useCartStore from '@/store/cartStore';
import toast from 'react-hot-toast';

export default function CategoryDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { slug } = params;

    const [category, setCategory] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCartStore();

    useEffect(() => {
        if (slug) {
            fetchCategoryData();
        }
    }, [slug]);

    const fetchCategoryData = async () => {
        try {
            // Obtener información de la categoría
            const categoryResponse = await api.get(`/categories/${slug}/`);
            setCategory(categoryResponse.data);

            // Obtener productos de la categoría
            const productsResponse = await api.get(`/categories/${slug}/products/`);
            setProducts(productsResponse.data);
        } catch (error) {
            console.error('Error al cargar categoría:', error);
            toast.error('Error al cargar la categoría');
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = async (productId) => {
        await addToCart(productId, 1);
    };

    if (loading) {
        return (
            <Layout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="bg-white rounded-lg shadow-md p-4">
                                    <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
                                    <div className="bg-gray-300 h-4 rounded mb-2"></div>
                                    <div className="bg-gray-300 h-4 rounded w-2/3"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    if (!category) {
        return (
            <Layout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        Categoría no encontrada
                    </h2>
                    <Link href="/categorias" className="text-purple-600 hover:text-purple-700">
                        Volver a categorías
                    </Link>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumb */}
                <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
                    <Link href="/" className="hover:text-purple-600">Inicio</Link>
                    <span>/</span>
                    <Link href="/categorias" className="hover:text-purple-600">Categorías</Link>
                    <span>/</span>
                    <span className="text-gray-900">{category.name}</span>
                </nav>

                {/* Category Header */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-8 mb-8 text-white">
                    <Link
                        href="/categorias"
                        className="inline-flex items-center space-x-2 text-white/80 hover:text-white mb-4"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        <span>Volver a categorías</span>
                    </Link>

                    <div className="flex items-center space-x-4">
                        {category.image && (
                            <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-white/20 flex-shrink-0">
                                <Image
                                    src={category.image}
                                    alt={category.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        )}
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
                            {category.description && (
                                <p className="text-purple-100 mb-4">{category.description}</p>
                            )}
                            <div className="flex items-center space-x-4 text-sm">
                                <span>{products.length} productos</span>
                                {category.subcategories && category.subcategories.length > 0 && (
                                    <span>{category.subcategories.length} subcategorías</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subcategories */}
                {category.subcategories && category.subcategories.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Subcategorías</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                            {category.subcategories.map((sub) => (
                                <Link
                                    key={sub.id}
                                    href={`/categorias/${sub.slug}`}
                                    className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition text-center"
                                >
                                    <div className="relative w-16 h-16 mx-auto mb-2 bg-gray-200 rounded-lg overflow-hidden">
                                        {sub.image ? (
                                            <Image
                                                src={sub.image}
                                                alt={sub.name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <Grid className="h-8 w-8 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="font-medium text-sm text-gray-900 hover:text-purple-600">
                                        {sub.name}
                                    </h3>
                                    <p className="text-xs text-gray-600 mt-1">
                                        {sub.product_count || 0} productos
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Products */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                            Productos
                        </h2>
                        <Link
                            href={`/productos?category=${category.id}`}
                            className="text-purple-600 hover:text-purple-700 font-medium"
                        >
                            Ver todos →
                        </Link>
                    </div>

                    {products.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                            <p className="text-gray-600">No hay productos en esta categoría</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {products.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onAddToCart={handleAddToCart}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}

// Componente de tarjeta de producto
function ProductCard({ product, onAddToCart }) {
    return (
        <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden group">
            <Link href={`/productos/${product.slug}`}>
                <div className="relative h-48 bg-gray-200">
                    {product.primary_image ? (
                        <Image
                            src={product.primary_image}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <ShoppingCart className="h-16 w-16 text-gray-400" />
                        </div>
                    )}
                    {product.is_on_sale && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-lg text-sm font-bold">
                            -{product.discount_percentage}%
                        </div>
                    )}
                </div>
            </Link>

            <div className="p-4">
                <Link href={`/productos/${product.slug}`}>
                    <h3 className="font-semibold text-gray-900 mb-2 hover:text-purple-600 line-clamp-2">
                        {product.name}
                    </h3>
                </Link>

                <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                    {product.brand_name}
                </p>

                {product.average_rating > 0 && (
                    <div className="flex items-center space-x-1 mb-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-gray-600">
              {product.average_rating} ({product.review_count})
            </span>
                    </div>
                )}

                <div className="mb-4">
                    {product.is_on_sale ? (
                        <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-purple-600">
                S/ {product.price}
              </span>
                            <span className="text-sm text-gray-500 line-through">
                S/ {product.compare_price}
              </span>
                        </div>
                    ) : (
                        <span className="text-2xl font-bold text-gray-900">
              S/ {product.price}
            </span>
                    )}
                </div>

                {product.stock === 0 ? (
                    <button
                        disabled
                        className="w-full bg-gray-300 text-gray-500 py-2 rounded-lg font-semibold cursor-not-allowed"
                    >
                        Agotado
                    </button>
                ) : (
                    <button
                        onClick={() => onAddToCart(product.id)}
                        className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition flex items-center justify-center space-x-2"
                    >
                        <ShoppingCart className="h-5 w-5" />
                        <span>Agregar</span>
                    </button>
                )}
            </div>
        </div>
    );
}