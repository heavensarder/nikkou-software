'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function StudentDetailsRedirect() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  useEffect(() => {
    if (id) {
      router.replace(`/dashboard/cv-maker/students/${id}/edit`);
    }
  }, [id, router]);

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: 'var(--nikkou-navy)' }}>
        <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
        <div style={{ fontSize: '15px', fontWeight: 700 }}>Redirecting to student editor...</div>
      </div>
    </div>
  );
}

export default function StudentDetailsPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: 'var(--nikkou-navy)' }}>
            <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
            <div style={{ fontSize: '15px', fontWeight: 700 }}>Loading...</div>
          </div>
        </div>
      }
    >
      <StudentDetailsRedirect />
    </Suspense>
  );
}
