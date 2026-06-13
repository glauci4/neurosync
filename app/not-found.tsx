// app/not-found.tsx
// Página de erro 404 - Redireciona para o dashboard após 3 segundos

"use client";

import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona para o dashboard após 3 segundos
    const timer = setTimeout(() => {
      router.push("/inicio");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3EAF8] to-[#E1D4F0] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={40} className="text-[#9F64AF]" />
        </div>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Página não encontrada
        </h2>
        <p className="text-gray-500 mb-6">
          A página que você tentou acessar não existe ou está em
          desenvolvimento.
        </p>
        <div className="animate-pulse">
          <p className="text-sm text-gray-400">
            Redirecionando para o dashboard em 3 segundos...
          </p>
        </div>
      </div>
    </div>
  );
}

