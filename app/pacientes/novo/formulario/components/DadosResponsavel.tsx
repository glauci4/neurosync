// app/pacientes/novo/formulario/components/DadosResponsavel.tsx
// Componente de formulário para os dados do responsável legal do paciente menor de idade.
// Inclui campos de nome, CPF, telefone, grau de parentesco e endereço (se diferente do paciente).
// A opção "Responsável Legal" foi mantida na lista de parentesco, pois é um termo formal.

"use client";

import { useBuscarCep } from "@/hooks/useConsultaCep";
import { MdErrorOutline } from "react-icons/md";
import DropdownSelect from "./DropdownSelect";

// Interface que define as props esperadas pelo componente
interface DadosResponsavelProps {
  responsavel: {
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
  setResponsavel: (data: any) => void;
  setErros: (data: any) => void;
  erros: {
    nome: string;
    cpf: string;
    telefone: string;
    grau: string;
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep?: string;
  };
  onMesmoEnderecoChange: (checked: boolean) => void;
}

// Opções para o campo de grau de parentesco
const OPCOES_PARENTESCO = [
  "Pai/Mãe",
  "Tio(a)",
  "Avô(ó)",
  "Irmão(ã)",
  "Responsável Legal",
  "Outros",
];

// Aplica máscara de CPF (000.000.000-00)
function formatarCPF(valor: string): string {
  const numeros = valor.replace(/\D/g, "");
  if (numeros.length <= 3) return numeros;
  if (numeros.length <= 6) return `${numeros.slice(0, 3)}.${numeros.slice(3)}`;
  if (numeros.length <= 9)
    return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6)}`;
  return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6, 9)}-${numeros.slice(9, 11)}`;
}

// Aplica máscara de telefone ((00) 00000-0000)
function formatarTelefone(valor: string): string {
  const numeros = valor.replace(/\D/g, "");
  if (numeros.length <= 2) return numeros;
  if (numeros.length <= 6)
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  if (numeros.length <= 10)
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
}

