import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings & AI Configuration | Nikkou Centre',
  description:
    'Manage AI translation service credentials (OpenAI & Google Gemini), database synchronization, system preferences, and security settings.',
  openGraph: {
    title: 'Settings & AI Configuration | Nikkou Centre',
    description:
      'Manage AI translation service credentials (OpenAI & Google Gemini), database synchronization, system preferences, and security settings.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Nikkou Japanese Language & Training Centre',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Settings & AI Configuration | Nikkou Centre',
    description:
      'Manage AI translation service credentials (OpenAI & Google Gemini), database synchronization, system preferences, and security settings.',
    images: ['/images/og-image.jpg'],
  },
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
