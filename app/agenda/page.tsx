// app/agenda/page.tsx
// Página temporária da agenda, redireciona para a página de início

'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Agenda() {
  const router = useRouter();

  useEffect(() => {
    router.push('/inicio');
  }, [router]);

  return null;
}