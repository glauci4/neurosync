// app/pacientes/novo/formulario/components/DadosPaciente.tsx
"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { MdErrorOutline } from "react-icons/md";
import { useBuscarCep } from "@/hooks/useConsultaCep";
import { useVerificarCpf } from "@/hooks/useVerificarCpf";
import DropdownSelect from "./DropdownSelect";

// ---------- INTERFACES ----------
export interface DadosPacienteRef {
  validar: () => boolean;
}

interface DadosPacienteProps {
  formData: any;
  setFormData: (data: any) => void;
  tipo: "adulto" | "menor";
  telefoneObrigatorio?: boolean;
  telefoneAlternativoObrigatorio?: boolean;
  erroIdade?: string;
  erroCpfApi?: string;
  erroTelefoneApi?: string;
  onCpfChange?: () => void;
  pacienteId?: number;
}

// ---------- CONSTANTES ----------
const UFS_BRASIL = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

const OPCOES_GENERO = [
  { value: "", label: "Selecione" },
  { value: "Feminino", label: "Feminino" },
  { value: "Masculino", label: "Masculino" },
  { value: "Não-binário", label: "Não-binário" },
  { value: "Prefiro não informar", label: "Prefere não informar" },
  { value: "Outro", label: "Outro" },
];

const OPCOES_RACA_ETNIA = [
  { value: "", label: "Selecione" },
  { value: "Branca", label: "Branca" },
  { value: "Preta", label: "Preta" },
  { value: "Parda", label: "Parda" },
  { value: "Amarela", label: "Amarela" },
  { value: "Indígena", label: "Indígena" },
  { value: "Prefiro não informar", label: "Prefere não informar" },
];

function normalizarTextoLivre(valor: string): string {
  return valor.replace(/\s+/g, " ").trim();
}

function removerAcentos(valor: string): string {
  return valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function validarTextoOutro(valor: string): string | null {
  const texto = normalizarTextoLivre(valor);
  if (!texto) return "Informe uma opção válida.";
  if (!/^[A-Za-zÀ-ÿ\s]+$/.test(texto)) {
    return "Use uma descrição clara, sem números ou caracteres inválidos.";
  }

  const semAcentos = removerAcentos(texto).toLowerCase();
  const apenasLetras = semAcentos.replace(/\s/g, "");
  const palavrasGenericas = new Set([
    "outro",
    "outra",
    "teste",
    "asdasd",
    "qwerty",
    "dfhhdh",
    "hjkhjkhjk",
    "abc",
    "abcd",
  ]);

  if (palavrasGenericas.has(semAcentos)) {
    return "Use uma descrição clara, sem números ou caracteres inválidos.";
  }
  if (apenasLetras.length < 3) {
    return "Informe uma opção válida.";
  }
  if (!/[aeiou]/i.test(semAcentos)) {
    return "Use uma descrição clara, sem números ou caracteres inválidos.";
  }
  if (semAcentos.length < 7 && !semAcentos.includes(" ")) {
    return "Use uma descrição clara, sem números ou caracteres inválidos.";
  }
  if (/^(.)\1+$/.test(apenasLetras)) {
    return "Use uma descrição clara, sem números ou caracteres inválidos.";
  }

  return null;
}

function obterGeneroSelecionado(valor?: string): string {
  if (!valor) return "";
  const valorNormalizado = normalizarTextoLivre(valor);
  const encontrada = OPCOES_GENERO.find(
    (opcao) => opcao.value === valorNormalizado,
  );
  if (encontrada) return encontrada.value;
  return "Outro";
}

// ---------- FUNÇÕES AUXILIARES ----------
function validarCPF(cpf: string): boolean {
  const cpfNumeros = cpf.replace(/\D/g, "");
  if (cpfNumeros.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpfNumeros)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpfNumeros.charAt(i)) * (10 - i);
  let resto = 11 - (soma % 11);
  const digito1 = resto >= 10 ? 0 : resto;
  if (digito1 !== parseInt(cpfNumeros.charAt(9))) return false;
  soma = 0;
  for (let i = 0; i < 10; i++)
    soma += parseInt(cpfNumeros.charAt(i)) * (11 - i);
  resto = 11 - (soma % 11);
  const digito2 = resto >= 10 ? 0 : resto;
  return digito2 === parseInt(cpfNumeros.charAt(10));
}

