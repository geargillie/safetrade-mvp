import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SafeTrade - Secure Motorcycle Marketplace',
  description: 'The most secure marketplace for buying and selling motorcycles. Military-grade identity verification and real-time stolen vehicle detection.',
  keywords: 'motorcycle, marketplace, secure, identity verification, stolen vehicle detection, safe trading',
  authors: [{ name: 'SafeTrade Team' }],
  openGraph: {
    title: 'SafeTrade - Secure Motorcycle Marketplace',
    description: 'Military-grade security for motorcycle trading',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  )
}
