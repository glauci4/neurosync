"use client";

import { motion } from "framer-motion";
import { Eye, EyeOff, X } from "lucide-react";
import { useId, useState } from "react";
import { MdErrorOutline } from "react-icons/md";
import { useCriarUsuarioSistema } from "../hooks/useCriarUsuarioSistema";
import type {
  CriarUsuarioSistemaPayload,
  PerfilUsuarioSistema,
} from "../types/usuariosSistema.types";

interface ModalNovoUsuarioProps {
  aberto: boolean;
  onClose: () => void;
}

interface FormNovoUsuario {
  nome: string;
  email: string;
  perfil: PerfilUsuarioSistema;
  senhaInicial: string;
  crp: string;
  cpf: string;
}

type Erros = Partial<Record<keyof FormNovoUsuario, string>> & {
  geral?: string;
};

function normalizarNumeros(valor: string) {
  return valor.replace(/\D/g, "");
}

function ErroCampo({ mensagem }: { mensagem?: string }) {
  if (!mensagem) return null;
  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-rose-600">
      <MdErrorOutline size={14} />
      {mensagem}
    </p>
  );
}

export default function ModalNovoUsuario({
  aberto,
  onClose,
}: ModalNovoUsuarioProps) {
  const criarUsuario = useCriarUsuarioSistema();
  const perfilId = useId();
  const senhaId = useId();
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [form, setForm] = useState<FormNovoUsuario>({
    nome: "",
    email: "",
    perfil: "psicologo",
    senhaInicial: "",
    crp: "",
    cpf: "",
  });
  const [erros, setErros] = useState<Erros>({});

  if (!aberto) return null;

  function definirCampo<C extends keyof FormNovoUsuario>(
    campo: C,
    valor: FormNovoUsuario[C],
  ) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
    setErros((atual) => ({ ...atual, [campo]: undefined, geral: undefined }));
  }

  function validar() {
    const novosErros: Erros = {};

    if (form.nome.trim().length < 3) {
      novosErros.nome = "Informe o nome completo";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      novosErros.email = "Informe um e-mail válido.";
    }
    if (!form.senhaInicial) {
      novosErros.senhaInicial = "Informe a senha inicial";
    }
    if (form.perfil === "psicologo" && !/^\d{2}\/\d{5}$/.test(form.crp)) {
      novosErros.crp = "CRP inválido. Use XX/XXXXX";
    }
    if (
      form.perfil === "secretaria" &&
      normalizarNumeros(form.cpf).length !== 11
    ) {
      novosErros.cpf = "CPF inválido";
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validar()) return;

    const payload: CriarUsuarioSistemaPayload = {
      nome: form.nome.trim(),
      email: form.email.trim().toLowerCase(),
      perfil: form.perfil,
      senhaInicial: form.senhaInicial,
      crp: form.perfil === "psicologo" ? form.crp.trim() : null,
      cpf: form.perfil === "secretaria" ? normalizarNumeros(form.cpf) : null,
    };

    criarUsuario.mutate(payload, {
      onSuccess: onClose,
      onError: (error) =>
        setErros({
          geral:
            error instanceof Error
              ? error.message.replace(
                  "Este e-mail já está em uso",
                  "Este e-mail já está cadastrado.",
                )
              : "Não foi possível criar o usuário.",
        }),
    });
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onKeyDown={(evento) => {
        if (evento.key === "Escape") onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Novo usuário
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Cadastre um acesso vinculado à clínica.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 transition hover:text-[#9F64AF]"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <form noValidate onSubmit={handleSubmit} className="space-y-4">
          <Campo
            label="Nome completo"
            value={form.nome}
            erro={erros.nome}
            onChange={(valor) => definirCampo("nome", valor)}
          />
          <Campo
            label="E-mail"
            value={form.email}
            erro={erros.email}
            onChange={(valor) => definirCampo("email", valor)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor={perfilId}
                className="mb-1 block text-xs font-medium text-gray-800"
              >
                Perfil de acesso
              </label>
              <select
                id={perfilId}
                value={form.perfil}
                onChange={(evento) =>
                  definirCampo(
                    "perfil",
                    evento.target.value as PerfilUsuarioSistema,
                  )
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#9F64AF]"
              >
                <option value="psicologo">Psicólogo</option>
                <option value="secretaria">Secretária</option>
              </select>
            </div>
            {form.perfil === "psicologo" ? (
              <Campo
                label="CRP"
                value={form.crp}
                erro={erros.crp}
                onChange={(valor) => definirCampo("crp", valor)}
                placeholder="08/00000"
              />
            ) : (
              <Campo
                label="CPF"
                value={form.cpf}
                erro={erros.cpf}
                onChange={(valor) => definirCampo("cpf", valor)}
                placeholder="00000000000"
              />
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor={senhaId}
                className="mb-1 block text-xs font-medium text-gray-800"
              >
                Senha inicial
              </label>
              <div className="relative">
                <input
                  id={senhaId}
                  value={form.senhaInicial}
                  type={mostrarSenha ? "text" : "password"}
                  onChange={(evento) =>
                    definirCampo("senhaInicial", evento.target.value)
                  }
                  className={`w-full rounded-xl border bg-white px-3 py-2 pr-10 text-sm text-gray-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#9F64AF] ${
                    erros.senhaInicial ? "border-rose-300" : "border-gray-300"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((valor) => !valor)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-[#9F64AF]"
                  aria-label="Mostrar ou ocultar senha"
                >
                  {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <ErroCampo mensagem={erros.senhaInicial} />
            </div>
          </div>

          {erros.geral ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
              {erros.geral}
            </p>
          ) : null}

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={criarUsuario.isPending}
              className="rounded-lg bg-[#9F64AF] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#8B509B] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {criarUsuario.isPending ? "Salvando..." : "Cadastrar"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function Campo({
  label,
  value,
  onChange,
  erro,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  erro?: string;
  placeholder?: string;
}) {
  const id = useId();

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-xs font-medium text-gray-800"
      >
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(evento) => onChange(evento.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#9F64AF] ${
          erro ? "border-rose-300" : "border-gray-300"
        }`}
      />
      <ErroCampo mensagem={erro} />
    </div>
  );
}
