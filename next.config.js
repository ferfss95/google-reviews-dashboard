/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
  },
  webpack: (config, { isServer }) => {
    // Configuração robusta de aliases para resolver módulos corretamente
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    };
    
    // Garante que arquivos TypeScript em data/ sejam resolvidos corretamente
    config.resolve.extensions = [
      ...config.resolve.extensions,
      '.ts',
      '.tsx',
    ];
    
    // Configuração adicional para garantir resolução de módulos
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      path.resolve(__dirname, '.'),
    ];
    
    return config;
  },
};

module.exports = nextConfig;

