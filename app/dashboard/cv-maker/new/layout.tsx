import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create New Student CV | Nikkou Centre Admin',
  description: 'Create and generate a new standardized Japanese CV (履歴書) with bilingual Bengali-Japanese translation and automated age/date formatting.',
  openGraph: {
    title: 'Create New Student CV | Nikkou Centre Admin',
    description: 'Create and generate a new standardized Japanese CV (履歴書) with bilingual Bengali-Japanese translation and automated age/date formatting.',
    url: '/dashboard/cv-maker/new',
    siteName: 'Nikkou Centre',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Nikkou Centre Create Student CV',
        type: 'image/jpeg',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Create New Student CV | Nikkou Centre Admin',
    description: 'Create and generate a new standardized Japanese CV (履歴書) with bilingual Bengali-Japanese translation and automated age/date formatting.',
    images: ['/images/og-image.jpg'],
  },
};

export default function NewStudentCvLayout({ children }: { children: React.ReactNode }) {
  return children;
}
