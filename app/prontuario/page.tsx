// app/prontuario/page.tsx
// Página temporária de prontuário, redireciona para a página de início

'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Prontuario() {
  const router = useRouter();

  useEffect(() => {
    router.push('/inicio');
  }, [router]);

  return null;
}