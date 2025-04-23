/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
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
  // Configurez ici d'autres options selon les besoins de votre projet
}

module.exports = nextConfig
