const isDev = process.env.NODE_ENV !== 'production';

// Origine de l'API (seul hôte externe que le front a le droit d'appeler).
function origineApi() {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    if (isDev) return 'http://localhost:3000';
    throw new Error('NEXT_PUBLIC_API_URL doit être défini pour un build de production.');
  }
  return new URL(url).origin;
}

// CSP : 'unsafe-inline' reste nécessaire pour les scripts d'hydratation inline
// de l'App Router et le script anti-FOUC du thème (une CSP à nonce imposerait
// un rendu dynamique via middleware). Elle verrouille en revanche les
// destinations réseau (connect-src), l'intégration en iframe, <base> et les
// cibles de formulaires.
function construireCsp() {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self'",
    `connect-src 'self' ${origineApi()}${isDev ? ' ws: wss:' : ''}`,
    "object-src 'self' blob:",
    "frame-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

// Construits à la demande (dev/build/start) et non au chargement du fichier :
// `next lint` charge aussi cette config, sans NEXT_PUBLIC_API_URL.
const securityHeaders = () => [
  { key: 'Content-Security-Policy', value: construireCsp() },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // L'app n'utilise pas next/image : on coupe l'optimiseur (/_next/image),
  // surface d'attaque des avis GHSA-2xp9-vwfh-vxw4 / GHSA-h64f-5h5j-jqjh.
  images: { unoptimized: true },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders() }];
  },
};

module.exports = nextConfig;
