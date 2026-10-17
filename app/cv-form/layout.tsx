import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Student CV Application Form | 日光センター (Nikkou Centre)',
  description: 'Submit your online Japanese Curriculum Vitae (履歴書) application to Nikkou Japanese Language School for Specified Skilled Worker (SSW), Technical Intern, and Student Visa programs.',
  openGraph: {
    title: 'Student CV Application Form | 日光センター (Nikkou Centre)',
    description: 'Submit your online Japanese Curriculum Vitae (履歴書) application to Nikkou Japanese Language School for Specified Skilled Worker (SSW), Technical Intern, and Student Visa programs.',
    url: '/cv-form',
    siteName: 'Nikkou Centre',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Nikkou Centre Student CV Application Form',
        type: 'image/jpeg',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Student CV Application Form | 日光センター (Nikkou Centre)',
    description: 'Submit your online Japanese Curriculum Vitae (履歴書) application to Nikkou Japanese Language School for Specified Skilled Worker (SSW), Technical Intern, and Student Visa programs.',
    images: ['/images/og-image.jpg'],
  },
};

export default function CvFormRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
