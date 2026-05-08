/** @type {import('next').NextConfig} */

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // disables PWA in dev mode
})

const nextConfig = {
  images: {
    domains: ['api.dicebear.com', 'avatars.githubusercontent.com'],
  },

  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'mongoose'],
  },
}

module.exports = withPWA(nextConfig)