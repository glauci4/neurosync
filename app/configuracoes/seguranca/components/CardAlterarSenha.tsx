"use client";

import { KeyRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { MdErrorOutline } from "react-icons/md";
import { toast } from "sonner";
import { useAlterarSenha } from "../hooks/useAlterarSenha";

interface ErrosSenha {
  senhaAtual?: string;
  novaSenha?: string;
  confirmarNovaSenha?: string;
  geral?: string;
}

function validarSenhaForte(senha: string) {
  if (senha.length < 8) return "A senha deve ter pelo menos 8 caracteres";
  if (!/[A-Z]/.test(senha))
    return "A senha deve conter pelo menos uma letra maiúscula";
  if (!/[a-z]/.test(senha))
    return "A senha deve conter pelo menos uma letra minúscula";
  if (!/[0-9]/.test(senha)) return "A senha deve conter pelo menos um número";
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(senha))
    return "A senha deve conter pelo menos um caractere especial";
  return "";
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

function CampoSenha({
  id,
  label,
  valor,
  erro,
  onChange,
}: {
  id: string;
  label: string;
  valor: string;
  erro?: string;
  onChange: (valor: string) => void;
}) {
  const [visivel, setVisivel] = useState(false);

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-xs font-medium text-gray-800"
      >
        {label} <span className="text-rose-500">*</span>
      </label>
      <div className="relative">
        <input
          id={id}
          type={visivel ? "text" : "password"}
          value={valor}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full rounded-xl border bg-white px-3 py-2 pr-10 text-sm text-gray-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#9F64AF] ${
            erro ? "border-red-500 bg-red-50" : "border-gray-300"
          }`}
        />
        <button
          type="button"
          onClick={() => setVisivel((atual) => !atual)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200 hover:text-[#9F64AF]"
          aria-label="Alternar visibilidade da senha"
        >
          {visivel ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
        </button>
      </div>
      <ErroCampo mensagem={erro} />
    </div>
  );
}

export default function CardAlterarSenha() {
  const alterarSenha = useAlterarSenha();
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState("");
  const [erros, setErros] = useState<ErrosSenha>({});
  const [tentouSalvar, setTentouSalvar] = useState(false);

  const validarCampos = useCallback(() => {
    const novosErros: ErrosSenha = {};

    if (!senhaAtual) novosErros.senhaAtual = "Informe sua senha atual.";
    if (!novaSenha) {
      novosErros.novaSenha = "Informe a nova senha.";
    } else {
      const erroSenha = validarSenhaForte(novaSenha);
      if (erroSenha) novosErros.novaSenha = erroSenha;
    }
    if (!confirmarNovaSenha) {
      novosErros.confirmarNovaSenha = "Confirme a nova senha.";
    } else if (novaSenha && confirmarNovaSenha !== novaSenha) {
      novosErros.confirmarNovaSenha = "As senhas não coincidem.";
    }
    if (senhaAtual && novaSenha && senhaAtual === novaSenha) {
      novosErros.novaSenha = "A nova senha deve ser diferente da senha atual.";
    }

    return novosErros;
  }, [senhaAtual, novaSenha, confirmarNovaSenha]);

  useEffect(() => {
    const deveValidar =
      tentouSalvar || senhaAtual || novaSenha || confirmarNovaSenha;
    if (!deveValidar) {
      setErros({});
      return;
    }

    setErros(validarCampos());
  }, [tentouSalvar, senhaAtual, novaSenha, confirmarNovaSenha, validarCampos]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setTentouSalvar(true);
    const novosErros = validarCampos();
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    try {
      await alterarSenha.mutateAsync({
        senhaAtual,
        novaSenha,
        confirmarNovaSenha,
      });
      toast.success("Senha alterada com sucesso.");
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarNovaSenha("");
      setTentouSalvar(false);
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Não foi possível alterar a senha.";
      setErros({
        ...(mensagem === "Senha atual incorreta."
          ? { senhaAtual: mensagem }
          : { geral: mensagem }),
      });
    }
  }

  return (
    <section className="rounded-2xl border border-gray-100 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F3EAF8] text-[#9F64AF]">
          <KeyRound size={19} />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Alterar senha</h3>
          <p className="mt-1 text-xs text-gray-500">
            Atualize sua senha confirmando a senha atual.
          </p>
        </div>
      </div>

      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <CampoSenha
            id="senha-atual"
            label="Senha atual"
            valor={senhaAtual}
            erro={erros.senhaAtual}
            onChange={setSenhaAtual}
          />

          <div>
            <CampoSenha
              id="nova-senha"
              label="Nova senha"
              valor={novaSenha}
              erro={erros.novaSenha}
              onChange={setNovaSenha}
            />
            <p className="mt-1 text-xs text-gray-400">
              A senha deve ter no mínimo 8 caracteres, conter letras maiúsculas,
              minúsculas, números e caracteres especiais.
            </p>
          </div>

          <CampoSenha
            id="confirmar-nova-senha"
            label="Confirmar nova senha"
            valor={confirmarNovaSenha}
            erro={erros.confirmarNovaSenha}
            onChange={setConfirmarNovaSenha}
          />
        </div>

        <ErroCampo mensagem={erros.geral} />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={alterarSenha.isPending}
            className="rounded-xl bg-[#9F64AF] px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#8B509B] disabled:opacity-60"
          >
            {alterarSenha.isPending ? "Salvando..." : "Alterar senha"}
          </button>
        </div>
      </form>
    </section>
  );
}
