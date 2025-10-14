'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    Plus, Search, Edit, Trash2, Eye,
    Package, AlertCircle, CheckCircle, XCircle
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ProductosPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);

    useEffect(() => {
        fetchProducts();
    }, [currentPage, filterStatus, searchTerm]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage,
                page_size: 10,
            });

            if (searchTerm) params.append('search', searchTerm);
            if (filterStatus !== 'all') params.append('is_active', filterStatus === 'active');

            const response = await api.get(`/products/?${params.toString()}`);
            const data = response.data.results || response.data;
            
            setProducts(Array.isArray(data) ? data : []);
            
            if (response.data.count) {
                setTotalPages(Math.ceil(response.data.count / 10));
            }
        } catch (error) {
            console.error('Error al cargar productos:', error);
            toast.error(error.response?.data?.detail || 'Error al cargar productos');
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (product) => {
        setProductToDelete(product);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/products/${productToDelete.id}/`);
            toast.success('Producto eliminado exitosamente');
            fetchProducts();
            setShowDeleteModal(false);
            setProductToDelete(null);
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            toast.error('Error al eliminar producto');
        }
    };

    const toggleStatus = async (product) => {
        try {
            await api.patch(`/products/${product.id}/`, {
                is_active: !product.is_active
            });
            toast.success(`Producto ${product.is_active ? 'desactivado' : 'activado'}`);
            fetchProducts();
        } catch (error) {
            console.error('Error al cambiar estado:', error);
            toast.error('Error al cambiar estado del producto');
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
                        <p className="text-gray-600 mt-1">
                            Gestiona tu catálogo de productos
                        </p>
                    </div>
                    <Link
                        href="/admin/productos/nuevo"
                        className="inline-flex items-center justify-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
                    >
                        <Plus className="h-5 w-5" />
                        <span>Nuevo Producto</span>
                    </Link>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search */}
                        <div className="md:col-span-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre, SKU..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="all">Todos los estados</option>
                                <option value="active">Activos</option>
                                <option value="inactive">Inactivos</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Products Table */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-12">
                            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No hay productos
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Comienza agregando tu primer producto
                            </p>
                            <Link
                                href="/admin/productos/nuevo"
                                className="inline-flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
                            >
                                <Plus className="h-5 w-5" />
                                <span>Crear Producto</span>
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Producto
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                SKU
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Precio
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Stock
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Estado
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Acciones
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {products.map((product) => (
                                            <tr key={product.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="relative w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                                            {product.primary_image ? (
                                                                <Image
                                                                    src={product.primary_image}
                                                                    alt={product.name}
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            ) : (
                                                                <div className="flex items-center justify-center h-full">
                                                                    <Package className="h-6 w-6 text-gray-400" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-900 line-clamp-1">
                                                                {product.name}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {product.brand_name}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-900 font-mono">
                                                        {product.sku}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm">
                                                        <div className="font-semibold text-gray-900">
                                                            S/ {product.price}
                                                        </div>
                                                        {product.is_on_sale && (
                                                            <div className="text-gray-500 line-through text-xs">
                                                                S/ {product.compare_price}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <StockBadge stock={product.stock} />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => toggleStatus(product)}
                                                        className="focus:outline-none"
                                                    >
                                                        {product.is_active ? (
                                                            <span className="inline-flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                                                                <CheckCircle className="h-3 w-3" />
                                                                <span>Activo</span>
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full">
                                                                <XCircle className="h-3 w-3" />
                                                                <span>Inactivo</span>
                                                            </span>
                                                        )}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-2">
                                                        <Link
                                                            href={`/productos/${product.slug}`}
                                                            target="_blank"
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                            title="Ver producto"
                                                        >
                                                            <Eye className="h-5 w-5" />
                                                        </Link>
                                                        <Link
                                                            href={`/admin/productos/${product.id}`}
                                                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                                                            title="Editar"
                                                        >
                                                            <Edit className="h-5 w-5" />
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(product)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="px-6 py-4 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Anterior
                                        </button>
                                        <span className="text-sm text-gray-700">
                                            Página {currentPage} de {totalPages}
                                        </span>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Siguiente
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Delete Modal */}
            {showDeleteModal && (
                <div 
                    className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setShowDeleteModal(false)}
                >
                    <div 
                        className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start space-x-4 mb-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertCircle className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">
                                    Eliminar producto
                                </h3>
                                <p className="text-gray-600 text-sm">
                                    ¿Estás seguro de que deseas eliminar "<strong>{productToDelete?.name}</strong>"? Esta acción no se puede deshacer.
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex space-x-3 mt-6">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 shadow-lg hover:shadow-xl transition-all"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

function StockBadge({ stock }) {
    if (stock === 0) {
        return (
            <span className="inline-flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                <XCircle className="h-3 w-3" />
                <span>Agotado</span>
            </span>
        );
    }
    
    if (stock < 10) {
        return (
            <span className="inline-flex items-center space-x-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                <AlertCircle className="h-3 w-3" />
                <span>{stock} unidades</span>
            </span>
        );
    }
    
    return (
        <span className="inline-flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
            <CheckCircle className="h-3 w-3" />
            <span>{stock} unidades</span>
        </span>
    );
}
