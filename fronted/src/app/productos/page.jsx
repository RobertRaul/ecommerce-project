'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Select from 'react-select';
import { ShoppingCart, Star, Filter, X } from 'lucide-react';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import useCartStore from '@/store/cartStore';
import toast from 'react-hot-toast';

export default function ProductsPage() {
    const searchParams = useSearchParams();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const { addToCart } = useCartStore();

    const [filters, setFilters] = useState({
        search: searchParams.get('q') || '',
        category: searchParams.get('category') || '',
        brand: searchParams.get('brand') || '',
        min_price: searchParams.get('min_price') || '',
        max_price: searchParams.get('max_price') || '',
        ordering: searchParams.get('ordering') || '-created_at',
    });

    // Para react-select
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedBrand, setSelectedBrand] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [filters]);

    const fetchData = async () => {
        try {
            const [categoriesRes, brandsRes] = await Promise.all([
                api.get('/categories/'),
                api.get('/brands/')
            ]);

            // Manejar respuesta paginada
            const categoriesData = categoriesRes.data.results || categoriesRes.data;
            const brandsData = brandsRes.data.results || brandsRes.data;

            setCategories(Array.isArray(categoriesData) ? categoriesData : []);
            setBrands(Array.isArray(brandsData) ? brandsData : []);
        } catch (error) {
            console.error('Error al cargar filtros:', error);
        }
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();

            if (filters.search) params.append('search', filters.search);
            if (filters.category) params.append('category', filters.category);
            if (filters.brand) params.append('brand', filters.brand);
            if (filters.min_price) params.append('min_price', filters.min_price);
            if (filters.max_price) params.append('max_price', filters.max_price);
            if (filters.ordering) params.append('ordering', filters.ordering);

            const response = await api.get(`/products/?${params.toString()}`);
            const productsData = response.data.results || response.data;
            setProducts(Array.isArray(productsData) ? productsData : []);
        } catch (error) {
            console.error('Error al cargar productos:', error);
            toast.error('Error al cargar productos');
        } finally {
            setLoading(false);
        }
    };

    // Cargar opciones de categorías para autocomplete
    const loadCategoryOptions = async (inputValue) => {
        try {
            const response = await api.get(`/categories/autocomplete/?search=${inputValue}`);
            return response.data.map(cat => ({
                value: cat.id,
                label: cat.name
            }));
        } catch (error) {
            console.error('Error al cargar categorías:', error);
            return [];
        }
    };

    // Cargar opciones de marcas para autocomplete
    const loadBrandOptions = async (inputValue) => {
        try {
            const response = await api.get(`/brands/autocomplete/?search=${inputValue}`);
            return response.data.map(brand => ({
                value: brand.id,
                label: brand.name
            }));
        } catch (error) {
            console.error('Error al cargar marcas:', error);
            return [];
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters({ ...filters, [key]: value });
    };

    const handleCategoryChange = (option) => {
        setSelectedCategory(option);
        handleFilterChange('category', option ? option.value : '');
    };

    const handleBrandChange = (option) => {
        setSelectedBrand(option);
        handleFilterChange('brand', option ? option.value : '');
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            category: '',
            brand: '',
            min_price: '',
            max_price: '',
            ordering: '-created_at',
        });
        setSelectedCategory(null);
        setSelectedBrand(null);
    };

    const handleAddToCart = async (productId) => {
        await addToCart(productId, 1);
    };

    // Estilos personalizados para react-select
    const selectStyles = {
        control: (base) => ({
            ...base,
            borderColor: '#d1d5db',
            '&:hover': { borderColor: '#9333ea' },
            boxShadow: 'none',
            '&:focus-within': {
                borderColor: '#9333ea',
                boxShadow: '0 0 0 2px rgba(147, 51, 234, 0.2)',
            },
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected ? '#9333ea' : state.isFocused ? '#f3f4f6' : 'white',
            color: state.isSelected ? 'white' : '#111827',
            cursor: 'pointer',
        }),
    };

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
                        <p className="text-gray-600 mt-1">
                            {loading ? 'Cargando...' : `${products.length} productos encontrados`}
                        </p>
                    </div>

                    {/* Mobile Filter Button */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="lg:hidden flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg"
                    >
                        <Filter className="h-5 w-5" />
                        <span>Filtros</span>
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Filters */}
                    <aside
                        className={`lg:w-64 ${
                            showFilters ? 'block' : 'hidden'
                        } lg:block bg-white rounded-lg shadow-md p-6 h-fit sticky top-20`}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">Filtros</h2>
                            <button
                                onClick={clearFilters}
                                className="text-sm text-purple-600 hover:text-purple-700"
                            >
                                Limpiar
                            </button>
                        </div>

                        {/* Search */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Buscar
                            </label>
                            <input
                                type="text"
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                placeholder="Buscar productos..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        {/* Category Filter con Autocomplete */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Categoría
                            </label>
                            <Select
                                instanceId={"category-select"}
                                value={selectedCategory}
                                onChange={handleCategoryChange}
                                loadOptions={loadCategoryOptions}
                                defaultOptions={categories.slice(0, 20).map(cat => ({
                                    value: cat.id,
                                    label: cat.name
                                }))}
                                isClearable
                                placeholder="Todas las categorías"
                                noOptionsMessage={() => "No hay categorías"}
                                styles={selectStyles}
                                className="react-select-container"
                                classNamePrefix="react-select"
                            />
                        </div>

                        {/* Brand Filter con Autocomplete */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Marca
                            </label>
                            <Select
                                instanceId={"brand-select"}
                                value={selectedBrand}
                                onChange={handleBrandChange}
                                loadOptions={loadBrandOptions}
                                defaultOptions={brands.slice(0, 20).map(brand => ({
                                    value: brand.id,
                                    label: brand.name
                                }))}
                                isClearable
                                placeholder="Todas las marcas"
                                noOptionsMessage={() => "No hay marcas"}
                                styles={selectStyles}
                                className="react-select-container"
                                classNamePrefix="react-select"
                            />
                        </div>

                        {/* Price Range */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Rango de Precio
                            </label>
                            <div className="flex space-x-2">
                                <input
                                    type="number"
                                    value={filters.min_price}
                                    onChange={(e) => handleFilterChange('min_price', e.target.value)}
                                    placeholder="Min"
                                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <input
                                    type="number"
                                    value={filters.max_price}
                                    onChange={(e) => handleFilterChange('max_price', e.target.value)}
                                    placeholder="Max"
                                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        </div>

                        {/* Sort */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ordenar por
                            </label>
                            <select
                                value={filters.ordering}
                                onChange={(e) => handleFilterChange('ordering', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="-created_at">Más recientes</option>
                                <option value="price">Precio: Menor a Mayor</option>
                                <option value="-price">Precio: Mayor a Menor</option>
                                <option value="-sales_count">Más vendidos</option>
                                <option value="name">Nombre: A-Z</option>
                            </select>
                        </div>
                    </aside>

                    {/* Products Grid */}
                    <div className="flex-1">
                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
                                        <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
                                        <div className="bg-gray-300 h-4 rounded mb-2"></div>
                                        <div className="bg-gray-300 h-4 rounded w-2/3"></div>
                                    </div>
                                ))}
                            </div>
                        ) : products.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-600 text-lg">No se encontraron productos</p>
                                <button
                                    onClick={clearFilters}
                                    className="mt-4 text-purple-600 hover:text-purple-700 font-semibold"
                                >
                                    Limpiar filtros
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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