import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, User, Menu, X, Search, LogOut } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import useCartStore from '@/store/cartStore';
import ThemeToggle from '@/components/ThemeToggle';

export default function Layout({ children }) {
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showProfileMenu, setShowProfileMenu] = useState(false); // ← Nuevo estado

    const { user, isAuthenticated, logout, init } = useAuthStore();
    const { cart, fetchCart, getTotals } = useCartStore();
    const { totalItems } = getTotals();

    useEffect(() => {
        init();
    }, [init]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchCart();
        }
    }, [isAuthenticated, fetchCart]);

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/productos?q=${searchQuery}`);
            setSearchQuery('');
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                ECOMMERCE
                            </div>
                        </Link>

                        {/* Search Bar - Desktop */}
                        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-8">
                            <div className="relative w-full">
                                <input
                                    type="text"
                                    placeholder="Buscar productos..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            </div>
                        </form>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-6">
                            <Link href="/productos" className="text-gray-700 hover:text-purple-600 transition">
                                Productos
                            </Link>
                            <Link href="/categorias" className="text-gray-700 hover:text-purple-600 transition">
                                Categorías
                            </Link>

                            {/* Cart */}
                            <Link href="/carrito" className="relative">
                                <ShoppingCart className="h-6 w-6 text-gray-700 hover:text-purple-600 transition" />
                                {totalItems > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                        {totalItems}
                                    </span>
                                )}
                            </Link>

                            {/* User Menu - MEJORADO */}
                            {isAuthenticated ? (
                                <div
                                    className="relative"
                                    onMouseEnter={() => setShowProfileMenu(true)}
                                    onMouseLeave={() => setShowProfileMenu(false)}
                                >
                                    <button className="flex items-center space-x-2 text-gray-700 hover:text-purple-600 transition">
                                        <User className="h-6 w-6" />
                                        <span className="text-sm">{user?.first_name || 'Usuario'}</span>
                                    </button>

                                    {showProfileMenu && (
                                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg py-2 border border-gray-100">
                                            {/* Puente invisible para conectar el botón con el menú */}
                                            <div className="absolute -top-1 left-0 right-0 h-1"></div>

                                            {/* Botón Admin - Solo visible para administradores */}
                                            {user?.is_staff && (
                                                <>
                                                    <Link
                                                        href="/admin"
                                                        className="block px-4 py-2 text-purple-600 font-semibold hover:bg-purple-50 transition flex items-center space-x-2"
                                                        onClick={() => setShowProfileMenu(false)}
                                                    >
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                        <span>Panel Admin</span>
                                                    </Link>
                                                    <hr className="my-1 border-gray-200" />
                                                </>
                                            )}

                                            <Link
                                                href="/perfil"
                                                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
                                                onClick={() => setShowProfileMenu(false)}
                                            >
                                                Mi Perfil
                                            </Link>
                                            <Link
                                                href="/ordenes"
                                                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
                                                onClick={() => setShowProfileMenu(false)}
                                            >
                                                Mis Órdenes
                                            </Link>
                                            <hr className="my-1 border-gray-200" />
                                            <button
                                                onClick={() => {
                                                    handleLogout();
                                                    setShowProfileMenu(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 flex items-center space-x-2 transition"
                                            >
                                                <LogOut className="h-4 w-4" />
                                                <span>Cerrar Sesión</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center space-x-4">
                                    <Link href="/login" className="text-gray-700 hover:text-purple-600">
                                        Ingresar
                                    </Link>
                                    <Link
                                        href="/registro"
                                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                                    >
                                        Registrarse
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
                        >
                            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>

                    {/* Mobile Search */}
                    <form onSubmit={handleSearch} className="md:hidden pb-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Buscar productos..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                            />
                            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        </div>
                    </form>
                </nav>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-white border-t">
                        <div className="px-4 py-4 space-y-4">
                            <Link
                                href="/productos"
                                className="block text-gray-700 hover:text-purple-600"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Productos
                            </Link>
                            <Link
                                href="/categorias"
                                className="block text-gray-700 hover:text-purple-600"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Categorías
                            </Link>
                            <Link
                                href="/carrito"
                                className="flex items-center space-x-2 text-gray-700 hover:text-purple-600"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <ShoppingCart className="h-5 w-5" />
                                <span>Carrito {totalItems > 0 && `(${totalItems})`}</span>
                            </Link>

                            {isAuthenticated ? (
                                <>
                                    {user?.is_staff && (
                                        <>
                                            <Link
                                                href="/admin"
                                                className="block text-purple-600 font-semibold hover:text-purple-700 flex items-center space-x-2"
                                                onClick={() => setMobileMenuOpen(false)}
                                            >
                                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <span>Panel Admin</span>
                                            </Link>
                                            <hr className="my-2 border-gray-200" />
                                        </>
                                    )}
                                    <Link
                                        href="/perfil"
                                        className="block text-gray-700 hover:text-purple-600"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Mi Perfil
                                    </Link>
                                    <Link
                                        href="/ordenes"
                                        className="block text-gray-700 hover:text-purple-600"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Mis Órdenes
                                    </Link>
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            setMobileMenuOpen(false);
                                        }}
                                        className="w-full text-left text-gray-700 hover:text-purple-600"
                                    >
                                        Cerrar Sesión
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="block text-gray-700 hover:text-purple-600"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Ingresar
                                    </Link>
                                    <Link
                                        href="/registro"
                                        className="block bg-purple-600 text-white px-4 py-2 rounded-lg text-center hover:bg-purple-700"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Registrarse
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="flex-1">
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-gray-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <h3 className="text-xl font-bold mb-4">ECOMMERCE</h3>
                            <p className="text-gray-400">
                                Tu tienda online de confianza para productos de calidad.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Compra</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li><Link href="/productos" className="hover:text-white">Productos</Link></li>
                                <li><Link href="/categorias" className="hover:text-white">Categorías</Link></li>
                                <li><Link href="/ofertas" className="hover:text-white">Ofertas</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Ayuda</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li><Link href="/contacto" className="hover:text-white">Contacto</Link></li>
                                <li><Link href="/envios" className="hover:text-white">Envíos</Link></li>
                                <li><Link href="/devoluciones" className="hover:text-white">Devoluciones</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Legal</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li><Link href="/terminos" className="hover:text-white">Términos y Condiciones</Link></li>
                                <li><Link href="/privacidad" className="hover:text-white">Privacidad</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                        <p>&copy; 2025 Ecommerce. Todos los derechos reservados.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}