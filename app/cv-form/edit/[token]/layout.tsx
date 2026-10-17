import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Edit & Resubmit CV Application | Nikkou Centre',
  description: 'Update and resubmit your Japanese CV application directly to Nikkou Japanese Language School for teacher review and administrative verification.',
  openGraph: {
    title: 'Edit & Resubmit CV Application | Nikkou Centre',
    description: 'Update and resubmit your Japanese CV application directly to Nikkou Japanese Language School for teacher review and administrative verification.',
    siteName: 'Nikkou Centre',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Nikkou Centre Application Edit Portal',
        type: 'image/jpeg',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Edit & Resubmit CV Application | Nikkou Centre',
    description: 'Update and resubmit your Japanese CV application directly to Nikkou Japanese Language School for teacher review and administrative verification.',
    images: ['/images/og-image.jpg'],
  },
};

export default function EditTokenLayout({ children }: { children: React.ReactNode }) {
  return children;
}
