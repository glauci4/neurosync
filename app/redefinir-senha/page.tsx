"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { MdCheckCircle, MdErrorOutline } from "react-icons/md";
import { toast } from "sonner";
import { useRedefinirSenha } from "@/hooks/useRedefinirSenha";
import { useValidarTokenRecuperacao } from "@/hooks/useValidarTokenRecuperacao";
import { validarSenhaForte } from "@/lib/validacoes";

function RedefinirSenhaConteudo() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const { data, isLoading } = useValidarTokenRecuperacao(token);
  const { mutateAsync, isPending, isSuccess } = useRedefinirSenha();

  const tokenInvalido = useMemo(() => {
    if (!token) return true;
    if (isLoading) return false;
    return !data?.valid;
  }, [data?.valid, isLoading, token]);

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => router.push("/"), 2500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isSuccess, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!token) {
      toast.error("Token inválido.");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      toast.error("As senhas não coincidem.");
      return;
    }

    const validacao = validarSenhaForte(novaSenha);
    if (!validacao.valida) {
      toast.error(validacao.mensagem);
      return;
    }

    try {
      await mutateAsync({ token, novaSenha, confirmarSenha });
      toast.success("Senha redefinida com sucesso.");
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : "Erro ao redefinir senha";
      toast.error(mensagem);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#F3EAF8] to-[#E1D4F0] p-4">
        <div className="rounded-2xl bg-white/80 p-8 text-center shadow-xl backdrop-blur-sm">
          <p className="text-sm text-gray-500">Validando token...</p>
        </div>
      </div>
    );
  }

  if (tokenInvalido) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#F3EAF8] to-[#E1D4F0] p-4">
        <div className="w-full max-w-md rounded-2xl bg-white/80 p-8 shadow-xl backdrop-blur-sm">
          <div className="mb-6 text-center">
            <div className="mb-2 flex justify-center">
              <Image
                src="/logo.png"
                alt="NeuroSync"
                width={80}
                height={80}
                className="rounded-2xl object-contain shadow-lg"
              />
            </div>
            <h1
              className="text-4xl font-bold text-[#9F64AF] mb-1"
              style={{ fontFamily: "Pacifico, cursive" }}
            >
              NeuroSync
            </h1>
          </div>

          <div className="rounded-xl bg-red-50 p-4 text-center text-red-700">
            <MdErrorOutline className="mx-auto mb-2" size={24} />
            <p className="font-medium">Link inválido ou expirado.</p>
            <p className="mt-1 text-sm">
              Solicite um novo link de recuperação para continuar.
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/recuperar-senha"
              className="text-sm text-[#9F64AF] hover:underline"
            >
              Solicitar nova recuperação
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#F3EAF8] to-[#E1D4F0] p-4">
        <div className="w-full max-w-md rounded-2xl bg-white/80 p-8 text-center shadow-xl backdrop-blur-sm">
          <MdCheckCircle className="mx-auto mb-3 text-green-600" size={28} />
          <p className="text-lg font-semibold text-gray-800">
            Senha redefinida com sucesso
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Redirecionando para o login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#F3EAF8] to-[#E1D4F0] p-4">
      <div className="w-full max-w-md rounded-2xl bg-white/80 p-8 shadow-xl backdrop-blur-sm">
        <div className="mb-6 text-center">
          <div className="mb-2 flex justify-center">
            <Image
              src="/logo.png"
              alt="NeuroSync"
              width={80}
              height={80}
              className="rounded-2xl object-contain shadow-lg"
            />
          </div>
          <h1
            className="text-4xl font-bold text-[#9F64AF] mb-1"
            style={{ fontFamily: "Pacifico, cursive" }}
          >
            NeuroSync
          </h1>
          <p className="mt-2 text-sm font-medium text-[#7B4FA3]">
            Crie uma nova senha de acesso
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="novaSenha"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Nova senha
            </label>
            <div className="relative">
              <input
                id="novaSenha"
                type={mostrarSenha ? "text" : "password"}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Digite a nova senha"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-gray-800 placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#9F64AF]"
                disabled={isPending}
                required
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((atual) => !atual)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-[#9F64AF]"
                aria-label="Alternar visibilidade da senha"
              >
                {mostrarSenha ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirmarSenha"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Confirmar senha
            </label>
            <div className="relative">
              <input
                id="confirmarSenha"
                type={mostrarConfirmar ? "text" : "password"}
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Confirme a nova senha"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-gray-800 placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#9F64AF]"
                disabled={isPending}
                required
              />
              <button
                type="button"
                onClick={() => setMostrarConfirmar((atual) => !atual)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-[#9F64AF]"
                aria-label="Alternar visibilidade da confirmação"
              >
                {mostrarConfirmar ? (
                  <FaEyeSlash size={18} />
                ) : (
                  <FaEye size={18} />
                )}
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
            A senha deve ter no mínimo 8 caracteres, incluindo maiúscula,
            minúscula, número e caractere especial.
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-[#9F64AF] py-2 font-medium text-white transition-all duration-300 hover:bg-[#8B509B] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Redefinindo..." : "Redefinir senha"}
          </button>

          <div className="text-center">
            <Link href="/" className="text-sm text-[#9F64AF] hover:underline">
              Voltar para o login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#F3EAF8] to-[#E1D4F0] p-4">
          <div className="rounded-2xl bg-white/80 p-8 shadow-xl backdrop-blur-sm">
            <p className="text-sm text-gray-500">Carregando...</p>
          </div>
        </div>
      }
    >
      <RedefinirSenhaConteudo />
    </Suspense>
  );
}
