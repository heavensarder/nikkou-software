import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Program Registration & Student CV Form | Nikkou Centre',
  description: 'Enroll in Nikkou Centre Japanese Language and vocational training programs. Submit your official Japanese CV and educational particulars online.',
  openGraph: {
    title: 'Program Registration & Student CV Form | Nikkou Centre',
    description: 'Enroll in Nikkou Centre Japanese Language and vocational training programs. Submit your official Japanese CV and educational particulars online.',
    siteName: 'Nikkou Centre',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Nikkou Centre Program Application Form',
        type: 'image/jpeg',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Program Registration & Student CV Form | Nikkou Centre',
    description: 'Enroll in Nikkou Centre Japanese Language and vocational training programs. Submit your official Japanese CV and educational particulars online.',
    images: ['/images/og-image.jpg'],
  },
};

export default function FormCodeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
