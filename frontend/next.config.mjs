/** @type {import('next').NextConfig} */
const nextConfig = {
    // Para Docker standalone output
    output: 'standalone',
    
    // Configuración de imágenes
    images: {
        domains: ['localhost', 'backend'],
        unoptimized: process.env.NODE_ENV === 'development',
    },
    
    // Configuración de API
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
            },
        ];
    },
};

export default nextConfig;
