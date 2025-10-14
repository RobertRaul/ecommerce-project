'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Users, Package, Calendar, Download } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ReportesPage() {
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('month');
    const [stats, setStats] = useState({
        totalSales: 0,
        totalOrders: 0,
        averageOrder: 0,
        newCustomers: 0,
        topProducts: [],
        salesByMonth: []
    });

    useEffect(() => {
        fetchReports();
    }, [dateRange]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const [ordersRes, productsRes] = await Promise.all([
                api.get('/orders/'),
                api.get('/products/')
            ]);

            const orders = ordersRes.data.results || ordersRes.data || [];
            const products = productsRes.data.results || productsRes.data || [];

            const completedOrders = orders.filter(o => 
                ['delivered', 'shipped', 'processing'].includes(o.status)
            );

            const totalSales = completedOrders.reduce((sum, o) => sum + parseFloat(o.total), 0);
            const averageOrder = completedOrders.length > 0 ? totalSales / completedOrders.length : 0;

            const topProducts = products
                .sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0))
                .slice(0, 5);

            setStats({
                totalSales,
                totalOrders: completedOrders.length,
                averageOrder,
                newCustomers: 0,
                topProducts,
                salesByMonth: []
            });
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al cargar reportes');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
                        <p className="text-gray-600 mt-1">Análisis y métricas de tu tienda</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="week">Última semana</option>
                            <option value="month">Último mes</option>
                            <option value="quarter">Último trimestre</option>
                            <option value="year">Último año</option>
                        </select>
                        <button className="inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                            <Download className="h-5 w-5" />
                            <span>Exportar</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    </div>
                ) : (
                    <>
                        {/* Main Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
                                <div className="flex items-center justify-between mb-4">
                                    <DollarSign className="h-10 w-10 opacity-80" />
                                    <span className="text-sm font-semibold bg-white/20 px-3 py-1 rounded-full">
                                        +12.5%
                                    </span>
                                </div>
                                <p className="text-white/80 text-sm font-medium">Ventas Totales</p>
                                <p className="text-3xl font-bold mt-1">S/ {stats.totalSales.toFixed(2)}</p>
                            </div>

                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                                <div className="flex items-center justify-between mb-4">
                                    <ShoppingCart className="h-10 w-10 opacity-80" />
                                    <span className="text-sm font-semibold bg-white/20 px-3 py-1 rounded-full">
                                        +8.2%
                                    </span>
                                </div>
                                <p className="text-white/80 text-sm font-medium">Total Órdenes</p>
                                <p className="text-3xl font-bold mt-1">{stats.totalOrders}</p>
                            </div>

                            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
                                <div className="flex items-center justify-between mb-4">
                                    <TrendingUp className="h-10 w-10 opacity-80" />
                                    <span className="text-sm font-semibold bg-white/20 px-3 py-1 rounded-full">
                                        +5.1%
                                    </span>
                                </div>
                                <p className="text-white/80 text-sm font-medium">Ticket Promedio</p>
                                <p className="text-3xl font-bold mt-1">S/ {stats.averageOrder.toFixed(2)}</p>
                            </div>

                            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
                                <div className="flex items-center justify-between mb-4">
                                    <Users className="h-10 w-10 opacity-80" />
                                    <span className="text-sm font-semibold bg-white/20 px-3 py-1 rounded-full">
                                        +15.3%
                                    </span>
                                </div>
                                <p className="text-white/80 text-sm font-medium">Nuevos Clientes</p>
                                <p className="text-3xl font-bold mt-1">{stats.newCustomers}</p>
                            </div>
                        </div>

                        {/* Top Products */}
                        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                <Package className="h-6 w-6 mr-2 text-purple-600" />
                                Productos Más Vendidos
                            </h2>
                            <div className="space-y-4">
                                {stats.topProducts.map((product, index) => (
                                    <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                                <span className="text-purple-600 font-bold">#{index + 1}</span>
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{product.name}</h3>
                                                <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-600">Ventas</p>
                                            <p className="text-lg font-bold text-gray-900">{product.sales_count || 0}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Sales Chart Placeholder */}
                        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                <Calendar className="h-6 w-6 mr-2 text-purple-600" />
                                Ventas por Período
                            </h2>
                            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                                <p className="text-gray-500">Gráfico de ventas (implementar con Chart.js o Recharts)</p>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
