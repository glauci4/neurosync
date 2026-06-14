// app/pacientes/novo/formulario/components/FormularioMenor.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import ContatoEmergencia from "./ContatoEmergencia";
import DadosPaciente, { type DadosPacienteRef } from "./DadosPaciente";
import DadosResponsavel from "./DadosResponsavel";

interface FormularioMenorProps {
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

export default function FormularioMenor({
  onSubmit,
  isPending,
  error: apiError,
  onClose,
}: FormularioMenorProps) {
  const pacienteRef = useRef<DadosPacienteRef>(null);
  const [formData, setFormData] = useState({
    tipo: "menor",
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
  const [responsavel, setResponsavel] = useState({
    nome: "",
    cpf: "",
    telefone: "",
    grau_parentesco: "",
    mesmo_endereco_paciente: true,
    sem_numero: false,
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
  });
  const [contatoEmergencia, setContatoEmergencia] = useState({
    nome: "",
    telefone: "",
    parentesco: "",
  });
  const [errosResponsavel, setErrosResponsavel] = useState({
    nome: "",
    cpf: "",
    telefone: "",
    grau: "",
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
  });
  const [erroIdade, setErroIdade] = useState("");
  const [erroContato, setErroContato] = useState("");
  const [tentouSalvar, setTentouSalvar] = useState(false);

  // Erros provenientes da API, agora gerenciados por estado para permitir limpeza
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

  const copiarEnderecoParaResponsavel = () => {
    setResponsavel((prev) => ({
      ...prev,
      cep: formData.cep || "",
      rua: formData.rua || "",
      numero: formData.numero || "",
      complemento: formData.complemento || "",
      bairro: formData.bairro || "",
      cidade: formData.cidade || "",
      estado: formData.estado || "",
      sem_numero: formData.sem_numero || false,
    }));
  };
  useEffect(() => {
    if (responsavel.mesmo_endereco_paciente) copiarEnderecoParaResponsavel();
  }, [
    formData.cep,
    formData.rua,
    formData.numero,
    formData.complemento,
    formData.bairro,
    formData.cidade,
    formData.estado,
    formData.sem_numero,
    responsavel.mesmo_endereco_paciente,
  ]);

  const handleMesmoEnderecoChange = (checked: boolean) => {
    if (checked) {
      setResponsavel((prev) => ({ ...prev, mesmo_endereco_paciente: true }));
      copiarEnderecoParaResponsavel();
    } else {
      setResponsavel((prev) => ({
        ...prev,
        mesmo_endereco_paciente: false,
        sem_numero: false,
        cep: "",
        rua: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        estado: "",
      }));
    }
  };

  const validarResponsavel = (): boolean => {
    let valido = true;
    const novosErros = {
      nome: "",
      cpf: "",
      telefone: "",
      grau: "",
      rua: "",
      numero: "",
      bairro: "",
      cidade: "",
      estado: "",
      cep: "",
    };
    if (!responsavel.nome || responsavel.nome.trim().length < 3) {
      novosErros.nome = "Nome do responsável é obrigatório";
      valido = false;
    }
    const cpfNumeros = responsavel.cpf.replace(/\D/g, "");
    if (!cpfNumeros) {
      novosErros.cpf = "CPF do responsável é obrigatório";
      valido = false;
    } else if (cpfNumeros.length !== 11) {
      novosErros.cpf = "CPF deve ter 11 dígitos";
      valido = false;
    }
    const telResp = responsavel.telefone.replace(/\D/g, "");
    if (!telResp || telResp.length < 10) {
      novosErros.telefone = "Telefone do responsável é obrigatório";
      valido = false;
    }
    // Validação adicional: telefone do responsável não pode ser igual ao telefone principal do paciente, se este estiver preenchido
    const telPaciente = formData.telefone?.replace(/\D/g, "");
    const telResponsavel = responsavel.telefone?.replace(/\D/g, "");
    if (telPaciente && telResponsavel && telPaciente === telResponsavel) {
      novosErros.telefone =
        "Telefone do responsável não pode ser igual ao telefone principal do paciente";
      valido = false;
    }
    if (!responsavel.grau_parentesco) {
      novosErros.grau = "Grau de parentesco é obrigatório";
      valido = false;
    }
    if (!responsavel.mesmo_endereco_paciente) {
      const cepNumeros = responsavel.cep.replace(/\D/g, "");
      if (!cepNumeros || cepNumeros.length !== 8) {
        novosErros.cep = "CEP é obrigatório (8 dígitos)";
        valido = false;
      }
      if (!responsavel.rua) novosErros.rua = "Rua é obrigatória";
      if (!responsavel.sem_numero && !responsavel.numero)
        novosErros.numero = "Número é obrigatório";
      if (!responsavel.bairro) novosErros.bairro = "Bairro é obrigatório";
      if (!responsavel.cidade) novosErros.cidade = "Cidade é obrigatória";
      if (!responsavel.estado || responsavel.estado.length !== 2)
        novosErros.estado = "Estado (UF) é obrigatório";
      if (
        novosErros.rua ||
        novosErros.numero ||
        novosErros.bairro ||
        novosErros.cidade ||
        novosErros.estado
      )
        valido = false;
    }
    setErrosResponsavel(novosErros);
    return valido;
  };

  const validarIdade = (): boolean => {
    const idade = calcularIdade(formData.data_nascimento);
    if (idade >= 18) {
      setErroIdade("Paciente menor deve ter menos de 18 anos");
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
    const responsavelValido = validarResponsavel();
    const idadeValida = validarIdade();
    const contatoValido = validarContato();
    if (!pacienteValido || !responsavelValido || !idadeValida || !contatoValido)
      return;

    const contatoParaEnvio = contatoEmergencia.nome
      ? contatoEmergencia
      : undefined;

    const dadosEnvio = {
      ...formData,
      cep: formData.cep ? formData.cep.replace(/\D/g, "") : null,
      renda_familiar: formData.renda_familiar
        ? parseFloat(formData.renda_familiar)
        : null,
      responsavel: {
        nome: responsavel.nome,
        cpf: responsavel.cpf,
        telefone: responsavel.telefone,
        grau_parentesco: responsavel.grau_parentesco,
        mesmo_endereco_paciente: responsavel.mesmo_endereco_paciente,
        sem_numero: responsavel.sem_numero,
        ...(responsavel.mesmo_endereco_paciente
          ? {}
          : {
              cep: responsavel.cep ? responsavel.cep.replace(/\D/g, "") : null,
              rua: responsavel.rua,
              numero: responsavel.numero,
              complemento: responsavel.complemento,
              bairro: responsavel.bairro,
              cidade: responsavel.cidade,
              estado: responsavel.estado,
            }),
      },
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
        tipo="menor"
        telefoneObrigatorio={false}
        telefoneAlternativoObrigatorio={true}
        erroIdade={erroIdade}
        erroCpfApi={erroCpfApi}
        erroTelefoneApi={erroTelefoneApi}
        onCpfChange={limparErroCpf}
      />
      <DadosResponsavel
        responsavel={responsavel}
        setResponsavel={setResponsavel}
        setErros={setErrosResponsavel}
        erros={errosResponsavel}
        onMesmoEnderecoChange={handleMesmoEnderecoChange}
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
