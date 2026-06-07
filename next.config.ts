import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.ctfassets.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
  compiler: {
    removeConsole: {
      exclude: ['error'],
    },
  },
  // Mejorar estabilidad del build y hot reload
  experimental: {
    // Desactivar DevTools "Segment Explorer" (bug de React Client Manifest en dev)
    devtoolSegmentExplorer: false,
    // Deshabilitar optimizaciones experimentales que pueden causar problemas
    optimizePackageImports: [],
  },
  // Configuración para mejorar el manejo de archivos
  onDemandEntries: {
    // Tiempo en ms que una página se mantiene en memoria
    maxInactiveAge: 25 * 1000,
    // Número de páginas que se mantienen simultáneamente
    pagesBufferLength: 2,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
