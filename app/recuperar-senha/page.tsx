"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { MdCheckCircle, MdErrorOutline } from "react-icons/md";
import { toast } from "sonner";
import { useSolicitarRecuperacao } from "@/hooks/useSolicitarRecuperacao";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const { mutateAsync, isPending, isSuccess } = useSolicitarRecuperacao();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Informe um e-mail válido.");
      return;
    }

    try {
      await mutateAsync(email.trim().toLowerCase());
      toast.success(
        "Se o e-mail estiver cadastrado, enviaremos as instruções.",
      );
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao solicitar recuperação";
      toast.error(mensagem);
    }
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
            Solicite a redefinição da sua senha
          </p>
        </div>

        {isSuccess ? (
          <div className="rounded-xl bg-green-50 p-4 text-center text-green-700">
            <MdCheckCircle className="mx-auto mb-2" size={24} />
            <p className="font-medium">Verifique seu e-mail</p>
            <p className="mt-1 text-sm">
              Se o endereço estiver cadastrado, enviamos as instruções de
              recuperação.
            </p>
            <div className="mt-4">
              <Link href="/" className="text-sm text-[#9F64AF] hover:underline">
                Voltar para o login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                E-mail cadastrado
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite o e-mail da sua conta"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#9F64AF]"
                disabled={isPending}
                required
              />
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
              <MdErrorOutline size={18} className="mt-0.5 shrink-0" />
              <p>
                Se o e-mail estiver cadastrado, você receberá um link para criar
                uma nova senha.
              </p>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-[#9F64AF] py-2 font-medium text-white transition-all duration-300 hover:bg-[#8B509B] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Enviando..." : "Enviar instruções"}
            </button>

            <div className="text-center">
              <Link
                href="/"
                className="text-sm text-[#9F64AF] transition-all duration-200 hover:underline"
              >
                Voltar para o login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
