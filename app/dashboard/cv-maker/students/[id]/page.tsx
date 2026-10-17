import { redirect } from 'next/navigation';

export default async function StudentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/cv-maker/students/${id}/edit`);
}
