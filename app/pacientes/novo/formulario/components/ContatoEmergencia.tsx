// app/pacientes/novo/formulario/components/ContatoEmergencia.tsx
// Componente de contato de emergência – exibe campos Nome, Telefone e Parentesco.
// Agora com formatação automática de telefone, validação de formato (10 ou 11 dígitos),
// e obrigatoriedade do campo parentesco quando o nome é preenchido.
// O erro de telefone externo (ex: igual ao telefone do paciente) é exibido abaixo do campo.
// A lista de parentesco foi ajustada para não incluir "Responsável Legal", pois esse papel
// é desempenhado pelo responsável legal do paciente menor.

"use client";

import { useCallback, useEffect, useState } from "react";
import { MdErrorOutline } from "react-icons/md";
import DropdownSelect from "./DropdownSelect";

// Opções de parentesco disponíveis – "Responsável Legal" removido
const OPCOES_PARENTESCO = ["Pai/Mãe", "Tio(a)", "Avô(ó)", "Irmão(ã)", "Outros"];

interface ContatoEmergenciaProps {
  contato: { nome: string; telefone: string; parentesco: string };
  setContato: (data: any) => void;
  erroTelefoneExterno?: string; // erro vindo do formulário pai (ex: obrigatório ou igual ao do paciente)
  tentouSalvar?: boolean;
}

