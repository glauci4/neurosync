export interface AlterarSenhaPayload {
  senhaAtual: string;
  novaSenha: string;
  confirmarNovaSenha: string;
}

export interface AlterarEmailPayload {
  emailAtual: string;
  novoEmail: string;
  senhaAtual: string;
}

export interface RespostaAlterarEmail {
  success: boolean;
  message: string;
  usuario?: {
    email: string;
  };
}
