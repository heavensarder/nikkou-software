import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Student CV Directory & Applicant Records | Nikkou Centre',
  description: 'Manage, search, filter, verify, and print standardized Japanese CVs (JIS 履歴書) for all enrolled and prospective students at Nikkou Centre.',
  openGraph: {
    title: 'Student CV Directory & Applicant Records | Nikkou Centre',
    description: 'Manage, search, filter, verify, and print standardized Japanese CVs (JIS 履歴書) for all enrolled and prospective students at Nikkou Centre.',
    url: '/dashboard/cv-maker/students',
    siteName: 'Nikkou Centre',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Nikkou Centre Student CV Records Management',
        type: 'image/jpeg',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Student CV Directory & Applicant Records | Nikkou Centre',
    description: 'Manage, search, filter, verify, and print standardized Japanese CVs (JIS 履歴書) for all enrolled and prospective students at Nikkou Centre.',
    images: ['/images/og-image.jpg'],
  },
};

export default function StudentsDirectoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
