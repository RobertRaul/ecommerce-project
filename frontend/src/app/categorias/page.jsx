'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Package, ChevronRight, Grid, List } from 'lucide-react';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await api.get('/categories/');
            const categoriesData = response.data.results || response.data;
            setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        } catch (error) {
            console.error('Error al cargar categorías:', error);
            toast.error('Error al cargar categorías');
        } finally {
            setLoading(false);
        }
    };

    // Filtrar solo categorías principales (sin padre)
    const mainCategories = categories.filter(cat => !cat.parent);

    if (loading) {
        return (
            <Layout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="bg-white rounded-lg shadow-md p-6">
                                    <div className="bg-gray-300 h-32 rounded-lg mb-4"></div>
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

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Todas las Categorías
                    </h1>
                    <p className="text-gray-600">
                        Explora nuestros productos por categoría
                    </p>
                </div>

                {/* Categories Grid */}
                {mainCategories.length === 0 ? (
                    <div className="text-center py-16">
                        <Package className="mx-auto h-24 w-24 text-gray-400 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            No hay categorías disponibles
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Las categorías aparecerán aquí cuando sean creadas
                        </p>
                        <Link
                            href="/productos"
                            className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
                        >
                            Ver Todos los Productos
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {mainCategories.map((category) => (
                            <CategoryCard key={category.id} category={category} />
                        ))}
                    </div>
                )}

                {/* Featured Categories Section */}
                {mainCategories.length > 0 && (
                    <div className="mt-16">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                            Categorías Destacadas
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {mainCategories.slice(0, 4).map((category) => (
                                <FeaturedCategoryCard key={category.id} category={category} />
                            ))}
                        </div>
                    </div>
                )}

                {/* CTA Section */}
                <div className="mt-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-8 text-white text-center">
                    <h3 className="text-2xl font-bold mb-2">
                        ¿No encuentras lo que buscas?
                    </h3>
                    <p className="mb-6 text-purple-100">
                        Usa nuestro buscador para encontrar productos específicos
                    </p>
                    <Link
                        href="/productos"
                        className="inline-block bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
                    >
                        Buscar Productos
                    </Link>
                </div>
            </div>
        </Layout>
    );
}

// Componente de tarjeta de categoría
function CategoryCard({ category }) {
    return (
        <Link
            href={`/productos?category=${category.id}`}
            className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all overflow-hidden group"
        >
            <div className="relative h-40 bg-gradient-to-br from-purple-500 to-blue-500 overflow-hidden">
                {category.image ? (
                    <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <Package className="h-16 w-16 text-white/80" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>

            <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition">
                        {category.name}
                    </h3>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 transition" />
                </div>

                {category.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {category.description}
                    </p>
                )}

                <div className="flex items-center justify-between">
          <span className="text-sm text-purple-600 font-medium">
            {category.product_count || 0} productos
          </span>
                    {category.subcategories && category.subcategories.length > 0 && (
                        <span className="text-xs text-gray-500">
              {category.subcategories.length} subcategorías
            </span>
                    )}
                </div>

                {/* Subcategories */}
                {category.subcategories && category.subcategories.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs font-medium text-gray-700 mb-2">Subcategorías:</p>
                        <div className="flex flex-wrap gap-2">
                            {category.subcategories.slice(0, 3).map((sub) => (
                                <Link
                                    key={sub.id}
                                    href={`/productos?category=${sub.id}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-xs bg-gray-100 hover:bg-purple-100 hover:text-purple-600 px-2 py-1 rounded transition"
                                >
                                    {sub.name}
                                </Link>
                            ))}
                            {category.subcategories.length > 3 && (
                                <span className="text-xs text-gray-500 px-2 py-1">
                  +{category.subcategories.length - 3} más
                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Link>
    );
}

// Componente de tarjeta destacada
function FeaturedCategoryCard({ category }) {
    return (
        <Link
            href={`/productos?category=${category.id}`}
            className="relative bg-white rounded-lg shadow-md hover:shadow-xl transition-all overflow-hidden group h-48"
        >
            {/* Background Image */}
            <div className="absolute inset-0">
                {category.image ? (
                    <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500">
                        <div className="flex items-center justify-center h-full">
                            <Package className="h-24 w-24 text-white/30" />
                        </div>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30"></div>
            </div>

            {/* Content */}
            <div className="relative h-full p-6 flex flex-col justify-between text-white">
                <div>
                    <h3 className="text-2xl font-bold mb-2 group-hover:text-purple-300 transition">
                        {category.name}
                    </h3>
                    {category.description && (
                        <p className="text-sm text-gray-200 line-clamp-2">
                            {category.description}
                        </p>
                    )}
                </div>

                <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {category.product_count || 0} productos disponibles
          </span>
                    <ChevronRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
        </Link>
    );
}