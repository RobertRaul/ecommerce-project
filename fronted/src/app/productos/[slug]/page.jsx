'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
    ShoppingCart, Star, Heart, Share2, Truck, Shield,
    RotateCcw, ChevronLeft, ChevronRight, Check, X
} from 'lucide-react';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import useCartStore from '@/store/cartStore';
import useAuthStore from '@/store/authStore';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
    const params = useParams();
    const { slug } = params;

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState('description');
    const [newReview, setNewReview] = useState({ rating: 5, title: '', comment: '' });
    const [submittingReview, setSubmittingReview] = useState(false);

    const { addToCart } = useCartStore();
    const { isAuthenticated } = useAuthStore();

    useEffect(() => {
        if (slug) {
            fetchProduct();
        }
    }, [slug]);

    const fetchProduct = async () => {
        try {
            const response = await api.get(`/products/${slug}/`);
            setProduct(response.data);
            if (response.data.variants && response.data.variants.length > 0) {
                setSelectedVariant(response.data.variants[0]);
            }
        } catch (error) {
            console.error('Error al cargar producto:', error);
            toast.error('Error al cargar el producto');
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = async () => {
        const result = await addToCart(
            product.id,
            quantity,
            selectedVariant?.id || null
        );

        if (result.success) {
            setQuantity(1);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();

        if (!isAuthenticated) {
            toast.error('Debes iniciar sesión para dejar una reseña');
            return;
        }

        setSubmittingReview(true);
        try {
            await api.post('/reviews/', {
                product: product.id,
                rating: newReview.rating,
                title: newReview.title,
                comment: newReview.comment,
            });

            toast.success('Reseña enviada exitosamente');
            setNewReview({ rating: 5, title: '', comment: '' });
            fetchProduct(); // Recargar producto para mostrar nueva reseña
        } catch (error) {
            const errorMsg = error.response?.data?.detail || 'Error al enviar reseña';
            toast.error(errorMsg);
        } finally {
            setSubmittingReview(false);
        }
    };

    const currentPrice = selectedVariant?.price || product?.price;
    const currentStock = selectedVariant?.stock || product?.stock;
    const images = product?.images || [];
    const primaryImage = product?.primary_image;

    if (loading) {
        return (
            <Layout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="animate-pulse">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-gray-300 h-96 rounded-lg"></div>
                            <div className="space-y-4">
                                <div className="bg-gray-300 h-8 rounded w-3/4"></div>
                                <div className="bg-gray-300 h-6 rounded w-1/2"></div>
                                <div className="bg-gray-300 h-12 rounded w-1/4"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    if (!product) {
        return (
            <Layout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Producto no encontrado</h1>
                    <Link href="/productos" className="text-purple-600 hover:text-purple-700">
                        Volver a productos
                    </Link>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumb */}
                <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
                    <Link href="/" className="hover:text-purple-600">Inicio</Link>
                    <span>/</span>
                    <Link href="/productos" className="hover:text-purple-600">Productos</Link>
                    <span>/</span>
                    <Link href={`/categorias/${product.category.slug}`} className="hover:text-purple-600">
                        {product.category.name}
                    </Link>
                    <span>/</span>
                    <span className="text-gray-900">{product.name}</span>
                </nav>

                {/* Product Main Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    {/* Images Gallery */}
                    <div>
                        {/* Main Image */}
                        <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-4" style={{ height: '500px' }}>
                            {images.length > 0 ? (
                                <Image
                                    src={images[selectedImage]?.image || primaryImage}
                                    alt={product.name}
                                    fill
                                    className="object-contain"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <ShoppingCart className="h-32 w-32 text-gray-400" />
                                </div>
                            )}

                            {product.is_on_sale && (
                                <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-lg font-bold">
                                    -{product.discount_percentage}% OFF
                                </div>
                            )}

                            {/* Navigation Arrows */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={() => setSelectedImage(selectedImage === 0 ? images.length - 1 : selectedImage - 1)}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg"
                                    >
                                        <ChevronLeft className="h-6 w-6" />
                                    </button>
                                    <button
                                        onClick={() => setSelectedImage(selectedImage === images.length - 1 ? 0 : selectedImage + 1)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg"
                                    >
                                        <ChevronRight className="h-6 w-6" />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {images.length > 1 && (
                            <div className="grid grid-cols-5 gap-2">
                                {images.map((image, index) => (
                                    <button
                                        key={image.id}
                                        onClick={() => setSelectedImage(index)}
                                        className={`relative aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 ${
                                            selectedImage === index ? 'border-purple-600' : 'border-transparent'
                                        }`}
                                    >
                                        <Image
                                            src={image.image}
                                            alt={`${product.name} ${index + 1}`}
                                            fill
                                            className="object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>

                        {/* Brand */}
                        {product.brand && (
                            <Link href={`/marcas/${product.brand.slug}`} className="text-purple-600 hover:text-purple-700 mb-4 inline-block">
                                {product.brand.name}
                            </Link>
                        )}

                        {/* Rating */}
                        {product.average_rating > 0 && (
                            <div className="flex items-center space-x-2 mb-4">
                                <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`h-5 w-5 ${
                                                i < Math.floor(product.average_rating)
                                                    ? 'fill-yellow-400 text-yellow-400'
                                                    : 'text-gray-300'
                                            }`}
                                        />
                                    ))}
                                </div>
                                <span className="text-sm text-gray-600">
                  {product.average_rating} ({product.review_count} reseñas)
                </span>
                            </div>
                        )}

                        {/* Price */}
                        <div className="mb-6">
                            {product.is_on_sale ? (
                                <div className="flex items-baseline space-x-3">
                  <span className="text-4xl font-bold text-purple-600">
                    S/ {currentPrice}
                  </span>
                                    <span className="text-2xl text-gray-500 line-through">
                    S/ {product.compare_price}
                  </span>
                                    <span className="text-green-600 font-semibold">
                    Ahorra S/ {(product.compare_price - currentPrice).toFixed(2)}
                  </span>
                                </div>
                            ) : (
                                <span className="text-4xl font-bold text-gray-900">
                  S/ {currentPrice}
                </span>
                            )}
                        </div>

                        {/* Short Description */}
                        <p className="text-gray-600 mb-6">{product.short_description}</p>

                        {/* Variants */}
                        {product.variants && product.variants.length > 0 && (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Variantes:
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {product.variants.map((variant) => (
                                        <button
                                            key={variant.id}
                                            onClick={() => setSelectedVariant(variant)}
                                            disabled={!variant.is_active || variant.stock === 0}
                                            className={`px-4 py-2 rounded-lg border-2 transition ${
                                                selectedVariant?.id === variant.id
                                                    ? 'border-purple-600 bg-purple-50 text-purple-600'
                                                    : 'border-gray-300 hover:border-purple-300'
                                            } ${
                                                !variant.is_active || variant.stock === 0
                                                    ? 'opacity-50 cursor-not-allowed'
                                                    : ''
                                            }`}
                                        >
                                            {variant.name}
                                            {variant.stock === 0 && ' (Agotado)'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Stock Status */}
                        <div className="mb-6">
                            {currentStock > 0 ? (
                                <div className="flex items-center space-x-2 text-green-600">
                                    <Check className="h-5 w-5" />
                                    <span className="font-medium">
                    En stock ({currentStock} disponibles)
                  </span>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-2 text-red-600">
                                    <X className="h-5 w-5" />
                                    <span className="font-medium">Agotado</span>
                                </div>
                            )}
                        </div>

                        {/* Quantity Selector */}
                        {currentStock > 0 && (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Cantidad:
                                </label>
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                                    >
                                        -
                                    </button>
                                    <input
                                        type="number"
                                        min="1"
                                        max={currentStock}
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.max(1, Math.min(currentStock, parseInt(e.target.value) || 1)))}
                                        className="w-20 text-center px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                    <button
                                        onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                                        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-6">
                            <button
                                onClick={handleAddToCart}
                                disabled={currentStock === 0}
                                className="flex-1 flex items-center justify-center space-x-2 bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                            >
                                <ShoppingCart className="h-5 w-5" />
                                <span>{currentStock === 0 ? 'Agotado' : 'Agregar al Carrito'}</span>
                            </button>
                            <button className="px-6 py-3 border-2 border-purple-600 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition">
                                <Heart className="h-5 w-5" />
                            </button>
                            <button className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition">
                                <Share2 className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Features */}
                        <div className="border-t border-gray-200 pt-6 space-y-4">
                            <div className="flex items-center space-x-3 text-gray-700">
                                <Truck className="h-6 w-6 text-purple-600" />
                                <div>
                                    <p className="font-medium">Envío rápido</p>
                                    <p className="text-sm text-gray-600">Entrega en 2-5 días hábiles</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3 text-gray-700">
                                <Shield className="h-6 w-6 text-purple-600" />
                                <div>
                                    <p className="font-medium">Garantía de calidad</p>
                                    <p className="text-sm text-gray-600">Productos 100% originales</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3 text-gray-700">
                                <RotateCcw className="h-6 w-6 text-purple-600" />
                                <div>
                                    <p className="font-medium">Devoluciones fáciles</p>
                                    <p className="text-sm text-gray-600">30 días para devolver</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs Section */}
                <div className="mb-12">
                    <div className="border-b border-gray-200 mb-6">
                        <nav className="flex space-x-8">
                            {['description', 'specifications', 'reviews'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                        activeTab === tab
                                            ? 'border-purple-600 text-purple-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    {tab === 'description' && 'Descripción'}
                                    {tab === 'specifications' && 'Especificaciones'}
                                    {tab === 'reviews' && `Reseñas (${product.review_count})`}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="bg-white rounded-lg p-6">
                        {activeTab === 'description' && (
                            <div className="prose max-w-none">
                                <p className="text-gray-700 whitespace-pre-line">{product.description}</p>
                            </div>
                        )}

                        {activeTab === 'specifications' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex justify-between py-2 border-b">
                                    <span className="font-medium">SKU:</span>
                                    <span className="text-gray-600">{product.sku}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b">
                                    <span className="font-medium">Categoría:</span>
                                    <span className="text-gray-600">{product.category.name}</span>
                                </div>
                                {product.brand && (
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="font-medium">Marca:</span>
                                        <span className="text-gray-600">{product.brand.name}</span>
                                    </div>
                                )}
                                {product.weight && (
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="font-medium">Peso:</span>
                                        <span className="text-gray-600">{product.weight} kg</span>
                                    </div>
                                )}
                                {product.length && product.width && product.height && (
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="font-medium">Dimensiones:</span>
                                        <span className="text-gray-600">
                      {product.length} x {product.width} x {product.height} cm
                    </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'reviews' && (
                            <div>
                                {/* Write Review Form */}
                                {isAuthenticated && (
                                    <div className="mb-8 bg-gray-50 rounded-lg p-6">
                                        <h3 className="text-lg font-semibold mb-4">Escribe una reseña</h3>
                                        <form onSubmit={handleSubmitReview} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Calificación
                                                </label>
                                                <div className="flex space-x-2">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <button
                                                            key={star}
                                                            type="button"
                                                            onClick={() => setNewReview({ ...newReview, rating: star })}
                                                            className="focus:outline-none"
                                                        >
                                                            <Star
                                                                className={`h-8 w-8 ${
                                                                    star <= newReview.rating
                                                                        ? 'fill-yellow-400 text-yellow-400'
                                                                        : 'text-gray-300'
                                                                }`}
                                                            />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Título
                                                </label>
                                                <input
                                                    type="text"
                                                    value={newReview.title}
                                                    onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    placeholder="Resumen de tu experiencia"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Comentario
                                                </label>
                                                <textarea
                                                    value={newReview.comment}
                                                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                                                    required
                                                    rows="4"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    placeholder="Cuéntanos sobre tu experiencia con este producto"
                                                ></textarea>
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={submittingReview}
                                                className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 transition"
                                            >
                                                {submittingReview ? 'Enviando...' : 'Publicar Reseña'}
                                            </button>
                                        </form>
                                    </div>
                                )}

                                {/* Reviews List */}
                                <div className="space-y-6">
                                    {product.reviews && product.reviews.length > 0 ? (
                                        product.reviews.map((review) => (
                                            <div key={review.id} className="border-b border-gray-200 pb-6">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="flex">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star
                                                                    key={i}
                                                                    className={`h-4 w-4 ${
                                                                        i < review.rating
                                                                            ? 'fill-yellow-400 text-yellow-400'
                                                                            : 'text-gray-300'
                                                                    }`}
                                                                />
                                                            ))}
                                                        </div>
                                                        <span className="font-medium text-gray-900">
                              {review.user_name}
                            </span>
                                                        {review.is_verified_purchase && (
                                                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                Compra verificada
                              </span>
                                                        )}
                                                    </div>
                                                    <span className="text-sm text-gray-500">
                            {new Date(review.created_at).toLocaleDateString('es-PE')}
                          </span>
                                                </div>
                                                {review.title && (
                                                    <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
                                                )}
                                                <p className="text-gray-700">{review.comment}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-600 text-center py-8">
                                            Aún no hay reseñas para este producto. ¡Sé el primero en opinar!
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Related Products */}
                {product.related_products && product.related_products.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Productos Relacionados</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {product.related_products.map((relatedProduct) => (
                                <Link
                                    key={relatedProduct.id}
                                    href={`/productos/${relatedProduct.slug}`}
                                    className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden group"
                                >
                                    <div className="relative h-48 bg-gray-200">
                                        {relatedProduct.primary_image ? (
                                            <Image
                                                src={relatedProduct.primary_image}
                                                alt={relatedProduct.name}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <ShoppingCart className="h-16 w-16 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                                            {relatedProduct.name}
                                        </h3>
                                        <div className="text-xl font-bold text-purple-600">
                                            S/ {relatedProduct.price}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}