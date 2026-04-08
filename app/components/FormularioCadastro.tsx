// app/components/FormularioCadastro.tsx
// Componente de formulário de cadastro de usuários

'use client';

import { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { MdErrorOutline } from 'react-icons/md';

export default function FormularioCadastro() {
  // Estados para os campos do formulário
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [perfil, setPerfil] = useState('secretaria');
  const [cnpj, setCnpj] = useState('');
  const [crp, setCrp] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  
  // Estado para controlar visibilidade da senha
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  
  // Estado para loading e mensagens
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  
  // Estado para validações
  const [erroEmail, setErroEmail] = useState('');
  const [erroCrp, setErroCrp] = useState('');
  const [erroCnpj, setErroCnpj] = useState('');
  const [erroSenha, setErroSenha] = useState('');
  
  // Estado para dados da clínica (preenchidos pela API)
  const [dadosClinica, setDadosClinica] = useState({
    razao_social: '',
    nome_fantasia: '',
    logradouro: '',
    cidade: '',
    estado: ''
  });
  
  // Estado para controlar se está consultando o CNPJ
  const [consultandoCnpj, setConsultandoCnpj] = useState(false);

  // Função para validar senha forte
  const validarSenhaForte = (senhaDigitada: string): { valida: boolean; mensagem: string } => {
    if (senhaDigitada.length < 8) {
      return {
        valida: false,
        mensagem: 'A senha deve ter pelo menos 8 caracteres'
      };
    }
    
    if (!/[A-Z]/.test(senhaDigitada)) {
      return {
        valida: false,
        mensagem: 'A senha deve conter pelo menos uma letra maiúscula (A-Z)'
      };
    }
    
    if (!/[a-z]/.test(senhaDigitada)) {
      return {
        valida: false,
        mensagem: 'A senha deve conter pelo menos uma letra minúscula (a-z)'
      };
    }
    
    if (!/[0-9]/.test(senhaDigitada)) {
      return {
        valida: false,
        mensagem: 'A senha deve conter pelo menos um número (0-9)'
      };
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(senhaDigitada)) {
      return {
        valida: false,
        mensagem: 'A senha deve conter pelo menos um caractere especial (!@#$%^&*(),.?":{}|<>)'
      };
    }
    
    return {
      valida: true,
      mensagem: 'Senha forte!'
    };
  };

  // Função para validar email
  const validarEmail = (emailDigitado: string) => {
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailDigitado) {
      setErroEmail('');
      return false;
    }
    
    if (!regexEmail.test(emailDigitado)) {
      setErroEmail('Digite um e-mail válido (exemplo: nome@empresa.com)');
      return false;
    }
    
    setErroEmail('');
    return true;
  };

  // Função que valida o CRP
  const validarCrp = (crpDigitado: string) => {
    if (perfil !== 'psicologo') return true;
    
    const regexCrp = /^\d{2}\/\d{5}$/;
    
    if (!crpDigitado) {
      setErroCrp('CRP é obrigatório para psicólogos');
      return false;
    }
    
    if (!regexCrp.test(crpDigitado)) {
      setErroCrp('CRP inválido. Use o formato: 00/00000');
      return false;
    }
    
    setErroCrp('');
    return true;
  };

  // Função para formatar CNPJ enquanto digita
  const formatarCnpj = (valor: string) => {
    const numeros = valor.replace(/\D/g, '');
    
    if (numeros.length <= 2) return numeros;
    if (numeros.length <= 5) return `${numeros.slice(0, 2)}.${numeros.slice(2)}`;
    if (numeros.length <= 8) return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5)}`;
    if (numeros.length <= 12) return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5, 8)}/${numeros.slice(8)}`;
    
    return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5, 8)}/${numeros.slice(8, 12)}-${numeros.slice(12, 14)}`;
  };

  // Função para consultar CNPJ na API e verificar se é real
  const consultarCnpj = async (cnpjDigitado: string) => {
    const cnpjNumeros = cnpjDigitado.replace(/\D/g, '');
    
    if (cnpjNumeros.length !== 14) {
      setErroCnpj('CNPJ deve ter 14 dígitos');
      return;
    }
    
    setConsultandoCnpj(true);
    setErroCnpj('');
    
    try {
      const response = await fetch(`/api/consulta-cnpj?cnpj=${cnpjNumeros}`);
      const dados = await response.json();
      
      if (response.ok && dados.razao_social) {
        // CNPJ real encontrado
        setDadosClinica({
          razao_social: dados.razao_social || '',
          nome_fantasia: dados.nome_fantasia || '',
          logradouro: dados.logradouro || '',
          cidade: dados.cidade || '',
          estado: dados.estado || ''
        });
        setErroCnpj('');
      } else {
        // CNPJ não encontrado ou inválido
        setErroCnpj('CNPJ inválido ou não encontrado. Verifique o número digitado.');
        setDadosClinica({
          razao_social: '',
          nome_fantasia: '',
          logradouro: '',
          cidade: '',
          estado: ''
        });
      }
    } catch (error) {
      console.error('Erro ao consultar CNPJ:', error);
      setErroCnpj('Erro ao consultar CNPJ. Tente novamente mais tarde.');
    } finally {
      setConsultandoCnpj(false);
    }
  };

  // Função chamada quando o CNPJ perde o foco
  const handleCnpjBlur = () => {
    const cnpjNumeros = cnpj.replace(/\D/g, '');
    if (cnpjNumeros.length === 14) {
      consultarCnpj(cnpj);
    } else if (cnpjNumeros.length > 0 && cnpjNumeros.length !== 14) {
      setErroCnpj('CNPJ deve ter 14 dígitos');
    }
  };

  // Função chamada quando o CNPJ é digitado
  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const novoCnpj = formatarCnpj(e.target.value);
    setCnpj(novoCnpj);
    // Limpa o erro enquanto digita
    if (erroCnpj) setErroCnpj('');
    if (dadosClinica.nome_fantasia) {
      setDadosClinica({
        razao_social: '',
        nome_fantasia: '',
        logradouro: '',
        cidade: '',
        estado: ''
      });
    }
  };

  // Função chamada quando o perfil muda
  const handlePerfilChange = (novoPerfil: string) => {
    setPerfil(novoPerfil);
    setCrp('');
    setErroCrp('');
  };

  // Função chamada quando a senha é digitada
  const handleSenhaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const novaSenha = e.target.value;
    setSenha(novaSenha);
    const resultado = validarSenhaForte(novaSenha);
    if (!resultado.valida && novaSenha.length > 0) {
      setErroSenha(resultado.mensagem);
    } else {
      setErroSenha('');
    }
  };

  // Função de envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');
    
    // Validação de email
    const emailValido = validarEmail(email);
    
    // Validação de senha forte
    const senhaValida = validarSenhaForte(senha);
    
    // Validações básicas
    if (!nome) {
      setErro('Preencha o nome completo');
      setCarregando(false);
      return;
    }
    
    if (!emailValido) {
      setErro('Digite um e-mail válido');
      setCarregando(false);
      return;
    }
    
    if (!cnpj) {
      setErro('Digite o CNPJ da clínica');
      setCarregando(false);
      return;
    }
    
    if (erroCnpj) {
      setErro('CNPJ inválido. Verifique o número digitado.');
      setCarregando(false);
      return;
    }
    
    if (perfil === 'psicologo' && !crp) {
      setErro('CRP é obrigatório para psicólogos');
      setCarregando(false);
      return;
    }
    
    if (!senhaValida.valida) {
      setErro(senhaValida.mensagem);
      setCarregando(false);
      return;
    }
    
    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem');
      setCarregando(false);
      return;
    }
    
    try {
      const dadosCadastro = {
        nome,
        email,
        senha,
        confirmarSenha,
        perfil,
        cnpj: cnpj.replace(/\D/g, ''),
        crp: perfil === 'psicologo' ? crp : undefined
      };
      
      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosCadastro),
      });
      
      const resultado = await response.json();
      
      if (response.ok) {
        alert('Cadastro realizado com sucesso!');
        setNome('');
        setEmail('');
        setCnpj('');
        setCrp('');
        setSenha('');
        setConfirmarSenha('');
        setDadosClinica({
          razao_social: '',
          nome_fantasia: '',
          logradouro: '',
          cidade: '',
          estado: ''
        });
      } else {
        setErro(resultado.error || 'Erro ao cadastrar');
      }
    } catch (error) {
      setErro('Erro ao conectar com o servidor');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      
      {/* Campo Nome Completo */}
      <div>
        <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
          Nome completo
        </label>
        <input
          id="nome"
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Digite seu nome completo"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-400"
          disabled={carregando}
        />
      </div>
      
      {/* Campo E-mail */}
      <div>
        <label htmlFor="email-cadastro" className="block text-sm font-medium text-gray-700 mb-1">
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
          placeholder="Digite seu e-mail"
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-400 ${
            erroEmail ? 'border-red-500 bg-red-50' : 'border-gray-300'
          }`}
          disabled={carregando}
        />
        {erroEmail && (
          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <MdErrorOutline size={14} />
            {erroEmail}
          </p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          Exemplo: nome@empresa.com
        </p>
      </div>
      
      {/* Perfil de acesso */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Perfil de acesso
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="secretaria"
              checked={perfil === 'secretaria'}
              onChange={() => handlePerfilChange('secretaria')}
              className="w-4 h-4 accent-[#9F64AF] focus:ring-[#9F64AF] focus:ring-offset-0"
            />
            <span className="text-gray-700">Secretária</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="psicologo"
              checked={perfil === 'psicologo'}
              onChange={() => handlePerfilChange('psicologo')}
              className="w-4 h-4 accent-[#9F64AF] focus:ring-[#9F64AF] focus:ring-offset-0"
            />
            <span className="text-gray-700">Psicólogo(a)</span>
          </label>
        </div>
      </div>
      
      {/* Campo CNPJ */}
      <div>
        <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700 mb-1">
          CNPJ da clínica
        </label>
        <input
          id="cnpj"
          type="text"
          value={cnpj}
          onChange={handleCnpjChange}
          onBlur={handleCnpjBlur}
          placeholder="00.000.000/0000-00"
          maxLength={18}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-400 ${
            erroCnpj ? 'border-red-500 bg-red-50' : 'border-gray-300'
          }`}
          disabled={carregando || consultandoCnpj}
        />
        {consultandoCnpj && (
          <p className="text-xs text-[#9F64AF] mt-1">Consultando CNPJ...</p>
        )}
        {erroCnpj && (
          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <MdErrorOutline size={14} />
            {erroCnpj}
          </p>
        )}
        {dadosClinica.nome_fantasia && !erroCnpj && (
          <div className="mt-2 p-2 bg-green-50 rounded-lg text-xs border border-green-200">
            <p className="text-green-700 font-medium">✓ CNPJ válido</p>
            <p className="text-gray-600 mt-1">Clínica: {dadosClinica.nome_fantasia}</p>
            <p className="text-gray-500 text-xs">{dadosClinica.cidade}/{dadosClinica.estado}</p>
          </div>
        )}
      </div>
      
      {/* Campo CRP (aparece apenas para psicólogo) */}
      {perfil === 'psicologo' && (
        <div>
          <label htmlFor="crp" className="block text-sm font-medium text-gray-700 mb-1">
            CRP
          </label>
          <input
            id="crp"
            type="text"
            value={crp}
            onChange={(e) => setCrp(e.target.value)}
            onBlur={() => validarCrp(crp)}
            placeholder="00/00000"
            maxLength={8}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-400 ${
              erroCrp ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            disabled={carregando}
          />
          {erroCrp && (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <MdErrorOutline size={14} />
              {erroCrp}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Exemplo: 01/12345 (Região/Registro)
          </p>
        </div>
      )}
      
      {/* Campo Senha */}
      <div>
        <label htmlFor="senha-cadastro" className="block text-sm font-medium text-gray-700 mb-1">
          Senha
        </label>
        <div className="relative">
          <input
            id="senha-cadastro"
            type={mostrarSenha ? 'text' : 'password'}
            value={senha}
            onChange={handleSenhaChange}
            placeholder="Digite sua senha"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] focus:border-transparent transition-all duration-200 pr-10 text-gray-800 placeholder-gray-400 ${
              erroSenha ? 'border-red-500 bg-red-50' : 'border-gray-300'
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
        
        {/* Mensagem de erro específica baseada na validação */}
        {erroSenha && (
          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <MdErrorOutline size={14} />
            {erroSenha}
          </p>
        )}
        
        {/* Sugestão resumida de senha forte - aparece apenas quando não há erro específico */}
        {!erroSenha && senha.length > 0 && (
          <p className="text-green-600 text-xs mt-1">
            ✓ Senha forte!
          </p>
        )}
        
        {/* Dica resumida que aparece quando o campo está vazio */}
        {senha.length === 0 && (
          <p className="text-xs text-gray-400 mt-1">
            A senha deve conter + de 8 caracteres incluindo letras, números e caracteres especiais
          </p>
        )}
      </div>
      
      {/* Campo Confirmar Senha */}
      <div>
        <label htmlFor="confirmar-senha" className="block text-sm font-medium text-gray-700 mb-1">
          Confirmar senha
        </label>
        <div className="relative">
          <input
            id="confirmar-senha"
            type={mostrarConfirmarSenha ? 'text' : 'password'}
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            placeholder="Confirme sua senha"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F64AF] focus:border-transparent transition-all duration-200 pr-10 text-gray-800 placeholder-gray-400 ${
              confirmarSenha && senha !== confirmarSenha ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            disabled={carregando}
          />
          <button
            type="button"
            onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#9F64AF] transition-colors duration-200"
          >
            {mostrarConfirmarSenha ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
          </button>
        </div>
        {confirmarSenha && senha !== confirmarSenha && (
          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <MdErrorOutline size={14} />
            As senhas não coincidem
          </p>
        )}
      </div>
      
      {/* Mensagem de erro geral */}
      {erro && (
        <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg flex items-center justify-center gap-1">
          <MdErrorOutline size={16} />
          {erro}
        </div>
      )}
      
      {/* Botão de Cadastrar */}
      <button
        type="submit"
        disabled={carregando}
        className="w-full bg-[#9F64AF] text-white py-2 rounded-lg font-medium hover:bg-[#8B509B] transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm"
      >
        {carregando ? 'Cadastrando...' : 'Cadastrar'}
      </button>
    </form>
  );
}