export default function ContatoEmergencia({
  contato,
  setContato,
  erroTelefoneExterno,
  tentouSalvar = false,
}: ContatoEmergenciaProps) {
  // Estado para erro local de formato do telefone
  const [erroLocal, setErroLocal] = useState("");
  const [erroNome, setErroNome] = useState("");
  // Estado para erro de obrigatoriedade do parentesco
  const [erroParentesco, setErroParentesco] = useState("");
  const [campoTocado, setCampoTocado] = useState(false);

  // Aplica máscara de telefone enquanto o usuário digita
  const formatarTelefone = (valor: string) => {
    const numeros = valor.replace(/\D/g, "");
    if (numeros.length <= 2) return numeros;
    if (numeros.length <= 6)
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    if (numeros.length <= 10)
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
  };

  // Atualiza o telefone com formatação e limpa erro local se existir
  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    const formatado = formatarTelefone(valor);
    setContato((prev: any) => ({ ...prev, telefone: formatado }));
    if (erroLocal) setErroLocal("");
  };

  const haAlgumDadoPreenchido = () =>
    Boolean(
      contato.nome?.trim() || contato.telefone?.trim() || contato.parentesco,
    );

  const validarNome = () => {
    setCampoTocado(true);
    if (!contato.nome?.trim() && haAlgumDadoPreenchido()) {
      setErroNome("Nome do contato de emergência é obrigatório");
      return false;
    }
    setErroNome("");
    return true;
  };

  // Valida o formato do telefone ao perder o foco (10 ou 11 dígitos)
  const handleTelefoneBlur = () => {
    setCampoTocado(true);
    const numeros = contato.telefone.replace(/\D/g, "");
    if (!contato.telefone?.trim() && haAlgumDadoPreenchido()) {
      setErroLocal("Telefone do contato de emergência é obrigatório");
    } else if (numeros && (numeros.length < 10 || numeros.length > 11)) {
      setErroLocal("Telefone deve ter 10 ou 11 dígitos");
    } else {
      setErroLocal("");
    }
  };

  // Atualiza o parentesco e limpa o erro se um valor for selecionado
  const handleParentescoChange = (valor: string) => {
    setContato((prev: any) => ({ ...prev, parentesco: valor }));
    if (valor) {
      setErroParentesco("");
    } else if (contato.nome?.trim() || tentouSalvar || campoTocado) {
      setErroParentesco("Parentesco é obrigatório");
    }
  };

  // Quando o campo nome perde o foco, verifica se o parentesco precisa ser preenchido
  const handleNomeBlur = () => {
    setCampoTocado(true);
    validarNome();
    if (contato.nome?.trim() && !contato.parentesco) {
      setErroParentesco("Parentesco é obrigatório");
    } else if (
      !contato.nome?.trim() &&
      !contato.telefone?.trim() &&
      !contato.parentesco
    ) {
      setErroParentesco("");
    }
  };

  // O erro exibido no campo telefone é o erro externo (prioritário) ou o local
  const erroFinal = erroTelefoneExterno || erroLocal;

  const mostrarErroNome = tentouSalvar || campoTocado;
  const mostrarErroParentesco = tentouSalvar || campoTocado;

  const renderMensagemErro = (mensagem?: string) => (
    <div className="mt-1 min-h-5">
      {mensagem ? (
        <p className="flex items-center gap-1.5 text-xs font-medium leading-5 text-red-500">
          <MdErrorOutline size={16} className="shrink-0" />
          <span>{mensagem}</span>
        </p>
      ) : null}
    </div>
  );

  const validarAoSalvar = useCallback(() => {
    if (!haAlgumDadoPreenchido()) return true;

    const nome = contato.nome?.trim();
    const telefoneNumeros = contato.telefone.replace(/\D/g, "");
    const temTelefone = Boolean(contato.telefone?.trim());
    const telefoneOk =
      telefoneNumeros.length >= 10 && telefoneNumeros.length <= 11;

    const nomeOk = Boolean(nome);
    const parentescoOk = Boolean(contato.parentesco);

    if (!nomeOk) {
      setErroNome("Nome do contato de emergência é obrigatório");
    }
    if (!temTelefone) {
      setErroLocal("Telefone do contato de emergência é obrigatório");
    } else if (!telefoneOk) {
      setErroLocal("Telefone deve ter 10 ou 11 dígitos");
    }
    if (nomeOk && !parentescoOk) {
      setErroParentesco("Parentesco é obrigatório");
    }

    return nomeOk && temTelefone && telefoneOk && (!nomeOk || parentescoOk);
  }, [contato.nome, contato.parentesco, contato.telefone]);

  useEffect(() => {
    if (tentouSalvar) validarAoSalvar();
  }, [tentouSalvar, validarAoSalvar]);

  return (
    <div className="mt-6 p-4 border rounded-lg bg-[#F3E8F7]/60 border-[#9F64AF]/20">
      <h3 className="text-md font-semibold text-gray-800 mb-3">
        Contato de Emergência{" "}
        <span className="text-xs font-normal text-gray-500">(opcional)</span>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        {/* Campo Nome */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome
          </label>
          <input
            type="text"
            name="nome"
            value={contato.nome || ""}
            onChange={(e) =>
              setContato((prev: any) => ({ ...prev, nome: e.target.value }))
            }
            onBlur={handleNomeBlur}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800"
          />
          {mostrarErroNome
            ? renderMensagemErro(erroNome)
            : renderMensagemErro()}
        </div>

        {/* Campo Telefone com validação de formato */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telefone
          </label>
          <input
            type="tel"
            value={contato.telefone || ""}
            onChange={handleTelefoneChange}
            onBlur={handleTelefoneBlur}
            placeholder="(00) 00000-0000"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800 ${
              erroFinal ? "border-red-500" : "border-gray-300"
            }`}
          />
          {renderMensagemErro(erroFinal)}
        </div>

        {/* Campo Parentesco com lista de opções (sem "Responsável Legal") */}
        <div>
          <DropdownSelect
            label="Parentesco"
            value={contato.parentesco || ""}
            options={[
              { value: "", label: "Selecione" },
              ...OPCOES_PARENTESCO.map((op) => ({ value: op, label: op })),
            ]}
            placeholder="Selecione"
            error={mostrarErroParentesco ? erroParentesco : undefined}
            onChange={handleParentescoChange}
          />
        </div>
      </div>
    </div>
  );
}
