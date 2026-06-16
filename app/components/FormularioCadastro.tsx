// app/components/FormularioCadastro.tsx
// Componente de formulário de cadastro de usuários, com TanStack Query para consulta de CNPJ.
// Inclui validação de CPF para secretárias, CRP para psicólogos, senha forte e máscara de CPF.
// Notificações via toast (sonner) e redirecionamento para a tela de login após sucesso.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { MdErrorOutline } from "react-icons/md";
import { toast } from "sonner"; // Notificações não intrusivas
import { useCadastroUsuario } from "@/hooks/useCadastroUsuario";
import { useConsultaCnpj } from "@/hooks/useConsultaCnpj";

// ---------- Funções auxiliares (validação e máscara) ----------

// Valida CPF (11 dígitos, dígitos verificadores)
function validarCPF(cpf: string): boolean {
  cpf = cpf.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++)
    soma += Number.parseInt(cpf.charAt(i), 10) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== Number.parseInt(cpf.charAt(9), 10)) return false;
  soma = 0;
  for (let i = 0; i < 10; i++)
    soma += Number.parseInt(cpf.charAt(i), 10) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === Number.parseInt(cpf.charAt(10), 10);
}
// Aplica máscara de CPF (000.000.000-00)
function mascararCPF(valor: string): string {
  const numeros = valor.replace(/\D/g, "");
  if (numeros.length <= 3) return numeros;
  if (numeros.length <= 6) return numeros.replace(/(\d{3})(\d{1,3})/, "$1.$2");
  if (numeros.length <= 9)
    return numeros.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
  return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
}

interface FormularioCadastroProps {
  onCadastroSucesso?: () => void;
}

