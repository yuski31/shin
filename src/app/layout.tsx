import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { LayoutWrapper } from '@/components/layout/layout-wrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Shin AI - Advanced AI Platform',
  description: 'Build, chat, and deploy with multiple AI models. Experience the future of artificial intelligence.',
  keywords: 'AI, artificial intelligence, machine learning, chat, automation, development',
  authors: [{ name: 'Shin AI Team' }],
  creator: 'Shin AI',
  publisher: 'Shin AI',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://shinai.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://shinai.com',
    title: 'Shin AI - Advanced AI Platform',
    description: 'Build, chat, and deploy with multiple AI models. Experience the future of artificial intelligence.',
    siteName: 'Shin AI',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Shin AI Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shin AI - Advanced AI Platform',
    description: 'Build, chat, and deploy with multiple AI models. Experience the future of artificial intelligence.',
    images: ['/og-image.png'],
    creator: '@shinai',
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
    google: 'your-google-site-verification',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${inter.className} antialiased`}
        suppressHydrationWarning={true}
      >
        <Providers>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
