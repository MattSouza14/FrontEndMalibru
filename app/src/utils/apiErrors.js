export function getApiErrorMessage(err, fallback) {
  if (err.status === 401 || err.code === 'CREDENCIAIS_INVALIDAS') {
    return 'Sessão expirada. Faça login novamente.';
  }
  if (err.code === 'VALIDATION_ERROR') {
    if (err.details) {
      return Object.values(err.details).join(' ');
    }
    return err.message || 'Dados inválidos.';
  }
  if (err.code === 'REQUISICAO_INVALIDA') {
    return err.message || 'Dados inválidos. Verifique as informações e tente novamente.';
  }
  if (err.code === 'CONTA_NAO_ATIVADA') {
    return 'Sua conta ainda não foi ativada. Aguarde a liberação de um administrador.';
  }
  if (err.code === 'EMAIL_JA_CADASTRADO') {
    return 'Este e-mail já está em uso por outra conta.';
  }
  if (err.code === 'ACESSO_NEGADO') {
    return 'Você não tem permissão para acessar esta área.';
  }
  if (err.code === 'USUARIO_NAO_ENCONTRADO') {
    return 'Usuário não encontrado.';
  }
  if (err.code === 'OFFICE_LICENSE_NAO_ENCONTRADA') {
    return 'Licença Office não encontrada.';
  }
  if (err.code === 'CERTIFICADO_NAO_ENCONTRADO') {
    return 'Certificado não encontrado.';
  }
  if (err.code === 'CHAMADO_NAO_ENCONTRADO') {
    return 'Chamado não encontrado.';
  }
  if (err.code === 'LICENCA_LOTADA') {
    return 'Esta licença já atingiu o limite de 5 usuários.';
  }
  if (err.code === 'USUARIO_JA_VINCULADO') {
    return 'Este usuário já possui uma licença vinculada.';
  }
  if (err.code === 'ERRO_INTERNO') {
    return 'Erro no servidor. Tente novamente em instantes.';
  }
  return err.message || fallback;
}

export function isUnauthorized(err) {
  return err.status === 401 || err.code === 'CREDENCIAIS_INVALIDAS';
}
