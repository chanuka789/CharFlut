import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@/components/Header'
import { MeshBackground } from '@/components/MeshBackground'
import { ThemeProvider, ThemeScript } from '@/components/ThemeProvider'
import { SessionWrapper } from '@/components/SessionWrapper'

export const metadata: Metadata = {
  title: {
    default: 'CharFlut — Premium Liquid Glass Shopping',
    template: '%s | CharFlut',
  },
  description: 'Experience luxury redefined through our cutting-edge liquid glass interface.',
  keywords: ['e-commerce', 'premium', 'shopping', 'luxury'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <SessionWrapper>
          <ThemeProvider>
            <MeshBackground />
            <Header />
            <div className="page-wrapper">
              {children}
            </div>
          </ThemeProvider>
        </SessionWrapper>
      </body>
    </html>
  )
}
