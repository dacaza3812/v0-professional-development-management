import type { Metadata } from 'next'
import { Instrument_Sans, Instrument_Serif, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _instrumentSans = Instrument_Sans({ subsets: ['latin'], variable: '--font-sans' })
const _instrumentSerif = Instrument_Serif({ subsets: ['latin'], weight: '400', variable: '--font-serif' })
const _geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'SGPosgrado — Secretaría General ULT',
  description: 'Sistema de Gestión de la Superación Profesional — Universidad de Las Tunas',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`${_instrumentSans.variable} ${_instrumentSerif.variable} ${_geistMono.variable} font-sans antialiased`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