export default function FormularioCadastro({
  onCadastroSucesso,
}: FormularioCadastroProps) {
  const cadastrarUsuario = useCadastroUsuario();
  const router = useRouter();

  // Estados para os campos do formulário
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  // perfilId: 1 = Secretaria, 2 = Psicologo(a)
  const [perfilId, setPerfilId] = useState<number>(1);
  const [cnpj, setCnpj] = useState("");
  const [crp, setCrp] = useState("");
  const [cpf, setCpf] = useState(""); // CPF da secretária
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  // Controle de visibilidade das senhas
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  // Estado para loading e mensagens
  const [carregando, setCarregando] = useState(false);
  const [erroFormulario, setErroFormulario] = useState("");
  const [erroNome, setErroNome] = useState("");
  const [erroEmail, setErroEmail] = useState("");
  const [erroCnpj, setErroCnpj] = useState("");
  const [erroCrp, setErroCrp] = useState("");
  const [erroCpf, setErroCpf] = useState(""); // Erro específico do CPF

  // Estados para validação de senha
  const [erroSenha, setErroSenha] = useState("");
  const [erroConfirmarSenha, setErroConfirmarSenha] = useState("");

  // Hook de consulta de CNPJ
  const {
    data: dadosCnpj,
    isLoading: consultandoCnpj,
    error: erroCnpjConsulta,
  } = useConsultaCnpj(cnpj);

  // Formatação de CNPJ enquanto digita
  const formatarCnpj = (valor: string) => {
    const numeros = valor.replace(/\D/g, "");
    if (numeros.length <= 2) return numeros;
    if (numeros.length <= 5)
      return `${numeros.slice(0, 2)}.${numeros.slice(2)}`;
    if (numeros.length <= 8)
      return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5)}`;
    if (numeros.length <= 12)
      return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5, 8)}/${numeros.slice(8)}`;
    return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5, 8)}/${numeros.slice(8, 12)}-${numeros.slice(12, 14)}`;
  };

  // Validação de email
  const validarEmail = (emailDigitado: string) => {
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailDigitado) {
      setErroEmail("E-mail é obrigatório");
      return false;
    }
    if (!regexEmail.test(emailDigitado)) {
      setErroEmail("Digite um e-mail válido");
      return false;
    }
    setErroEmail("");
    return true;
  };

  // Validação de senha forte
  const validarSenhaForte = (
    senhaDigitada: string,
  ): { valida: boolean; mensagem: string } => {
    if (senhaDigitada.length < 8) {
      return {
        valida: false,
        mensagem: "A senha deve ter pelo menos 8 caracteres",
      };
    }
    if (!/[A-Z]/.test(senhaDigitada)) {
      return {
        valida: false,
        mensagem: "A senha deve conter pelo menos uma letra maiúscula",
      };
    }
    if (!/[a-z]/.test(senhaDigitada)) {
      return {
        valida: false,
        mensagem: "A senha deve conter pelo menos uma letra minúscula",
      };
    }
    if (!/[0-9]/.test(senhaDigitada)) {
      return {
        valida: false,
        mensagem: "A senha deve conter pelo menos um número",
      };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(senhaDigitada)) {
      return {
        valida: false,
        mensagem: "A senha deve conter pelo menos um caractere especial",
      };
    }
    return { valida: true, mensagem: "Senha forte!" };
  };

  // Validação de CRP (apenas para psicólogos)
  const validarCrp = (crpDigitado: string) => {
    if (perfilId !== 2) return true;
    const regexCrp = /^\d{2}\/\d{5}$/;
    if (!crpDigitado) {
      setErroCrp("CRP é obrigatório para psicólogos");
      return false;
    }
    if (!regexCrp.test(crpDigitado)) {
      setErroCrp("CRP inválido. Use o formato: 00/00000");
      return false;
    }
    setErroCrp("");
    return true;
  };

  // Validação de CPF (apenas para secretária) no blur
  const handleCpfBlur = () => {
    if (perfilId !== 1) return;
    const cpfLimpo = cpf.replace(/\D/g, "");
    if (!cpfLimpo) {
      setErroCpf("CPF é obrigatório para secretárias");
      return;
    }
    if (!validarCPF(cpfLimpo)) {
      setErroCpf("CPF inválido. Verifique os dígitos");
      return;
    }
    setErroCpf("");
  };

  // Limpa erro do CPF ao digitar
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = mascararCPF(e.target.value);
    setCpf(valor);
    if (erroCpf) setErroCpf("");
  };

  // Altera perfil e limpa campos dependentes
  const handlePerfilChange = (novoPerfilId: number) => {
    console.log(
      "Alterando perfil para:",
      novoPerfilId === 1 ? "Secretaria" : "Psicologo",
    );
    setPerfilId(novoPerfilId);
    setCrp("");
    setErroCrp("");
    setCpf("");
    setErroCpf("");
  };

  // Validação de senha em tempo real
  const handleSenhaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const novaSenha = e.target.value;
    setSenha(novaSenha);
    const resultado = validarSenhaForte(novaSenha);
    if (!resultado.valida && novaSenha.length > 0) {
      setErroSenha(resultado.mensagem);
    } else {
      setErroSenha("");
    }
  };

  const validarNome = (nomeDigitado: string) => {
    if (!nomeDigitado.trim()) {
      setErroNome("Preencha o nome completo");
      return false;
    }
    setErroNome("");
    return true;
  };

  const validarCnpjCampo = (cnpjDigitado: string) => {
    if (!cnpjDigitado.trim()) {
      setErroCnpj("Digite o CNPJ da clínica");
      return false;
    }
    if (erroCnpjConsulta) {
      setErroCnpj("CNPJ inválido ou não encontrado");
      return false;
    }
    setErroCnpj("");
    return true;
  };

  const validarConfirmarSenha = (senhaOriginal: string, confirmar: string) => {
    if (!confirmar.trim()) {
      setErroConfirmarSenha("Confirme sua senha");
      return false;
    }
    if (senhaOriginal !== confirmar) {
      setErroConfirmarSenha("As senhas não coincidem");
      return false;
    }
    setErroConfirmarSenha("");
    return true;
  };

  // Submissão do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    setErroFormulario("");

    // Validações existentes
    const nomeValido = validarNome(nome);
    const emailValido = validarEmail(email);
    const senhaValida = validarSenhaForte(senha);
    const cnpjValido = validarCnpjCampo(cnpj);
    const confirmarSenhaValida = validarConfirmarSenha(senha, confirmarSenha);
    let temErroValidacao = false;

    if (!nomeValido) temErroValidacao = true;
    if (!emailValido) temErroValidacao = true;
    if (!cnpjValido) temErroValidacao = true;
    if (!confirmarSenhaValida) temErroValidacao = true;

    if (consultandoCnpj) {
      setErroCnpj("Aguardando validação do CNPJ...");
      temErroValidacao = true;
    }
    if (erroCnpjConsulta) {
      setErroCnpj("CNPJ inválido ou não encontrado");
      temErroValidacao = true;
    }
    if (perfilId === 2) {
      const crpValido = validarCrp(crp);
      if (!crpValido) {
        setErroCrp(erroCrp || "CRP é obrigatório para psicólogos");
        temErroValidacao = true;
      }
    }
    // Validação do CPF para secretária
    if (perfilId === 1) {
      const cpfLimpo = cpf.replace(/\D/g, "");
      if (!cpfLimpo) {
        setErroCpf("CPF é obrigatório para secretárias");
        temErroValidacao = true;
      }
      if (!validarCPF(cpfLimpo)) {
        setErroCpf("CPF inválido. Verifique os dígitos");
        temErroValidacao = true;
      }
    }
    if (!senhaValida.valida) {
      setErroSenha(senhaValida.mensagem);
      temErroValidacao = true;
    }
    if (temErroValidacao) {
      setCarregando(false);
      return;
    }

    try {
      const dadosCadastro = {
        nome,
        email,
        senha,
        confirmarSenha,
        perfil_id: perfilId,
        cnpj: cnpj.replace(/\D/g, ""),
        crp: perfilId === 2 ? crp : undefined,
        cpf: perfilId === 1 ? cpf.replace(/\D/g, "") : undefined,
      };

      console.log("Dados enviados para cadastro:", {
        ...dadosCadastro,
        senha: "***",
        confirmarSenha: "***",
      });
      console.log("perfilId enviado:", perfilId);

      const resultado = await cadastrarUsuario.mutateAsync(dadosCadastro);
      console.log("Resposta da API:", resultado);

      // Toast de sucesso (substitui o alert nativo)
      toast.success("Cadastro realizado com sucesso!");

      // Limpa formulário
      setNome("");
      setEmail("");
      setCnpj("");
      setCrp("");
      setCpf("");
      setSenha("");
      setConfirmarSenha("");
      setPerfilId(1);
      setErroNome("");
      setErroEmail("");
      setErroCnpj("");
      setErroCrp("");
      setErroCpf("");
      setErroSenha("");
      setErroConfirmarSenha("");

      // Redireciona para a tela de login após exibir o toast de sucesso
      setTimeout(() => {
        onCadastroSucesso?.();
        router.push("/");
      }, 600);
    } catch (error) {
      console.error("Erro no cadastro:", error);
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao conectar com o servidor";
      if (mensagem.includes("CPF já está cadastrado")) {
        setErroCpf(mensagem);
      } else if (mensagem.includes("CNPJ já está cadastrado")) {
        setErroCnpj(mensagem);
      } else if (mensagem.includes("E-mail já está cadastrado")) {
        setErroEmail(mensagem);
      } else {
        setErroFormulario(mensagem);
      }
    } finally {
      setCarregando(false);
    }
  };

  const isPsicologo = perfilId === 2;
  const isSecretaria = perfilId === 1;

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Campo Nome Completo */}
      <div>
        <label
          htmlFor="nome"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Nome completo
        </label>
        <input
          id="nome"
          type="text"
          value={nome}
          onChange={(e) => {
            setNome(e.target.value);
            if (erroNome) {
              validarNome(e.target.value);
            }
          }}
          onBlur={() => validarNome(nome)}
          placeholder="Digite seu nome completo"
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-400 ${
            erroNome ? "border-red-500 bg-red-50" : "border-gray-300"
          }`}
          disabled={carregando}
        />
        {erroNome && (
          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <MdErrorOutline size={14} />
            {erroNome}
          </p>
        )}
      </div>

      {/* Campo E-mail */}
      <div>
        <label
          htmlFor="email-cadastro"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          E-mail
        </label>
        <input
          id="email-cadastro"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            validarEmail(e.target.value);
          }}
          onBlur={() => validarEmail(email)}
          placeholder="Digite seu e-mail"
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-400 ${
            erroEmail ? "border-red-500 bg-red-50" : "border-gray-300"
          }`}
          disabled={carregando}
        />
        {erroEmail && (
          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <MdErrorOutline size={14} />
            {erroEmail}
          </p>
        )}
      </div>

      {/* Perfil de acesso */}
      <div>
        <p className="block text-sm font-medium text-gray-700 mb-1">
          Perfil de acesso
        </p>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="1"
              checked={perfilId === 1}
              onChange={() => handlePerfilChange(1)}
              className="w-4 h-4 accent-[#9F64AF] focus:ring-[#9F64AF] focus:ring-offset-0"
            />
            <span className="text-gray-700">Secretária</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="2"
              checked={perfilId === 2}
              onChange={() => handlePerfilChange(2)}
              className="w-4 h-4 accent-[#9F64AF] focus:ring-[#9F64AF] focus:ring-offset-0"
            />
            <span className="text-gray-700">Psicólogo(a)</span>
          </label>
        </div>
      </div>

      {/* Campo CNPJ */}
      <div>
        <label
          htmlFor="cnpj"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          CNPJ da clínica
        </label>
        <input
          id="cnpj"
          type="text"
          value={cnpj}
          onChange={(e) => {
            const valor = formatarCnpj(e.target.value);
            setCnpj(valor);
            if (erroCnpj) {
              validarCnpjCampo(valor);
            }
          }}
          onBlur={() => validarCnpjCampo(cnpj)}
          placeholder="Digite o CNPJ da clinica"
          maxLength={18}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-400 ${
            erroCnpj || erroCnpjConsulta
              ? "border-red-500 bg-red-50"
              : "border-gray-300"
          }`}
          disabled={carregando || consultandoCnpj}
        />
        {(erroCnpj || erroCnpjConsulta) && !consultandoCnpj && (
          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <MdErrorOutline size={14} />
            {erroCnpj || "CNPJ inválido ou não encontrado"}
          </p>
        )}
        {consultandoCnpj && (
          <p className="text-xs text-[#9F64AF] mt-1">Consultando CNPJ...</p>
        )}
        {dadosCnpj?.nome_fantasia && !erroCnpj && !erroCnpjConsulta && (
          <div className="mt-2 p-2 bg-green-50 rounded-lg text-xs border border-green-200">
            <p className="text-green-700 font-medium">✓ CNPJ valido</p>
            <p className="text-gray-600 mt-1">
              Clinica: {dadosCnpj.nome_fantasia}
            </p>
            <p className="text-gray-500 text-xs">
              {dadosCnpj.cidade}/{dadosCnpj.estado}
            </p>
          </div>
        )}
      </div>

      {/* Campo CRP (apenas para psicólogo) */}
      {isPsicologo && (
        <div>
          <label
            htmlFor="crp"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            CRP
          </label>
          <input
            id="crp"
            type="text"
            value={crp}
            onChange={(e) => {
              setCrp(e.target.value);
              if (erroCrp) {
                validarCrp(e.target.value);
              }
            }}
            onBlur={() => validarCrp(crp)}
            placeholder="Digite seu CRP (formato: 00/00000)"
            maxLength={8}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-400 ${
              erroCrp ? "border-red-500 bg-red-50" : "border-gray-300"
            }`}
            disabled={carregando}
          />
          {erroCrp && (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <MdErrorOutline size={14} />
              {erroCrp}
            </p>
          )}
        </div>
      )}

      {/* Campo CPF (apenas para secretária) */}
      {isSecretaria && (
        <div>
          <label
            htmlFor="cpf"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            CPF
          </label>
          <input
            id="cpf"
            type="text"
            value={cpf}
            onChange={(e) => {
              handleCpfChange(e);
              if (erroCpf) {
                handleCpfBlur();
              }
            }}
            onBlur={handleCpfBlur}
            placeholder="Digite seu CPF"
            maxLength={14}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-400 ${
              erroCpf ? "border-red-500 bg-red-50" : "border-gray-300"
            }`}
            disabled={carregando}
          />
          {erroCpf && (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <MdErrorOutline size={14} />
              {erroCpf}
            </p>
          )}
        </div>
      )}

      {/* Campo Senha */}
      <div>
        <label
          htmlFor="senha-cadastro"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Senha
        </label>
        <div className="relative">
          <input
            id="senha-cadastro"
            type={mostrarSenha ? "text" : "password"}
            value={senha}
            onChange={handleSenhaChange}
            onBlur={() => {
              if (!senha.trim()) {
                setErroSenha("A senha é obrigatória");
              }
            }}
            placeholder="Digite sua senha"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] focus:border-transparent transition-all duration-200 pr-10 text-gray-800 placeholder-gray-400 ${
              erroSenha ? "border-red-500 bg-red-50" : "border-gray-300"
            }`}
            disabled={carregando}
          />
          <button
            type="button"
            onClick={() => setMostrarSenha(!mostrarSenha)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#9F64AF] transition-colors duration-200"
          >
            {mostrarSenha ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
          </button>
        </div>
        {erroSenha && (
          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <MdErrorOutline size={14} />
            {erroSenha}
          </p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          A senha deve ter no mínimo 8 caracteres, conter letras maiúsculas,
          minúsculas, números e caracteres especiais.
        </p>
      </div>

      {/* Campo Confirmar Senha */}
      <div>
        <label
          htmlFor="confirmar-senha"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Confirmar senha
        </label>
        <div className="relative">
          <input
            id="confirmar-senha"
            type={mostrarConfirmarSenha ? "text" : "password"}
            value={confirmarSenha}
            onChange={(e) => {
              setConfirmarSenha(e.target.value);
              if (erroConfirmarSenha) {
                validarConfirmarSenha(senha, e.target.value);
              }
            }}
            onBlur={() => validarConfirmarSenha(senha, confirmarSenha)}
            placeholder="Confirme sua senha"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] focus:border-transparent transition-all duration-200 pr-10 text-gray-800 placeholder-gray-400 ${
              erroConfirmarSenha
                ? "border-red-500 bg-red-50"
                : "border-gray-300"
            }`}
            disabled={carregando}
          />
          <button
            type="button"
            onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#9F64AF] transition-colors duration-200"
          >
            {mostrarConfirmarSenha ? (
              <FaEyeSlash size={18} />
            ) : (
              <FaEye size={18} />
            )}
          </button>
        </div>
        {erroConfirmarSenha && (
          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <MdErrorOutline size={14} />
            {erroConfirmarSenha}
          </p>
        )}
      </div>

      {erroFormulario && (
        <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg flex items-center justify-center gap-1">
          <MdErrorOutline size={16} />
          {erroFormulario}
        </div>
      )}

      {/* Botão de Cadastrar */}
      <button
        type="submit"
        disabled={carregando || consultandoCnpj}
        className="w-full bg-[#9F64AF] text-white py-2 rounded-lg font-medium hover:bg-[#8B509B] transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm"
      >
        {carregando ? "Cadastrando..." : "Cadastrar"}
      </button>
    </form>
  );
}
