```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { WalletProvider } from '@/components/providers/wallet-provider'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/providers/theme-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'StreamFlow - Token Streaming & Vesting Platform',
  description: 'Real-time token streaming and vesting platform for Solana with treasury management and automated payments.',
  keywords: ['solana', 'token streaming', 'vesting', 'defi', 'treasury management'],
  authors: [{ name: 'StreamFlow' }],
  creator: 'StreamFlow',
  publisher: 'StreamFlow',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://streamflow.finance'),
  openGraph: {
    title: 'StreamFlow - Token Streaming & Vesting Platform',
    description: 'Real-time token streaming and vesting platform for Solana with treasury management and automated payments.',
    url: 'https://streamflow.finance',
    siteName: 'StreamFlow',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'StreamFlow Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StreamFlow - Token Streaming & Vesting Platform',
    description: 'Real-time token streaming and vesting platform for Solana with treasury management and automated payments.',
    images: ['/og-image.png'],
    creator: '@streamflow_fi',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="color-scheme" content="dark" />
      </head>
      <body className={`${inter.className} min-h-screen bg-slate-900 text-slate-100 antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <WalletProvider>
            <div className="relative flex min-h-screen flex-col">
              <div className="flex-1">
                {children}
              </div>
            </div>
            <Toaster />
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```