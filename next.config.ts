import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuration PWA et upload
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // Limite pour les fichiers audio
    },
  },
  
  // Headers de sécurité
  async headers() {
    return [
      {
        source: '/api/upload',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'POST, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
