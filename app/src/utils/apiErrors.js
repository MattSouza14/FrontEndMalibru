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
    return err.message || 'Preencha nome e e-mail corretamente.';
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
