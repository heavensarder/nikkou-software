import type { Metadata } from 'next';
import LoginForm from '@/components/LoginForm';

export const metadata: Metadata = {
  title: 'Admin Portal Login | Nikkou Centre Japanese Language School',
  description: 'Official administrative access and student admissions management portal for Nikkou Centre Japanese Language School & Education Consultancy.',
  openGraph: {
    title: 'Admin Portal Login | Nikkou Centre Japanese Language School',
    description: 'Official administrative access and student admissions management portal for Nikkou Centre Japanese Language School & Education Consultancy.',
    url: '/',
    siteName: 'Nikkou Centre',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Nikkou Centre Japanese Language School Portal',
        type: 'image/jpeg',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Admin Portal Login | Nikkou Centre Japanese Language School',
    description: 'Official administrative access and student admissions management portal for Nikkou Centre Japanese Language School & Education Consultancy.',
    images: ['/images/og-image.jpg'],
  },
};

export default function LoginPage() {
  return <LoginForm />;
}
