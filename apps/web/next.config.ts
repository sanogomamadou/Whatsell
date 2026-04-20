import type { NextConfig } from 'next';
import withPWA from '@ducanh2912/next-pwa';

const nextConfig: NextConfig = {
  // Turbopack est activé via le flag --turbopack dans le script dev
  // (voir package.json: "dev": "next dev --turbopack")
  images: {
    // Domaines autorisés pour next/image (à compléter selon les besoins)
    remotePatterns: [],
  },
  // Transpiler le package shared du workspace
  transpilePackages: ['@whatsell/shared'],
};

export default withPWA({
  dest: 'public',
  // SW désactivé en dev (Turbopack incompatible) — activer avec: next build && next start
  disable: process.env.NODE_ENV === 'development',
  // Code SW custom pour push events et notificationclick
  customWorkerSrc: 'worker',
  // Évite les warnings sur les routes Next.js dynamiques
  fallbacks: {},
})(nextConfig);
