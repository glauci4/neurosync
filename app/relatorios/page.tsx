// app/relatorios/page.tsx
// Página temporária de relatórios, redireciona para a página de início

'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Relatorios() {
  const router = useRouter();

  useEffect(() => {
    router.push('/inicio');
  }, [router]);

  return null;
}