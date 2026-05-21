/** @type {import('next').NextConfig} */
const config = {
  output: 'standalone',
  images: { unoptimized: true },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
}

export default config
