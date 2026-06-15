"use client";

import { Mail } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { MdErrorOutline } from "react-icons/md";
import { toast } from "sonner";
import { useAutenticacao } from "@/hooks/useAutenticacao";
import { useAlterarEmail } from "../hooks/useAlterarEmail";

interface ErrosEmail {
  novoEmail?: string;
  senhaAtual?: string;
  geral?: string;
}

function validarEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function ErroCampo({ mensagem }: { mensagem?: string }) {
  if (!mensagem) return null;
  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
      <MdErrorOutline size={14} />
      {mensagem}
    </p>
  );
}

export default function CardAlterarEmail({
  emailAtual,
}: {
  emailAtual: string;
}) {
  const alterarEmail = useAlterarEmail();
  const { usuario, fazerLogin } = useAutenticacao();
  const [novoEmail, setNovoEmail] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [erros, setErros] = useState<ErrosEmail>({});
  const [tentouSalvar, setTentouSalvar] = useState(false);
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [novoEmailTouched, setNovoEmailTouched] = useState(false);
  const [senhaAtualTouched, setSenhaAtualTouched] = useState(false);

  const validarCampos = useCallback(() => {
    const novosErros: ErrosEmail = {};
    const emailNormalizado = novoEmail.trim().toLowerCase();

    if (!emailNormalizado || !validarEmail(emailNormalizado)) {
      novosErros.novoEmail = "Informe um e-mail válido.";
    } else if (emailNormalizado === emailAtual.trim().toLowerCase()) {
      novosErros.novoEmail =
        "O novo e-mail deve ser diferente do e-mail atual.";
    }

    if (!senhaAtual) {
      novosErros.senhaAtual = "Confirme sua senha para alterar o e-mail.";
    }

    return novosErros;
  }, [novoEmail, emailAtual, senhaAtual]);

  useEffect(() => {
    const deveValidar = tentouSalvar || novoEmail || senhaAtual;
    if (!deveValidar) {
      setErros({});
      return;
    }

    setErros(validarCampos());
  }, [tentouSalvar, novoEmail, senhaAtual, validarCampos]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setTentouSalvar(true);
    const novosErros = validarCampos();
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    try {
      const resposta = await alterarEmail.mutateAsync({
        emailAtual,
        novoEmail: novoEmail.trim().toLowerCase(),
        senhaAtual,
      });
      const emailAtualizado =
        resposta.usuario?.email || novoEmail.trim().toLowerCase();
      if (usuario) fazerLogin({ ...usuario, email: emailAtualizado });
      toast.success("E-mail de login alterado com sucesso.");
      setNovoEmail("");
      setSenhaAtual("");
      setTentouSalvar(false);
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Não foi possível alterar o e-mail.";
      const erroCampo =
        mensagem === "Este e-mail já está cadastrado."
          ? { novoEmail: mensagem }
          : mensagem === "Senha atual incorreta."
            ? { senhaAtual: mensagem }
            : { geral: mensagem };
      setErros({
        ...erroCampo,
      });
    }
  }

  return (
    <section className="rounded-2xl border border-gray-100 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F3EAF8] text-[#9F64AF]">
          <Mail size={19} />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-gray-800">
            Alterar e-mail de login
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            O e-mail será usado no próximo acesso ao NeuroSync.
          </p>
        </div>
      </div>

      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label
              htmlFor="email-atual"
              className="mb-1 block text-xs font-medium text-gray-800"
            >
              E-mail atual
            </label>
            <input
              id="email-atual"
              value={emailAtual}
              readOnly
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
            />
          </div>

          <div>
            <label
              htmlFor="novo-email"
              className="mb-1 block text-xs font-medium text-gray-800"
            >
              Novo e-mail <span className="text-rose-500">*</span>
            </label>
            <input
              id="novo-email"
              type="email"
              autoComplete="email"
              value={novoEmail}
              onChange={(event) => setNovoEmail(event.target.value)}
              onBlur={() => setNovoEmailTouched(true)}
              className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#9F64AF] ${
                (erros.novoEmail && (tentouSalvar || novoEmailTouched)) ? "border-red-500 bg-red-50" : "border-gray-300"
              }`}
            />
            {(tentouSalvar || novoEmailTouched) && <ErroCampo mensagem={erros.novoEmail} />}
          </div>

          <div>
            <label
              htmlFor="senha-email"
              className="mb-1 block text-xs font-medium text-gray-800"
            >
              Senha atual <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="senha-email"
                type={senhaVisivel ? "text" : "password"}
                autoComplete="current-password"
                value={senhaAtual}
                onChange={(event) => setSenhaAtual(event.target.value)}
                onBlur={() => setSenhaAtualTouched(true)}
                className={`w-full rounded-xl border bg-white px-3 py-2 pr-10 text-sm text-gray-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#9F64AF] ${
                  (erros.senhaAtual && (tentouSalvar || senhaAtualTouched))
                    ? "border-red-500 bg-red-50"
                    : "border-gray-300"
                }`}
              />
              { (tentouSalvar || senhaAtualTouched) && <ErroCampo mensagem={erros.senhaAtual} /> }
              <button
                type="button"
                onClick={() => setSenhaVisivel((atual) => !atual)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200 hover:text-[#9F64AF]"
                aria-label="Alternar visibilidade da senha"
              >
                {senhaVisivel ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>
          </div>
        </div>

        <ErroCampo mensagem={erros.geral} />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={alterarEmail.isPending}
            className="rounded-xl bg-[#9F64AF] px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#8B509B] disabled:opacity-60"
          >
            {alterarEmail.isPending ? "Salvando..." : "Alterar e-mail"}
          </button>
        </div>
      </form>
    </section>
  );
}
