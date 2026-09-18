"use client";

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { ArasaacLibraryDialog } from '@/components/arasaac/arasaac-library-dialog';

export default function ArasaacPage() {
  const router = useRouter();
  const locale = useLocale();
  return <main className="min-h-screen bg-orange-50">
    <ArasaacLibraryDialog open onClose={() => router.push(`/${locale}`)} />
  </main>;
}
