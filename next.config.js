/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Toujours utiliser la configuration de production
  output: 'export',
  distDir: 'out',
  // Désactiver l'optimisation d'images pour être compatible avec l'export statique
  images: {
    unoptimized: true,
  },
  env: {
    // Exposer des variables d'environnement au client (attention à ne pas exposer de secrets sensibles)
    OPENROUTER_API_URL: process.env.OPENROUTER_API_URL,
  },
  // Variables d'environnement côté serveur uniquement
  serverRuntimeConfig: {
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  },
  // Optimisation du build
  poweredByHeader: false,
  // Désactiver le badge Next.js (logo N en haut à droite)
  devIndicators: {
    buildActivity: false,
  },

  // TypeScript configuration to ignore type checking during build
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },

  // ESLint configuration to ignore linting during build
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },

  // Webpack configuration to handle Node.js modules in the browser
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve 'fs', 'net', 'dns', etc. module on the client
      config.resolve.fallback = {
        fs: false,
        net: false,
        dns: false,
        tls: false,
        child_process: false,
        nodemailer: false,
      }
    }
    return config
  },
}

module.exports = nextConfig
