'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Star, TrendingUp, Zap } from 'lucide-react';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import useCartStore from '@/store/cartStore';
import toast from 'react-hot-toast';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [onSaleProducts, setOnSaleProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCartStore();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const [featured, onSale] = await Promise.all([
        api.get('/products/featured/'),
        api.get('/products/on_sale/')
      ]);

      setFeaturedProducts(featured.data);
      setOnSaleProducts(onSale.data);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId) => {
    await addToCart(productId, 1);
  };

  return (
      <Layout>
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Bienvenido a tu Tienda Online
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-purple-100">
                Los mejores productos de tecnología al mejor precio
              </p>
              <Link
                  href="/productos"
                  className="inline-block bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
              >
                Ver Todos los Productos
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                  <Zap className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Envío Rápido</h3>
                <p className="text-gray-600">Entregas en 24-48 horas en Lima</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <Star className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Calidad Garantizada</h3>
                <p className="text-gray-600">Productos 100% originales</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <ShoppingCart className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Compra Segura</h3>
                <p className="text-gray-600">Pago con Yape, Plin o transferencia</p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Productos Destacados</h2>
              <Link href="/productos" className="text-purple-600 hover:text-purple-700 font-semibold">
                Ver todos →
              </Link>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
                        <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
                        <div className="bg-gray-300 h-4 rounded mb-2"></div>
                        <div className="bg-gray-300 h-4 rounded w-2/3"></div>
                      </div>
                  ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {featuredProducts.map((product) => (
                      <ProductCard
                          key={product.id}
                          product={product}
                          onAddToCart={handleAddToCart}
                      />
                  ))}
                </div>
            )}
          </div>
        </section>

        {/* On Sale Products */}
        {onSaleProducts.length > 0 && (
            <section className="py-12 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-8 w-8 text-red-600" />
                    <h2 className="text-3xl font-bold text-gray-900">Ofertas Especiales</h2>
                  </div>
                  <Link href="/productos?on_sale=true" className="text-purple-600 hover:text-purple-700 font-semibold">
                    Ver todas →
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {onSaleProducts.slice(0, 4).map((product) => (
                      <ProductCard
                          key={product.id}
                          product={product}
                          onAddToCart={handleAddToCart}
                      />
                  ))}
                </div>
              </div>
            </section>
        )}

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ¿Listo para comprar?
            </h2>
            <p className="text-xl mb-8 text-purple-100">
              Regístrate y obtén descuentos exclusivos en tu primera compra
            </p>
            <Link
                href="/registro"
                className="inline-block bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Crear Cuenta Gratis
            </Link>
          </div>
        </section>
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

          {/* Rating */}
          {product.average_rating > 0 && (
              <div className="flex items-center space-x-1 mb-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm text-gray-600">
              {product.average_rating} ({product.review_count})
            </span>
              </div>
          )}

          {/* Price */}
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

          {/* Stock */}
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
                <span>Agregar al Carrito</span>
              </button>
          )}
        </div>
      </div>
  );
}