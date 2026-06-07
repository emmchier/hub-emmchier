import { ReactNode } from 'react';
import { notFound } from 'next/navigation';

export default async function WorkPage({
  params,
}: {
  params: Promise<{ slug: string; children: ReactNode }>;
}) {
  // está OK aquí no haga ninguna consulta.
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  return <></>;
}
