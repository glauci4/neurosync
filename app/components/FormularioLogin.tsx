// app/components/FormularioLogin.tsx
// Componente de formulário de login utilizando TanStack Query, responsável pela autenticação do usuário no sistema NeuroSync

"use client";

// Importa o hook useState para gerenciamento de estados locais
import Link from "next/link";
import { useEffect, useState } from "react";
// Importa ícones para alternar a visibilidade da senha
import { FaEye, FaEyeSlash } from "react-icons/fa";
// Importa ícone de erro da coleção Material Design
import { MdErrorOutline } from "react-icons/md";

// Importa o hook personalizado de login que utiliza TanStack Query
import { useLogin } from "@/hooks/useLogin";

// Componente principal do formulário de login
export default function FormularioLogin() {
  // ESTADOS DO COMPONENTE

  // Armazena o e-mail digitado pelo usuário
  const [email, setEmail] = useState("");

  // Armazena a senha digitada pelo usuário
  const [senha, setSenha] = useState("");

  // Controla a visibilidade da senha (true = visível, false = oculta)
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erroEmail, setErroEmail] = useState("");
  const [erroSenha, setErroSenha] = useState("");

  // Utiliza o hook de login baseado no TanStack Query
  // mutate: executa a requisição de login
  // isPending: indica se a requisição está em andamento
  // error: armazena erros retornados pela API
  const { mutate: fazerLogin, isPending, error, reset } = useLogin();

  const validarEmail = (emailDigitado: string) => {
    if (!emailDigitado.trim()) {
      setErroEmail("Digite seu e-mail");
      return false;
    }

    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexEmail.test(emailDigitado)) {
      setErroEmail("Digite um e-mail válido");
      return false;
    }

    setErroEmail("");
    return true;
  };

  useEffect(() => {
    const logoutStartedAt = sessionStorage.getItem("logout_started_at");
    if (!logoutStartedAt) return;

    const tempoTotal = Date.now() - Number(logoutStartedAt);
    console.log("logout->login (form mount) em ms:", tempoTotal);
    sessionStorage.removeItem("logout_started_at");
  }, []);

  // Função executada ao enviar o formulário
  const handleSubmit = (e: React.FormEvent) => {
    // Impede o recarregamento da página
    e.preventDefault();

    reset();

    // Valida se todos os campos foram preenchidos
    const emailValido = validarEmail(email);
    if (!senha.trim()) {
      setErroSenha("Digite sua senha");
    } else {
      setErroSenha("");
    }

    if (!emailValido || !senha.trim()) {
      return;
    }

    // Executa a mutação de login enviando os dados para a API
    fazerLogin({ email, senha });
  };

  const mensagemErroLogin =
    error instanceof Error
      ? error.message === "E-mail ou senha inválidos"
        ? "E-mail ou senha inválidos."
        : error.message
      : "";

  // RENDERIZAÇÃO DO COMPONENTE
  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* noValidate desativa as validações padrão do HTML5, permitindo controle total das mensagens via React. */}

      {/* Campo de E-mail */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          E-mail
        </label>

        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (erroEmail) {
              validarEmail(e.target.value);
            }
            if (erroSenha && !mensagemErroLogin) {
              setErroSenha("");
            }
            if (error) {
              reset();
            }
          }}
          onBlur={() => validarEmail(email)}
          placeholder="Digite seu e-mail"
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-400 ${
            erroEmail ? "border-red-500 bg-red-50" : "border-gray-300"
          }`}
          disabled={isPending} // Desativa o campo durante o envio
        />
        {erroEmail && (
          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <MdErrorOutline size={14} />
            {erroEmail}
          </p>
        )}
      </div>

      {/* Campo de Senha */}
      <div>
        <label
          htmlFor="senha"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Senha
        </label>

        {/* Container relativo para posicionar o ícone dentro do input */}
        <div className="relative">
          <input
            id="senha"
            type={mostrarSenha ? "text" : "password"}
            value={senha}
            onChange={(e) => {
              setSenha(e.target.value);
              if (erroSenha) {
                setErroSenha("");
              }
              if (error) {
                reset();
              }
            }}
            onBlur={() => {
              if (!senha.trim()) {
                setErroSenha("Digite sua senha");
              }
            }}
            placeholder="Digite sua senha"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] focus:border-transparent transition-all duration-200 pr-10 text-gray-800 placeholder-gray-400 ${
              erroSenha || mensagemErroLogin
                ? "border-red-500 bg-red-50"
                : "border-gray-300"
            }`}
            disabled={isPending} // Desativa o campo durante o envio
          />

          {/* Botão para alternar a visibilidade da senha */}
          <button
            type="button"
            onClick={() => setMostrarSenha(!mostrarSenha)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#9F64AF] transition-colors duration-200"
            aria-label="Alternar visibilidade da senha"
          >
            {mostrarSenha ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
          </button>
        </div>
        {(erroSenha || mensagemErroLogin) && (
          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <MdErrorOutline size={14} />
            {erroSenha || mensagemErroLogin}
          </p>
        )}
      </div>

      {/* Botão de Envio */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-[#9F64AF] text-white py-2 rounded-lg font-medium hover:bg-[#8B509B] transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {/* isPending indica se a requisição está em andamento */}
        {isPending ? "Entrando..." : "Entrar"}
      </button>

      {/* Link para recuperação de senha */}
      <div className="text-center mt-3">
        <Link href="/recuperar-senha">
          <button
            type="button"
            className="text-[#9F64AF] text-xs hover:underline transition-all duration-200"
          >
            Esqueceu sua senha?
          </button>
        </Link>
      </div>
    </form>
  );
}
