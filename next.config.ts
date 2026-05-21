import type { NextConfig } from 'next'

const config: NextConfig = {
  output: 'standalone',
  images: { unoptimized: true },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
}

export default config
