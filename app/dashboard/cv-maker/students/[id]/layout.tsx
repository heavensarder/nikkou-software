import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Edit Student CV Record | Nikkou Centre Admin',
  description:
    'Review, modify, and manage comprehensive student CV profile, Japanese language proficiency, education credentials, and work history.',
  openGraph: {
    title: 'Edit Student CV Record | Nikkou Centre Admin',
    description:
      'Review, modify, and manage comprehensive student CV profile, Japanese language proficiency, education credentials, and work history.',
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
    title: 'Edit Student CV Record | Nikkou Centre Admin',
    description:
      'Review, modify, and manage comprehensive student CV profile, Japanese language proficiency, education credentials, and work history.',
    images: ['/images/og-image.jpg'],
  },
};

export default function StudentRecordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