function formatarCPF(valor: string): string {
  const numeros = valor.replace(/\D/g, "");
  if (numeros.length <= 3) return numeros;
  if (numeros.length <= 6) return `${numeros.slice(0, 3)}.${numeros.slice(3)}`;
  if (numeros.length <= 9)
    return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6)}`;
  return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6, 9)}-${numeros.slice(9, 11)}`;
}

function formatarTelefone(valor: string): string {
  const numeros = valor.replace(/\D/g, "");
  if (numeros.length <= 2) return numeros;
  if (numeros.length <= 6)
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  if (numeros.length <= 10)
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
}

function formatarMoeda(valor: string): string {
  const numeros = valor.replace(/\D/g, "");
  if (!numeros) return "";
  const inteiro = parseInt(numeros, 10);
  const reais = Math.floor(inteiro / 100);
  const centavos = inteiro % 100;
  return `R$ ${reais.toLocaleString("pt-BR")},${centavos.toString().padStart(2, "0")}`;
}

function calcularIdade(dataNascimento: string): number {
  const hoje = new Date();
  const nascimento = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mes = hoje.getMonth() - nascimento.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) idade--;
  return idade;
}

// ---------- COMPONENTE ----------
const DadosPaciente = forwardRef<DadosPacienteRef, DadosPacienteProps>(
  (
    {
      formData,
      setFormData,
      tipo,
      telefoneObrigatorio = true,
      telefoneAlternativoObrigatorio = false,
      erroIdade,
      erroCpfApi,
      erroTelefoneApi,
      onCpfChange,
      pacienteId,
    },
    ref,
  ) => {
    // Estado de erros – as chaves podem ser string ou undefined (undefined = sem erro)
    const [errors, setErrors] = useState<Record<string, string | undefined>>(
      {},
    );
    const [camposTocados, setCamposTocados] = useState<
      Partial<Record<string, boolean>>
    >({});
    const [tentouSalvar, setTentouSalvar] = useState(false);
    const [generoSelecionado, setGeneroSelecionado] = useState(() =>
      obterGeneroSelecionado(formData.genero),
    );
    const [generoOutroTexto, setGeneroOutroTexto] = useState(() => {
      const selecionado = obterGeneroSelecionado(formData.genero);
      return selecionado === "Outro" &&
        normalizarTextoLivre(formData.genero || "") !== "Outro"
        ? formData.genero || ""
        : "";
    });
    const buscarCep = useBuscarCep();

    const marcarCampoTocado = (campo: string) => {
      setCamposTocados((atuais) => ({ ...atuais, [campo]: true }));
    };

    const deveExibirErro = (campo: string) =>
      Boolean(camposTocados[campo] || tentouSalvar);

    // Hook de verificação de CPF duplicado
    const { data: cpfJaExiste, isLoading: verificandoCpf } = useVerificarCpf(
      formData.cpf,
      pacienteId,
    );

    // Busca CEP
    const buscarEnderecoPorCep = async () => {
      const cep = formData.cep?.replace(/\D/g, "");
      if (!cep || cep.length !== 8) {
        setErrors((prev) => ({ ...prev, cep: "CEP inválido (8 dígitos)" }));
        return;
      }
      try {
        const data = await buscarCep.mutateAsync(cep);
        setFormData({
          ...formData,
          rua: data.logradouro || "",
          bairro: data.bairro || "",
          cidade: data.cidade || "",
          estado: data.estado || "",
          numero: "",
          complemento: "",
        });
        // Limpa erros relacionados
        setErrors((prev) => ({
          ...prev,
          cep: undefined,
          rua: undefined,
          bairro: undefined,
          cidade: undefined,
          estado: undefined,
        }));
      } catch (error) {
        setErrors((prev) => ({
          ...prev,
          cep: error instanceof Error ? error.message : "Erro ao buscar CEP",
        }));
      }
    };

    const handleChange = (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      const { name, value, type } = e.target;
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value,
      });
      // Remove erro do campo alterado
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
      if (name === "cpf" && onCpfChange) {
        onCpfChange();
      }
    };

    const handleGeneroChange = (valor: string) => {
      setGeneroSelecionado(valor);
      if (valor === "Outro") {
        setGeneroOutroTexto("");
        setFormData({ ...formData, genero: "Outro" });
        setErrors((prev) => ({
          ...prev,
          genero: undefined,
          genero_outro: undefined,
        }));
        return;
      }

      setGeneroOutroTexto("");
      setFormData({ ...formData, genero: valor });
      setErrors((prev) => ({
        ...prev,
        genero: undefined,
        genero_outro: undefined,
      }));
    };

    const handleGeneroOutroChange = (
      e: React.ChangeEvent<HTMLInputElement>,
    ) => {
      const valor = e.target.value;
      setGeneroOutroTexto(valor);
      setFormData({ ...formData, genero: valor });
      if (errors.genero || errors.genero_outro) {
        setErrors((prev) => ({
          ...prev,
          genero: undefined,
          genero_outro: undefined,
        }));
      }
    };

    const handleGeneroOutroBlur = () => {
      if (generoSelecionado !== "Outro") return;
      marcarCampoTocado("genero");
      marcarCampoTocado("genero_outro");
      const erroOutro = validarTextoOutro(generoOutroTexto);
      if (erroOutro) {
        setErrors((prev) => ({
          ...prev,
          genero: erroOutro,
          genero_outro: erroOutro,
        }));
        return;
      }

      const valorFinal = normalizarTextoLivre(generoOutroTexto);
      setGeneroOutroTexto(valorFinal);
      setFormData({ ...formData, genero: valorFinal });
      setErrors((prev) => ({
        ...prev,
        genero: undefined,
        genero_outro: undefined,
      }));
    };

    // Validações específicas
    const handleNomeBlur = () => {
      marcarCampoTocado("nome");
      if (!formData.nome?.trim()) {
        setErrors((prev) => ({ ...prev, nome: "Nome completo é obrigatório" }));
      } else {
        setErrors((prev) => ({ ...prev, nome: undefined }));
      }
    };

    const handleDataNascimentoBlur = () => {
      marcarCampoTocado("data_nascimento");
      const valor = formData.data_nascimento;
      if (!valor) {
        setErrors((prev) => ({
          ...prev,
          data_nascimento: "Data de nascimento é obrigatória",
        }));
        return;
      }
      const dataInformada = new Date(valor + "T00:00:00");
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      if (dataInformada >= hoje) {
        setErrors((prev) => ({
          ...prev,
          data_nascimento: "Data não pode ser hoje ou futura",
        }));
        return;
      }
      if (tipo === "adulto" && calcularIdade(valor) < 18) {
        setErrors((prev) => ({
          ...prev,
          data_nascimento: "Paciente adulto deve ter 18 anos completos",
        }));
        return;
      }
      setErrors((prev) => ({ ...prev, data_nascimento: undefined }));
    };

    const handleTelefoneBlur = (field: "telefone" | "telefone_alternativo") => {
      marcarCampoTocado(field);
      const obrigatorio =
        field === "telefone"
          ? telefoneObrigatorio
          : telefoneAlternativoObrigatorio;
      const numeros = formData[field]?.replace(/\D/g, "") || "";
      const estaVazio = numeros === "";

      if (obrigatorio && estaVazio) {
        setErrors((prev) => ({
          ...prev,
          [field]: `${field === "telefone" ? "Telefone" : "Telefone alternativo"} é obrigatório (10 ou 11 dígitos)`,
        }));
      } else if (!obrigatorio && estaVazio) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      } else if (!estaVazio && (numeros.length < 10 || numeros.length > 11)) {
        setErrors((prev) => ({
          ...prev,
          [field]: `${field === "telefone" ? "Telefone" : "Telefone alternativo"} deve ter 10 ou 11 dígitos`,
        }));
      } else {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }

      if (field === "telefone_alternativo" && numeros) {
        const telPrincipal = formData.telefone?.replace(/\D/g, "") || "";
        if (telPrincipal && numeros === telPrincipal) {
          setErrors((prev) => ({
            ...prev,
            telefone_alternativo:
              "Telefone alternativo não pode ser igual ao telefone principal",
          }));
        }
      }

      // Formata se dígitos suficientes
      const num = formData[field] || "";
      const nums = num.replace(/\D/g, "");
      if (nums.length >= 10) {
        setFormData({ ...formData, [field]: formatarTelefone(nums) });
      }
    };

    const handleCpfBlur = () => {
      marcarCampoTocado("cpf");
      const raw = formData.cpf || "";
      const numeros = raw.replace(/\D/g, "");
      if (tipo === "adulto") {
        if (!numeros) {
          setErrors((prev) => ({
            ...prev,
            cpf: "CPF é obrigatório para paciente adulto",
          }));
        } else if (!validarCPF(numeros)) {
          setErrors((prev) => ({ ...prev, cpf: "CPF inválido" }));
        } else {
          setErrors((prev) => ({ ...prev, cpf: undefined }));
          setFormData({ ...formData, cpf: formatarCPF(numeros) });
        }
      } else {
        if (raw.trim() === "") {
          setErrors((prev) => ({ ...prev, cpf: undefined }));
        } else if (numeros.length !== 11 || !validarCPF(numeros)) {
          setErrors((prev) => ({ ...prev, cpf: "CPF inválido" }));
        } else {
          setErrors((prev) => ({ ...prev, cpf: undefined }));
          setFormData({ ...formData, cpf: formatarCPF(numeros) });
        }
      }
    };

    const validarGenero = (): boolean => {
      marcarCampoTocado("genero");
      if (!generoSelecionado) {
        setErrors((prev) => ({ ...prev, genero: "Gênero é obrigatório" }));
        return false;
      }

      if (generoSelecionado !== "Outro") {
        setErrors((prev) => ({ ...prev, genero: undefined }));
        setErrors((prev) => ({ ...prev, genero_outro: undefined }));
        return true;
      }

      const erroOutro = validarTextoOutro(generoOutroTexto);
      if (erroOutro) {
        setErrors((prev) => ({ ...prev, genero: erroOutro }));
        setErrors((prev) => ({
          ...prev,
          genero_outro: erroOutro,
        }));
        return false;
      }

      const valorFinal = normalizarTextoLivre(generoOutroTexto);
      setFormData({ ...formData, genero: valorFinal });
      setErrors((prev) => ({
        ...prev,
        genero: undefined,
        genero_outro: undefined,
      }));
      return true;
    };

    const validarRacaEtnia = (): boolean => {
      marcarCampoTocado("raca_etnia");
      if (!formData.raca_etnia) {
        setErrors((prev) => ({
          ...prev,
          raca_etnia: "Raça/Etnia é obrigatória",
        }));
        return false;
      }
      setErrors((prev) => ({ ...prev, raca_etnia: undefined }));
      return true;
    };

    const handleEmailBlur = () => {
      marcarCampoTocado("email");
      const email = formData.email?.trim() || "";
      if (email === "") {
        setErrors((prev) => ({ ...prev, email: undefined }));
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setErrors((prev) => ({ ...prev, email: "E-mail inválido" }));
      } else {
        setErrors((prev) => ({ ...prev, email: undefined }));
      }
    };

    const handleCepBlur = () => {
      marcarCampoTocado("cep");
      const cep = formData.cep?.replace(/\D/g, "");
      if (!cep || cep.length !== 8) {
        setErrors((prev) => ({
          ...prev,
          cep: "CEP é obrigatório (8 dígitos)",
        }));
      } else {
        setErrors((prev) => ({ ...prev, cep: undefined }));
      }
    };

    const handleEnderecoBlur = (campo: string) => {
      marcarCampoTocado(campo);
      const valor = formData[campo] || "";
      if (campo === "rua" && !valor.trim()) {
        setErrors((prev) => ({ ...prev, rua: "Rua/Avenida é obrigatória" }));
      } else if (campo === "rua") {
        setErrors((prev) => ({ ...prev, rua: undefined }));
      }
      if (campo === "numero" && !formData.sem_numero && !valor.trim()) {
        setErrors((prev) => ({ ...prev, numero: "Número é obrigatório" }));
      } else if (campo === "numero") {
        setErrors((prev) => ({ ...prev, numero: undefined }));
      }
      if (campo === "bairro" && !valor.trim()) {
        setErrors((prev) => ({ ...prev, bairro: "Bairro é obrigatório" }));
      } else if (campo === "bairro") {
        setErrors((prev) => ({ ...prev, bairro: undefined }));
      }
      if (campo === "cidade" && !valor.trim()) {
        setErrors((prev) => ({ ...prev, cidade: "Cidade é obrigatória" }));
      } else if (campo === "cidade") {
        setErrors((prev) => ({ ...prev, cidade: undefined }));
      }
      if (campo === "estado") {
        const uf = valor.trim().toUpperCase();
        if (uf.length !== 2 || !UFS_BRASIL.includes(uf)) {
          setErrors((prev) => ({
            ...prev,
            estado: "Estado inválido (use a sigla UF)",
          }));
        } else {
          setFormData({ ...formData, estado: uf });
          setErrors((prev) => ({ ...prev, estado: undefined }));
        }
      }
    };

    // Deficiência
    const handleDeficienciaChange = (
      e: React.ChangeEvent<HTMLInputElement>,
    ) => {
      const checked = e.target.checked;
      setFormData({ ...formData, possui_deficiencia: checked });
      if (!checked) {
        setErrors((prev) => ({ ...prev, descricao_deficiencia: undefined }));
      }
    };

    const handleDescricaoDeficienciaBlur = () => {
      marcarCampoTocado("descricao_deficiencia");
      if (
        formData.possui_deficiencia &&
        !formData.descricao_deficiencia?.trim()
      ) {
        setErrors((prev) => ({
          ...prev,
          descricao_deficiencia: "Descreva a deficiência",
        }));
      } else {
        setErrors((prev) => ({ ...prev, descricao_deficiencia: undefined }));
      }
    };

    // Renda familiar
    const handleRendaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const valor = e.target.value;
      const numeros = valor.replace(/\D/g, "");
      const formatado = formatarMoeda(numeros);
      setFormData({ ...formData, renda_familiar: formatado });
    };

    // Validação global
    const validar = (): boolean => {
      setTentouSalvar(true);
      setCamposTocados({
        nome: true,
        data_nascimento: true,
        genero: true,
        genero_outro: true,
        raca_etnia: true,
        cpf: true,
        telefone: true,
        telefone_alternativo: true,
        email: true,
        cep: true,
        rua: true,
        numero: true,
        bairro: true,
        cidade: true,
        estado: true,
        descricao_deficiencia: true,
      });

      const novosErros: Record<string, string | undefined> = {};

      if (!formData.nome?.trim()) {
        novosErros.nome = "Nome completo é obrigatório";
      }

      const dataNascimento = formData.data_nascimento;
      if (!dataNascimento) {
        novosErros.data_nascimento = "Data de nascimento é obrigatória";
      } else {
        const dataInformada = new Date(dataNascimento + "T00:00:00");
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        if (dataInformada >= hoje) {
          novosErros.data_nascimento = "Data não pode ser hoje ou futura";
        } else if (tipo === "adulto" && calcularIdade(dataNascimento) < 18) {
          novosErros.data_nascimento =
            "Paciente adulto deve ter 18 anos completos";
        } else if (tipo === "menor" && calcularIdade(dataNascimento) >= 18) {
          novosErros.data_nascimento =
            "Paciente menor deve ter menos de 18 anos";
        }
      }

      if (!generoSelecionado) {
        novosErros.genero = "Gênero é obrigatório";
      } else if (generoSelecionado === "Outro") {
        const erroOutro = validarTextoOutro(generoOutroTexto);
        if (erroOutro) {
          novosErros.genero = erroOutro;
          novosErros.genero_outro = erroOutro;
        }
      }

      if (!formData.raca_etnia) {
        novosErros.raca_etnia = "Raça/Etnia é obrigatória";
      }

      const cpfNumeros = (formData.cpf || "").replace(/\D/g, "");
      if (tipo === "adulto") {
        if (!cpfNumeros) {
          novosErros.cpf = "CPF é obrigatório para paciente adulto";
        } else if (!validarCPF(cpfNumeros)) {
          novosErros.cpf = "CPF inválido";
        }
      } else if (formData.cpf) {
        if (cpfNumeros.length !== 11 || !validarCPF(cpfNumeros)) {
          novosErros.cpf = "CPF inválido";
        }
      }

      const telefone = (formData.telefone || "").replace(/\D/g, "");
      if (telefoneObrigatorio && !telefone) {
        novosErros.telefone = "Telefone é obrigatório (10 ou 11 dígitos)";
      } else if (telefone && (telefone.length < 10 || telefone.length > 11)) {
        novosErros.telefone = "Telefone deve ter 10 ou 11 dígitos";
      }

      const telefoneAlt = (formData.telefone_alternativo || "").replace(
        /\D/g,
        "",
      );
      if (telefoneAlternativoObrigatorio && !telefoneAlt) {
        novosErros.telefone_alternativo =
          "Telefone alternativo é obrigatório (10 ou 11 dígitos)";
      } else if (
        telefoneAlt &&
        (telefoneAlt.length < 10 || telefoneAlt.length > 11)
      ) {
        novosErros.telefone_alternativo =
          "Telefone alternativo deve ter 10 ou 11 dígitos";
      }

      if (telefone && telefoneAlt && telefone === telefoneAlt) {
        novosErros.telefone_alternativo =
          "Telefone alternativo não pode ser igual ao telefone principal";
      }

      const email = formData.email?.trim() || "";
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        novosErros.email = "E-mail inválido";
      }

      const cep = formData.cep?.replace(/\D/g, "");
      if (!cep || cep.length !== 8) {
        novosErros.cep = "CEP é obrigatório (8 dígitos)";
      }

      if (!formData.rua?.trim()) {
        novosErros.rua = "Rua/Avenida é obrigatória";
      }
      if (!formData.sem_numero && !formData.numero?.trim()) {
        novosErros.numero = "Número é obrigatório";
      }
      if (!formData.bairro?.trim()) {
        novosErros.bairro = "Bairro é obrigatório";
      }
      if (!formData.cidade?.trim()) {
        novosErros.cidade = "Cidade é obrigatória";
      }
      const uf = normalizarTextoLivre(formData.estado || "").toUpperCase();
      if (uf.length !== 2 || !UFS_BRASIL.includes(uf)) {
        novosErros.estado = "Estado inválido (use a sigla UF)";
      }

      if (
        formData.possui_deficiencia &&
        !formData.descricao_deficiencia?.trim()
      ) {
        novosErros.descricao_deficiencia = "Descreva a deficiência";
      }

      if (cpfJaExiste && !erroCpfApi) {
        novosErros.cpf = "Já existe um paciente cadastrado com este CPF.";
      }

      setErrors(novosErros);
      return !Object.values(novosErros).some(
        (msg) => typeof msg === "string" && msg.length > 0,
      );
    };

    const erroGeneroSelect =
      deveExibirErro("genero") &&
      generoSelecionado === "Outro" &&
      errors.genero !== "Gênero é obrigatório"
        ? undefined
        : errors.genero;

    const erroRacaEtnia = deveExibirErro("raca_etnia")
      ? errors.raca_etnia
      : undefined;

    useImperativeHandle(ref, () => ({ validar }));

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
          Dados do Paciente
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nome"
              value={formData.nome || ""}
              onChange={handleChange}
              onBlur={handleNomeBlur}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800"
            />
            {deveExibirErro("nome") && errors.nome && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <MdErrorOutline size={14} />
                {errors.nome}
              </p>
            )}
          </div>

          {/* Data */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de nascimento <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="data_nascimento"
              value={formData.data_nascimento || ""}
              onChange={handleChange}
              onBlur={handleDataNascimentoBlur}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800"
            />
            {deveExibirErro("data_nascimento") && errors.data_nascimento && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <MdErrorOutline size={14} />
                {errors.data_nascimento}
              </p>
            )}
            {deveExibirErro("data_nascimento") && erroIdade && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <MdErrorOutline size={14} />
                {erroIdade}
              </p>
            )}
          </div>

          {/* Gênero */}
          <div>
            <DropdownSelect
              label="Gênero"
              value={generoSelecionado}
              options={OPCOES_GENERO}
              placeholder="Selecione"
              required
              error={deveExibirErro("genero") ? erroGeneroSelect : undefined}
              onChange={handleGeneroChange}
            />
            {generoSelecionado === "Outro" && (
              <div className="mt-3">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Especifique o gênero <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={generoOutroTexto}
                  onChange={handleGeneroOutroChange}
                  onBlur={handleGeneroOutroBlur}
                  placeholder="Informe a opção"
                  className={`w-full rounded-xl border bg-white/90 px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#9F64AF] ${
                    errors.genero_outro ? "border-red-300" : "border-gray-200"
                  }`}
                />
                {deveExibirErro("genero_outro") && errors.genero_outro && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium leading-5 text-red-500">
                    <MdErrorOutline size={16} className="shrink-0" />
                    <span>{errors.genero_outro}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Raça/Etnia */}
          <div>
            <DropdownSelect
              label="Raça/Etnia"
              value={formData.raca_etnia || ""}
              options={OPCOES_RACA_ETNIA}
              placeholder="Selecione"
              required
              error={erroRacaEtnia}
              onChange={(valor) => {
                setFormData({ ...formData, raca_etnia: valor });
                setErrors((prev) => ({ ...prev, raca_etnia: undefined }));
              }}
            />
          </div>

          {/* CPF */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CPF {tipo === "adulto" && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              name="cpf"
              value={formData.cpf || ""}
              onChange={handleChange}
              onBlur={handleCpfBlur}
              placeholder="000.000.000-00"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800 ${errors.cpf ? "border-red-500" : "border-gray-300"}`}
            />
            {verificandoCpf && (
              <p className="text-gray-500 text-xs mt-1">Verificando CPF...</p>
            )}
            {deveExibirErro("cpf") && cpfJaExiste && !erroCpfApi && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <MdErrorOutline size={14} /> Já existe um paciente cadastrado
                com este CPF.
              </p>
            )}
            {deveExibirErro("cpf") && errors.cpf && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <MdErrorOutline size={14} />
                {errors.cpf}
              </p>
            )}
            {deveExibirErro("cpf") && erroCpfApi && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <MdErrorOutline size={14} />
                {erroCpfApi}
              </p>
            )}
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone{" "}
              {telefoneObrigatorio && <span className="text-red-500">*</span>}
            </label>
            <input
              type="tel"
              name="telefone"
              value={formData.telefone || ""}
              onChange={handleChange}
              onBlur={() => handleTelefoneBlur("telefone")}
              placeholder="(00) 00000-0000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800"
            />
            {deveExibirErro("telefone") && errors.telefone && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <MdErrorOutline size={14} />
                {errors.telefone}
              </p>
            )}
            {deveExibirErro("telefone") && erroTelefoneApi && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <MdErrorOutline size={14} />
                {erroTelefoneApi}
              </p>
            )}
          </div>

          {/* Telefone alternativo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone alternativo{" "}
              {telefoneAlternativoObrigatorio && (
                <span className="text-red-500">*</span>
              )}
            </label>
            <input
              type="tel"
              name="telefone_alternativo"
              value={formData.telefone_alternativo || ""}
              onChange={handleChange}
              onBlur={() => handleTelefoneBlur("telefone_alternativo")}
              placeholder="(00) 00000-0000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800"
            />
            {deveExibirErro("telefone_alternativo") &&
              errors.telefone_alternativo && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <MdErrorOutline size={14} />
                  {errors.telefone_alternativo}
                </p>
              )}
          </div>

          {/* E-mail */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-mail
            </label>
            <input
              type="email"
              name="email"
              value={formData.email || ""}
              onChange={handleChange}
              onBlur={handleEmailBlur}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800"
            />
            {deveExibirErro("email") && errors.email && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <MdErrorOutline size={14} />
                {errors.email}
              </p>
            )}
          </div>
        </div>

        {/* Deficiência */}
        <div className="flex items-center gap-2 mt-4">
          <input
            type="checkbox"
            name="possui_deficiencia"
            checked={
              formData.possui_deficiencia === true ||
              formData.possui_deficiencia === 1
            }
            onChange={handleDeficienciaChange}
            className="rounded border-gray-300 text-[#9F64AF] focus:ring-[#9F64AF] accent-[#9F64AF]"
          />
          <span className="text-sm text-gray-700">
            Paciente possui deficiência?
          </span>
        </div>
        {formData.possui_deficiencia && (
          <div>
            <textarea
              name="descricao_deficiencia"
              value={formData.descricao_deficiencia || ""}
              onChange={handleChange}
              onBlur={handleDescricaoDeficienciaBlur}
              rows={2}
              className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800"
              placeholder="Descreva a deficiência"
            />
            {deveExibirErro("descricao_deficiencia") &&
              errors.descricao_deficiencia && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <MdErrorOutline size={14} />
                  {errors.descricao_deficiencia}
                </p>
              )}
          </div>
        )}

        {/* Renda e CadÚnico */}
        <div className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Renda familiar
            </label>
            <input
              type="text"
              name="renda_familiar"
              value={formData.renda_familiar || ""}
              onChange={handleRendaChange}
              placeholder="R$ 0,00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="possui_cadastro_unico"
                checked={
                  formData.possui_cadastro_unico === true ||
                  formData.possui_cadastro_unico === 1
                }
                onChange={handleChange}
                className="rounded border-gray-300 text-[#9F64AF] focus:ring-[#9F64AF] accent-[#9F64AF]"
              />
              <span className="text-sm text-gray-700">
                Possui Cadastro Único (CadÚnico)
              </span>
            </label>
          </div>
        </div>

        {/* Endereço */}
        <hr className="my-2" />
        <h3 className="text-md font-semibold text-gray-800">Endereço</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* CEP */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CEP <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="cep"
              value={formData.cep || ""}
              onChange={handleChange}
              onBlur={buscarEnderecoPorCep}
              placeholder="00000-000"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800 ${errors.cep ? "border-red-500" : "border-gray-300"}`}
            />
            {buscarCep.isPending && (
              <p className="text-xs text-gray-500 mt-1">Buscando...</p>
            )}
            {deveExibirErro("cep") && errors.cep && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <MdErrorOutline size={14} />
                {errors.cep}
              </p>
            )}
            <a
              href="https://buscacepinter.correios.com.br/app/endereco/index.php"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#9F64AF] hover:underline mt-1 inline-block"
            >
              Paciente não sabe o CEP?
            </a>
          </div>
          {/* Rua */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rua / Avenida <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="rua"
              value={formData.rua || ""}
              onChange={handleChange}
              onBlur={() => handleEnderecoBlur("rua")}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800 ${errors.rua ? "border-red-500" : "border-gray-300"}`}
            />
            {deveExibirErro("rua") && errors.rua && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <MdErrorOutline size={14} />
                {errors.rua}
              </p>
            )}
          </div>
          {/* Número + Sem número */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número{" "}
              {!formData.sem_numero && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              name="numero"
              value={formData.numero || ""}
              onChange={handleChange}
              disabled={formData.sem_numero === true}
              placeholder="Ex: 123"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800 ${errors.numero ? "border-red-500" : "border-gray-300"} disabled:bg-gray-100`}
            />
            <label className="flex items-center gap-1 text-sm text-gray-600 mt-1">
              <input
                type="checkbox"
                name="sem_numero"
                checked={formData.sem_numero || false}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setFormData({
                    ...formData,
                    sem_numero: checked,
                    numero: checked ? "" : formData.numero,
                  });
                  if (checked)
                    setErrors((prev) => ({ ...prev, numero: undefined }));
                }}
                className="rounded border-gray-300 text-[#9F64AF] focus:ring-[#9F64AF] accent-[#9F64AF]"
              />
              Sem número
            </label>
            {deveExibirErro("numero") && errors.numero && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <MdErrorOutline size={14} />
                {errors.numero}
              </p>
            )}
          </div>
          {/* Complemento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Complemento
            </label>
            <input
              type="text"
              name="complemento"
              value={formData.complemento || ""}
              onChange={handleChange}
              placeholder="Apto, Bloco, Casa..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800"
            />
          </div>
          {/* Bairro */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bairro <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="bairro"
              value={formData.bairro || ""}
              onChange={handleChange}
              onBlur={() => handleEnderecoBlur("bairro")}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800 ${errors.bairro ? "border-red-500" : "border-gray-300"}`}
            />
            {deveExibirErro("bairro") && errors.bairro && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <MdErrorOutline size={14} />
                {errors.bairro}
              </p>
            )}
          </div>
          {/* Cidade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cidade <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="cidade"
              value={formData.cidade || ""}
              onChange={handleChange}
              onBlur={() => handleEnderecoBlur("cidade")}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800 ${errors.cidade ? "border-red-500" : "border-gray-300"}`}
            />
            {deveExibirErro("cidade") && errors.cidade && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <MdErrorOutline size={14} />
                {errors.cidade}
              </p>
            )}
          </div>
          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="estado"
              value={formData.estado || ""}
              onChange={handleChange}
              onBlur={() => handleEnderecoBlur("estado")}
              maxLength={2}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800 uppercase ${errors.estado ? "border-red-500" : "border-gray-300"}`}
            />
            {deveExibirErro("estado") && errors.estado && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <MdErrorOutline size={14} />
                {errors.estado}
              </p>
            )}
          </div>
        </div>
        {/* Observações */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observações
          </label>
          <textarea
            name="observacoes"
            value={formData.observacoes || ""}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800"
          />
        </div>
      </div>
    );
  },
);

DadosPaciente.displayName = "DadosPaciente";
export default DadosPaciente;
