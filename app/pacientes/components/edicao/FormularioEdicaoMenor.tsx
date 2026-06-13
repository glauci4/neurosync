// app/pacientes/components/edicao/FormularioEdicaoMenor.tsx
// Formulário de edição para paciente menor de idade.
// Validações herdadas de DadosPaciente (inclui e-mail, telefones, CPF, endereço, etc.).
// Responsável legal e contato de emergência são validados separadamente.

"use client";

import { useEffect, useRef, useState } from "react";
import { MdErrorOutline } from "react-icons/md";
import ContatoEmergencia from "@/app/pacientes/novo/formulario/components/ContatoEmergencia";
import DadosPaciente, {
  type DadosPacienteRef,
} from "@/app/pacientes/novo/formulario/components/DadosPaciente";
import DadosResponsavel from "@/app/pacientes/novo/formulario/components/DadosResponsavel";

interface PacienteEdicaoBase {
  id: number;
  nome: string;
  data_nascimento: string;
  genero: string;
  raca_etnia: string;
  cpf: string | null;
  telefone: string;
  telefone_alternativo: string | null;
  email: string | null;
  tipo: "adulto" | "menor";
  possui_deficiencia: number | boolean;
  descricao_deficiencia: string | null;
  renda_familiar: number | null;
  possui_cadastro_unico: number | boolean;
  cep: string | null;
  logradouro: string | null;
  rua?: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  observacoes: string | null;
  ativo: boolean;
  sem_numero?: boolean;
  responsavel?: {
    nome: string;
    cpf: string;
    telefone: string;
    grau_parentesco: string;
    mesmo_endereco_paciente: boolean;
    sem_numero?: boolean;
    cep: string;
    rua: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
  };
  contato_emergencia?: { nome: string; telefone: string; parentesco?: string };
}

interface Props {
  paciente: PacienteEdicaoBase;
  onSubmit: (dados: any) => void;
  isPending: boolean;
}

function calcularIdade(dataNascimento: string): number {
  const hoje = new Date();
  const nascimento = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mes = hoje.getMonth() - nascimento.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }
  return idade;
}

export default function FormularioEdicaoMenor({
  paciente,
  onSubmit,
  isPending,
}: Props) {
  const pacienteRef = useRef<DadosPacienteRef>(null);

  const dataFormatada = paciente.data_nascimento
    ? paciente.data_nascimento.split("T")[0]
    : "";

  const [formData, setFormData] = useState({
    tipo: "menor",
    nome: paciente.nome,
    data_nascimento: dataFormatada,
    genero: paciente.genero,
    raca_etnia: paciente.raca_etnia,
    cpf: paciente.cpf || "",
    telefone: paciente.telefone,
    telefone_alternativo: paciente.telefone_alternativo || "",
    email: paciente.email || "",
    possui_deficiencia: !!paciente.possui_deficiencia,
    descricao_deficiencia: paciente.descricao_deficiencia || "",
    renda_familiar: paciente.renda_familiar?.toString() || "",
    possui_cadastro_unico: !!paciente.possui_cadastro_unico,
    cep: paciente.cep || "",
    rua: paciente.logradouro || paciente.rua || "",
    numero: paciente.numero || "",
    complemento: paciente.complemento || "",
    bairro: paciente.bairro || "",
    cidade: paciente.cidade || "",
    estado: paciente.estado || "",
    observacoes: paciente.observacoes || "",
    sem_numero: paciente.sem_numero || false,
  });

  const [responsavel, setResponsavel] = useState({
    nome: paciente.responsavel?.nome || "",
    cpf: paciente.responsavel?.cpf || "",
    telefone: paciente.responsavel?.telefone || "",
    grau_parentesco: paciente.responsavel?.grau_parentesco || "",
    mesmo_endereco_paciente:
      paciente.responsavel?.mesmo_endereco_paciente ?? true,
    sem_numero: paciente.responsavel?.sem_numero || false,
    cep: paciente.responsavel?.cep || "",
    rua: paciente.responsavel?.rua || "",
    numero: paciente.responsavel?.numero || "",
    complemento: paciente.responsavel?.complemento || "",
    bairro: paciente.responsavel?.bairro || "",
    cidade: paciente.responsavel?.cidade || "",
    estado: paciente.responsavel?.estado || "",
  });

  const [contatoEmergencia, setContatoEmergencia] = useState({
    nome: paciente.contato_emergencia?.nome || "",
    telefone: paciente.contato_emergencia?.telefone || "",
    parentesco: paciente.contato_emergencia?.parentesco || "",
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

  useEffect(() => {
    if (responsavel.mesmo_endereco_paciente) {
      setResponsavel((prev) => ({
        ...prev,
        cep: formData.cep,
        rua: formData.rua,
        numero: formData.numero,
        complemento: formData.complemento,
        bairro: formData.bairro,
        cidade: formData.cidade,
        estado: formData.estado,
        sem_numero: formData.sem_numero,
      }));
    }
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
      setResponsavel((prev) => ({
        ...prev,
        mesmo_endereco_paciente: true,
        cep: formData.cep,
        rua: formData.rua,
        numero: formData.numero,
        complemento: formData.complemento,
        bairro: formData.bairro,
        cidade: formData.cidade,
        estado: formData.estado,
        sem_numero: formData.sem_numero,
      }));
    } else {
      setResponsavel((prev) => ({
        ...prev,
        mesmo_endereco_paciente: false,
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

  const validarCpfDuplicado = (): boolean => {
    const cpfPaciente = formData.cpf?.replace(/\D/g, "");
    const cpfResponsavel = responsavel.cpf?.replace(/\D/g, "");
    if (cpfPaciente && cpfResponsavel && cpfPaciente === cpfResponsavel) {
      setErrosResponsavel((prev) => ({
        ...prev,
        cpf: "CPF do responsável não pode ser igual ao CPF do paciente",
      }));
      return false;
    }
    return true;
  };

  const validarContato = (): boolean => {
    if (contatoEmergencia.nome) {
      const telefoneNumeros = contatoEmergencia.telefone?.replace(/\D/g, "");
      if (!telefoneNumeros || telefoneNumeros.length < 10) {
        setErroContato(
          "Telefone do contato de emergência é obrigatório quando o nome é informado",
        );
        return false;
      }
    }
    setErroContato("");
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pacienteValido = pacienteRef.current?.validar() ?? false;
    const responsavelValido = validarResponsavel();
    const idadeValida = validarIdade();
    const cpfOk = validarCpfDuplicado();
    const contatoValido = validarContato();

    if (
      !pacienteValido ||
      !responsavelValido ||
      !idadeValida ||
      !cpfOk ||
      !contatoValido
    )
      return;

    let contatoParaEnvio;
    if (contatoEmergencia.nome) contatoParaEnvio = contatoEmergencia;

    const dadosEnvio = {
      ...formData,
      data_nascimento: formData.data_nascimento,
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
      />

      <DadosResponsavel
        responsavel={responsavel}
        setResponsavel={setResponsavel}
        setErros={setErrosResponsavel}
        erros={errosResponsavel}
        onMesmoEnderecoChange={handleMesmoEnderecoChange}
      />

      {/* Contato de emergência usando a prop erroTelefoneExterno (padrão do componente) */}
      <ContatoEmergencia
        contato={contatoEmergencia}
        setContato={setContatoEmergencia}
        erroTelefoneExterno={erroContato}
      />

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2 bg-[#9F64AF] text-white rounded-lg hover:bg-[#8B509B] transition disabled:opacity-50"
        >
          {isPending ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}

