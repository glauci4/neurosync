"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAutenticacao } from "@/hooks/useAutenticacao";
import { usePerfilUsuario } from "../perfil-profissional/hooks/usePerfilUsuario";
import CardAlterarEmail from "./components/CardAlterarEmail";
import CardAlterarSenha from "./components/CardAlterarSenha";
import CardContaAcesso from "./components/CardContaAcesso";

export default function SegurancaPage() {
  const router = useRouter();
  const { carregando: authLoading, estaAutenticado } = useAutenticacao();
  const { data: perfil, isLoading, error, refetch } = usePerfilUsuario();

  useEffect(() => {
    if (!authLoading && !estaAutenticado) {
      router.push("/");
    }
  }, [authLoading, estaAutenticado, router]);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-[#9F64AF] border-t-transparent" />
          <p className="text-sm text-gray-400">Carregando segurança...</p>
        </div>
      </div>
    );
  }

  if (error || !perfil) {
    return (
      <div className="rounded-2xl border border-rose-100 bg-white/80 p-6 text-center shadow-sm">
        <p className="text-sm font-medium text-rose-600">
          Não foi possível carregar os dados de segurança.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-3 rounded-xl bg-[#9F64AF] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#8B509B]"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-5xl space-y-6 pt-4"
    >
      <CardContaAcesso perfil={perfil} />
      <CardAlterarSenha />
      <CardAlterarEmail emailAtual={perfil.email} />
    </motion.div>
  );
}