export default function DadosResponsavel({
  responsavel,
  setResponsavel,
  setErros,
  erros,
  onMesmoEnderecoChange,
}: DadosResponsavelProps) {
  const buscarCep = useBuscarCep();

  // Atualiza campos comuns
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setResponsavel((prev: any) => ({ ...prev, [name]: value }));
  };

  // Alterna o checkbox "sem número" e limpa o campo número se marcado
  const handleSemNumeroChange = (checked: boolean) => {
    setResponsavel((prev: any) => ({
      ...prev,
      sem_numero: checked,
      numero: checked ? "" : prev.numero,
    }));
  };

  // Aplica máscara de CPF enquanto o usuário digita
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatado = formatarCPF(e.target.value);
    setResponsavel((prev: any) => ({ ...prev, cpf: formatado }));
  };

  // Aplica máscara de telefone enquanto o usuário digita
  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatado = formatarTelefone(e.target.value);
    setResponsavel((prev: any) => ({ ...prev, telefone: formatado }));
  };

  const buscarEnderecoPorCep = async () => {
    const cep = responsavel.cep?.replace(/\D/g, "");
    if (!cep || cep.length !== 8) {
      setErros((prev: any) => ({
        ...prev,
        cep: "CEP é obrigatório (8 dígitos)",
      }));
      return;
    }

    try {
      const data = await buscarCep.mutateAsync(cep);
      setResponsavel((prev: any) => ({
        ...prev,
        rua: data.logradouro || "",
        bairro: data.bairro || "",
        cidade: data.cidade || "",
        estado: data.estado || "",
        numero: "",
        complemento: "",
      }));
      setErros((prev: any) => ({
        ...prev,
        cep: undefined,
        rua: undefined,
        bairro: undefined,
        cidade: undefined,
        estado: undefined,
      }));
    } catch (error) {
      setErros((prev: any) => ({
        ...prev,
        cep: error instanceof Error ? error.message : "Erro ao buscar CEP",
      }));
    }
  };

  return (
    <div className="border-t pt-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Dados do Responsável Legal <span className="text-red-500">*</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nome completo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome completo <span className="text-red-500">*</span>
          </label>
              <input
                type="text"
                name="nome"
                value={responsavel.nome}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800"
              />
              {erros.nome && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium leading-5 text-red-500">
              <MdErrorOutline size={16} className="shrink-0" />
              {erros.nome}
            </p>
          )}
        </div>
        {/* CPF */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CPF <span className="text-red-500">*</span>
          </label>
              <input
                type="text"
                name="cpf"
                value={responsavel.cpf}
                onChange={handleCpfChange}
                placeholder="000.000.000-00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800"
              />
              {erros.cpf && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium leading-5 text-red-500">
              <MdErrorOutline size={16} className="shrink-0" />
              {erros.cpf}
            </p>
          )}
        </div>
        {/* Telefone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telefone <span className="text-red-500">*</span>
          </label>
              <input
                type="tel"
                name="telefone"
                value={responsavel.telefone}
                onChange={handleTelefoneChange}
                placeholder="(00) 00000-0000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800"
              />
              {erros.telefone && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium leading-5 text-red-500">
              <MdErrorOutline size={16} className="shrink-0" />
              {erros.telefone}
            </p>
          )}
        </div>
        {/* Grau de parentesco */}
        <div>
          <DropdownSelect
            label="Grau de parentesco"
            value={responsavel.grau_parentesco}
              options={[
                { value: "", label: "Selecione" },
                ...OPCOES_PARENTESCO.map((op) => ({ value: op, label: op })),
              ]}
              placeholder="Selecione"
              required
              error={erros.grau}
            onChange={(valor) => {
              setResponsavel((prev: any) => ({
                ...prev,
                grau_parentesco: valor,
              }));
              if (valor) {
                setErros((prev: any) => ({ ...prev, grau: undefined }));
              }
            }}
          />
        </div>
        {/* Checkbox mesmo endereço */}
        <div className="col-span-2">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={responsavel.mesmo_endereco_paciente}
              onChange={(e) => onMesmoEnderecoChange(e.target.checked)}
              className="rounded border-gray-300 text-[#9F64AF] focus:ring-[#9F64AF] accent-[#9F64AF]"
            />
            O responsável possui o mesmo endereço que o paciente
          </label>
        </div>
      </div>

      {/* Endereço do responsável (exibido apenas se diferente do paciente) */}
      {!responsavel.mesmo_endereco_paciente && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
          <h4 className="text-md font-semibold text-gray-800 mb-3">
            Endereço do Responsável
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CEP */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CEP <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="cep"
                value={responsavel.cep}
                onChange={handleChange}
                onBlur={buscarEnderecoPorCep}
                placeholder="00000-000"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800 ${erros.cep ? "border-red-500" : "border-gray-300"}`}
              />
              {erros.cep && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium leading-5 text-red-500">
                  <MdErrorOutline size={16} className="shrink-0" />
                  {erros.cep}
                </p>
              )}
              <a
                href="https://buscacepinter.correios.com.br/app/endereco/index.php"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#9F64AF] hover:underline mt-1 inline-block"
              >
                Responsável não sabe o CEP?
              </a>
            </div>
            {/* Rua */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rua <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="rua"
                value={responsavel.rua}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800"
              />
              {erros.rua && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium leading-5 text-red-500">
                  <MdErrorOutline size={16} className="shrink-0" />
                  {erros.rua}
                </p>
              )}
            </div>
            {/* Número */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número{" "}
                {!responsavel.sem_numero && (
                  <span className="text-red-500">*</span>
                )}
              </label>
              <input
                type="text"
                name="numero"
                value={responsavel.numero}
                onChange={handleChange}
                disabled={responsavel.sem_numero === true}
                placeholder="Ex: 123"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800 ${erros.numero ? "border-red-500" : "border-gray-300"} disabled:bg-gray-100`}
              />
              <label className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                <input
                  type="checkbox"
                  checked={responsavel.sem_numero || false}
                  onChange={(e) => handleSemNumeroChange(e.target.checked)}
                  className="rounded border-gray-300 text-[#9F64AF] focus:ring-[#9F64AF] accent-[#9F64AF]"
                />
                Sem número
              </label>
              {erros.numero && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium leading-5 text-red-500">
                  <MdErrorOutline size={16} className="shrink-0" />
                  {erros.numero}
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
                value={responsavel.complemento}
                onChange={handleChange}
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
                value={responsavel.bairro}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800"
              />
              {erros.bairro && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium leading-5 text-red-500">
                  <MdErrorOutline size={16} className="shrink-0" />
                  {erros.bairro}
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
                value={responsavel.cidade}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800"
              />
              {erros.cidade && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium leading-5 text-red-500">
                  <MdErrorOutline size={16} className="shrink-0" />
                  {erros.cidade}
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
                value={responsavel.estado}
                onChange={handleChange}
                maxLength={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] bg-white text-gray-800 uppercase"
              />
              {erros.estado && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium leading-5 text-red-500">
                  <MdErrorOutline size={16} className="shrink-0" />
                  {erros.estado}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

