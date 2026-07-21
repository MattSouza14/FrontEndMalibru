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
    return 'Sua conta ainda não foi ativada. Verifique seu e-mail ou aguarde liberação de um administrador.';
  }
  if (err.code === 'TOKEN_ATIVACAO_INVALIDO') {
    return 'Link de ativação inválido. Verifique o e-mail recebido.';
  }
  if (err.code === 'TOKEN_ATIVACAO_EXPIRADO') {
    return 'Link de ativação expirado. Solicite uma nova ativação ao administrador.';
  }
  if (err.code === 'CONTA_JA_ATIVADA') {
    return 'Esta conta já está ativa. Faça login normalmente.';
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
  if (err.code === 'LICENCA_NAO_VINCULADA') {
    return 'Nenhuma licença Office vinculada à sua conta.';
  }
  if (err.code === 'CERTIFICADO_NAO_ENCONTRADO') {
    return 'Certificado não encontrado.';
  }
  if (err.code === 'CHAMADO_NAO_ENCONTRADO') {
    return 'Chamado não encontrado.';
  }
  if (err.code === 'EQUIPAMENTO_NAO_ENCONTRADO') {
    return 'Equipamento não encontrado.';
  }
  if (err.code === 'LICENCA_LOTADA') {
    return 'Esta licença já atingiu o limite de 5 usuários.';
  }
  if (err.code === 'USUARIO_JA_VINCULADO') {
    return 'Este usuário já possui uma licença vinculada.';
  }
  if (err.code === 'EQUIPAMENTO_JA_VINCULADO') {
    return 'Este equipamento já está vinculado a outro usuário.';
  }
  if (err.code === 'PATRIMONIO_JA_CADASTRADO') {
    return 'Já existe um equipamento com este patrimônio.';
  }
  if (err.code === 'ERRO_INTERNO') {
    return 'Erro no servidor. Tente novamente em instantes.';
  }
  return err.message || fallback;
}

export function isUnauthorized(err) {
  return err.status === 401 || err.code === 'CREDENCIAIS_INVALIDAS';
}

export function isNotFound(err) {
  return err.status === 404;
}
