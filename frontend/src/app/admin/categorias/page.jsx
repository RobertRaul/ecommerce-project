'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    Plus, Search, Edit, Trash2, Eye, Tags, AlertCircle, CheckCircle, XCircle, Folder, Package
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function CategoriasPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);

    useEffect(() => {
        fetchCategories();
    }, [searchTerm, filterStatus]);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);

            const response = await api.get(`/categories/?${params.toString()}`);
            let data = response.data.results || response.data;
            
            // Filtrar por estado si es necesario
            if (filterStatus !== 'all') {
                data = data.filter(cat => 
                    filterStatus === 'active' ? cat.is_active : !cat.is_active
                );
            }
            
            setCategories(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error al cargar categorías:', error);
            toast.error('Error al cargar categorías');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (category) => {
        setCategoryToDelete(category);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/categories/${categoryToDelete.slug}/`);
            toast.success('Categoría eliminada exitosamente');
            fetchCategories();
            setShowDeleteModal(false);
            setCategoryToDelete(null);
        } catch (error) {
            console.error('Error al eliminar categoría:', error);
            toast.error('Error al eliminar categoría');
        }
    };

    const toggleStatus = async (category) => {
        try {
            await api.patch(`/categories/${category.slug}/`, {
                is_active: !category.is_active
            });
            toast.success(`Categoría ${category.is_active ? 'desactivada' : 'activada'}`);
            fetchCategories();
        } catch (error) {
            console.error('Error al cambiar estado:', error);
            toast.error('Error al cambiar estado de la categoría');
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Categorías</h1>
                        <p className="text-gray-600 mt-1">
                            Organiza tu catálogo de productos
                        </p>
                    </div>
                    <Link
                        href="/admin/categorias/nuevo"
                        className="inline-flex items-center justify-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition shadow-lg hover:shadow-xl"
                    >
                        <Plus className="h-5 w-5" />
                        <span>Nueva Categoría</span>
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Categorías</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{categories.length}</p>
                            </div>
                            <Folder className="h-10 w-10 text-purple-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Activas</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {categories.filter(c => c.is_active).length}
                                </p>
                            </div>
                            <CheckCircle className="h-10 w-10 text-green-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-gray-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Inactivas</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {categories.filter(c => !c.is_active).length}
                                </p>
                            </div>
                            <XCircle className="h-10 w-10 text-gray-500" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar categorías..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="all">Todos los estados</option>
                            <option value="active">Activas</option>
                            <option value="inactive">Inactivas</option>
                        </select>
                    </div>
                </div>

                {/* Categories Grid */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="text-center py-12">
                            <Tags className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No hay categorías
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Comienza creando tu primera categoría
                            </p>
                            <Link
                                href="/admin/categorias/nuevo"
                                className="inline-flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
                            >
                                <Plus className="h-5 w-5" />
                                <span>Crear Categoría</span>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                            {categories.map((category) => (
                                <div
                                    key={category.id}
                                    className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden hover:border-purple-500 hover:shadow-lg transition group"
                                >
                                    {/* Image */}
                                    <div className="relative h-40 bg-gradient-to-br from-purple-100 to-blue-100">
                                        {category.image ? (
                                            <Image
                                                src={category.image}
                                                alt={category.name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <Folder className="h-16 w-16 text-purple-300" />
                                            </div>
                                        )}
                                        <div className="absolute top-2 right-2">
                                            <button
                                                onClick={() => toggleStatus(category)}
                                                className="focus:outline-none"
                                            >
                                                {category.is_active ? (
                                                    <span className="inline-flex items-center space-x-1 px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded-full shadow-lg">
                                                        <CheckCircle className="h-3 w-3" />
                                                        <span>Activa</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-500 text-white text-xs font-semibold rounded-full shadow-lg">
                                                        <XCircle className="h-3 w-3" />
                                                        <span>Inactiva</span>
                                                    </span>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-4">
                                        <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-purple-600 transition">
                                            {category.name}
                                        </h3>
                                        {category.description && (
                                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                                {category.description}
                                            </p>
                                        )}
                                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                            <span className="flex items-center space-x-1">
                                                <Package className="h-4 w-4" />
                                                <span>{category.product_count || 0} productos</span>
                                            </span>
                                            {category.subcategories && category.subcategories.length > 0 && (
                                                <span className="flex items-center space-x-1">
                                                    <Folder className="h-4 w-4" />
                                                    <span>{category.subcategories.length} subcategorías</span>
                                                </span>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center space-x-2 pt-3 border-t border-gray-200">
                                            <Link
                                                href={`/categorias/${category.slug}`}
                                                target="_blank"
                                                className="flex-1 inline-flex items-center justify-center space-x-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition text-sm font-medium"
                                            >
                                                <Eye className="h-4 w-4" />
                                                <span>Ver</span>
                                            </Link>
                                            <Link
                                                href={`/admin/categorias/${category.slug}`}
                                                className="flex-1 inline-flex items-center justify-center space-x-1 px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition text-sm font-medium"
                                            >
                                                <Edit className="h-4 w-4" />
                                                <span>Editar</span>
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(category)}
                                                className="flex-1 inline-flex items-center justify-center space-x-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition text-sm font-medium"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                <span>Eliminar</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
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
                                    Eliminar categoría
                                </h3>
                                <p className="text-gray-600 text-sm">
                                    ¿Estás seguro de que deseas eliminar "<strong>{categoryToDelete?.name}</strong>"? Esta acción no se puede deshacer.
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
