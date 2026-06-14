"use client";

import { motion } from "framer-motion";
import { Mail, MapPin, PencilLine, Smartphone } from "lucide-react";
import { useState } from "react";
import { useClinica } from "../hooks/useClinica";
import EditarClinicaModal from "../modals/EditarClinicaModal";
import type { ClinicaData } from "../types";
import LogoClinica from "./LogoClinica";

interface ClinicaProps {
  podeEditar?: boolean;
}

function formatarCnpj(cnpj: string) {
  const numeros = cnpj.replace(/\D/g, "");
  if (numeros.length !== 14) return cnpj;
  return numeros.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
    "$1.$2.$3/$4-$5",
  );
}

function formatarTelefone(telefone?: string | null) {
  if (!telefone) return "—";

  const numeros = telefone.replace(/\D/g, "");
  if (numeros.length === 11) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
  }
  if (numeros.length === 10) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
  }
  return telefone;
}

function formatarTitulo(valor?: string | null) {
  const texto = valor?.trim();
  if (!texto) return "";
  if (texto !== texto.toUpperCase()) return texto;

  return texto
    .toLocaleLowerCase("pt-BR")
    .replace(/(^|[\s-])\S/g, (letra) => letra.toLocaleUpperCase("pt-BR"));
}

function formatarEnderecoResumido(clinica: ClinicaData) {
  const linha1 = [
    formatarTitulo(clinica.endereco),
    clinica.numero?.trim(),
  ].filter(Boolean);
  const localidade = [
    formatarTitulo(clinica.bairro),
    formatarTitulo(clinica.cidade),
  ].filter(Boolean);
  const linha2 = [
    localidade.join(", "),
    clinica.estado?.trim().toUpperCase(),
  ].filter(Boolean);

  return {
    linha1: linha1.length > 0 ? linha1.join(", ") : "—",
    linha2: linha2.join(" - "),
  };
}

function valorOuVazio(valor?: string | null) {
  return valor?.trim() ? valor : "—";
}

export default function Clinica({ podeEditar = false }: ClinicaProps) {
  const { data, isLoading, error, refetch } = useClinica();
  const [modalEditarAberto, setModalEditarAberto] = useState(false);

  const clinica = data?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#9F64AF] border-t-transparent" />
          <p className="mt-3 text-sm text-gray-500">
            Carregando dados da clínica...
          </p>
        </div>
      </div>
    );
  }

  if (error || !clinica) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-white/80 p-6 text-center shadow-sm">
        <p className="text-sm font-medium text-rose-600">
          {error
            ? "Erro ao carregar dados da clínica."
            : "Dados da clínica indisponíveis."}
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

  const endereco = formatarEnderecoResumido(clinica);

  return (
    <div className="mx-auto max-w-5xl space-y-8 pt-4">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mt-4 rounded-2xl border border-gray-100 bg-white/80 p-6 shadow-sm backdrop-blur-sm"
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <LogoClinica
              logoUrl={clinica.logo_url}
              nome={clinica.nome_fantasia || clinica.razao_social}
              podeEditar={podeEditar}
              onClickEditar={() => setModalEditarAberto(true)}
            />

            <div>
              <h3 className="text-xl font-semibold text-gray-800">
                {valorOuVazio(clinica.razao_social)}
              </h3>
              <p className="mt-1 text-sm font-medium text-[#9F64AF]">
                {valorOuVazio(clinica.nome_fantasia)}
              </p>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500">
                <span>CNPJ: {formatarCnpj(clinica.cnpj)}</span>
                <span className="flex items-center gap-1">
                  <Mail size={14} /> {valorOuVazio(clinica.email)}
                </span>
                <span className="flex items-center gap-1">
                  <Smartphone size={14} /> {formatarTelefone(clinica.telefone)}
                </span>
                <span className="flex basis-full items-start gap-1.5 text-xs leading-5 text-gray-500">
                  <MapPin
                    size={14}
                    className="mt-0.5 shrink-0 text-[#9F64AF]"
                    aria-hidden="true"
                  />
                  <span className="min-w-0">
                    <span className="block max-w-xl truncate">
                      {endereco.linha1}
                    </span>
                    {endereco.linha2 ? (
                      <span className="block max-w-xl truncate text-gray-400">
                        {endereco.linha2}
                      </span>
                    ) : null}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {podeEditar ? (
            <div className="flex flex-wrap gap-2 md:items-start">
              <button
                type="button"
                onClick={() => setModalEditarAberto(true)}
                className="inline-flex min-w-40 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#9F64AF] px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#8B509B]"
              >
                <PencilLine size={16} />
                Editar informações
              </button>
            </div>
          ) : null}
        </div>
      </motion.section>

      {podeEditar ? (
        <EditarClinicaModal
          aberto={modalEditarAberto}
          clinica={clinica}
          onClose={() => setModalEditarAberto(false)}
        />
      ) : null}
    </div>
  );
}
