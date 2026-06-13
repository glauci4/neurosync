// app/pacientes/novo/formulario/components/FormularioAdulto.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import ContatoEmergencia from "./ContatoEmergencia";
import DadosPaciente, { type DadosPacienteRef } from "./DadosPaciente";

interface FormularioAdultoProps {
  onSubmit: (dados: any) => void;
  isPending: boolean;
  error: Error | null;
  onClose: () => void;
}

function calcularIdade(dataNascimento: string): number {
  const hoje = new Date();
  const nascimento = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mes = hoje.getMonth() - nascimento.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) idade--;
  return idade;
}

export default function FormularioAdulto({
  onSubmit,
  isPending,
  error: apiError,
  onClose,
}: FormularioAdultoProps) {
  const pacienteRef = useRef<DadosPacienteRef>(null);
  const [formData, setFormData] = useState({
    tipo: "adulto",
    nome: "",
    data_nascimento: "",
    genero: "",
    raca_etnia: "",
    cpf: "",
    telefone: "",
    telefone_alternativo: "",
    email: "",
    possui_deficiencia: false,
    descricao_deficiencia: "",
    renda_familiar: "",
    possui_cadastro_unico: false,
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    observacoes: "",
    sem_numero: false,
  });
  const [contatoEmergencia, setContatoEmergencia] = useState({
    nome: "",
    telefone: "",
    parentesco: "",
  });
  const [erroIdade, setErroIdade] = useState("");
  const [erroContato, setErroContato] = useState("");
  const [tentouSalvar, setTentouSalvar] = useState(false);

  // Erros provenientes da API, são gerenciados por estado
  const msgErroApi = apiError?.message || "";
  const [erroCpfApi, setErroCpfApi] = useState("");
  const [erroTelefoneApi, setErroTelefoneApi] = useState("");

  // Atualiza os erros da API sempre que a mensagem mudar
  useEffect(() => {
    if (msgErroApi.includes("CPF")) {
      setErroCpfApi(msgErroApi);
    } else {
      setErroCpfApi("");
    }
    if (msgErroApi.includes("Telefone") && !msgErroApi.includes("CPF")) {
      setErroTelefoneApi(msgErroApi);
    } else {
      setErroTelefoneApi("");
    }
  }, [msgErroApi]);

  // Limpa o erro de CPF quando o usuário altera o campo
  const limparErroCpf = () => {
    setErroCpfApi("");
  };

  // Limpa o erro de telefone quando o usuário altera o campo (adicional, pode ser usado futuramente)
  const _limparErroTelefone = () => {
    setErroTelefoneApi("");
  };

  const validarIdade = (): boolean => {
    const idade = calcularIdade(formData.data_nascimento);
    if (idade < 18) {
      setErroIdade("Paciente adulto deve ter 18 anos ou mais");
      return false;
    }
    setErroIdade("");
    return true;
  };

  const validarContato = (): boolean => {
    const nome = contatoEmergencia.nome.trim();
    const telefoneNumeros = contatoEmergencia.telefone.replace(/\D/g, "");
    const parentesco = contatoEmergencia.parentesco.trim();
    const contatoUsado = Boolean(nome || telefoneNumeros || parentesco);

    if (!contatoUsado) {
      setErroContato("");
      return true;
    }

    if (!telefoneNumeros || telefoneNumeros.length < 10) {
      setErroContato(
        "Telefone do contato de emergência é obrigatório quando o nome é informado",
      );
      return false;
    }

    const telefonePaciente = formData.telefone.replace(/\D/g, "");
    if (telefonePaciente && telefoneNumeros === telefonePaciente) {
      setErroContato(
        "Telefone do contato de emergência não pode ser igual ao telefone do paciente",
      );
      return false;
    }

    setErroContato("");
    return Boolean(nome && telefoneNumeros.length >= 10 && parentesco);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTentouSalvar(true);
    const pacienteValido = pacienteRef.current?.validar() ?? false;
    const idadeValida = validarIdade();
    const contatoValido = validarContato();
    if (!pacienteValido || !idadeValida || !contatoValido) return;
    const contatoParaEnvio = contatoEmergencia.nome
      ? contatoEmergencia
      : undefined;
    const dadosEnvio = {
      ...formData,
      cep: formData.cep ? formData.cep.replace(/\D/g, "") : null,
      renda_familiar: formData.renda_familiar
        ? parseFloat(formData.renda_familiar)
        : null,
      contato_emergencia: contatoParaEnvio,
    };
    onSubmit(dadosEnvio);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 space-y-6"
    >
      <DadosPaciente
        ref={pacienteRef}
        formData={formData}
        setFormData={setFormData}
        tipo="adulto"
        telefoneObrigatorio={true}
        telefoneAlternativoObrigatorio={false}
        erroIdade={erroIdade}
        erroCpfApi={erroCpfApi}
        erroTelefoneApi={erroTelefoneApi}
        onCpfChange={limparErroCpf}
      />
      {/* A prop erroTelefoneExterno leva a mensagem de erro para o componente ContatoEmergencia */}
      <ContatoEmergencia
        contato={contatoEmergencia}
        setContato={setContatoEmergencia}
        erroTelefoneExterno={erroContato}
        tentouSalvar={tentouSalvar}
      />
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2 bg-[#9F64AF] text-white rounded-lg hover:bg-[#8B509B] transition disabled:opacity-50"
        >
          {isPending ? "Cadastrando..." : "Cadastrar Paciente"}
        </button>
      </div>
    </form>
  );
}

