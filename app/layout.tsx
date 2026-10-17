import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nikkoucentre.com';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: 'Nikkou Centre - Japanese Language School & Education Consultancy',
    template: '%s | Nikkou Centre',
  },
  description: 'Official Japanese Language School & Education Consultancy Management Platform and Student CV Maker.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Nikkou Centre',
    title: 'Nikkou Centre - Japanese Language School & Education Consultancy',
    description: 'Official Japanese Language School & Education Consultancy Management Platform and Student CV Maker.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Nikkou Centre Japanese Language School & Consultancy',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nikkou Centre - Japanese Language School & Education Consultancy',
    description: 'Official Japanese Language School & Education Consultancy Management Platform and Student CV Maker.',
    images: ['/images/og-image.jpg'],
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="alternate icon" href="/favicon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;500;600;700;800;900&family=Noto+Sans+JP:wght@400;500;600;700;800;900&family=Noto+Serif+Bengali:wght@600;700;900&family=Noto+Serif+JP:wght@600;700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
