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
  if (err.code === 'SOFTWARE_LICENSE_NAO_ENCONTRADA') {
    return 'Licença de software não encontrada.';
  }
  if (err.code === 'CHAMADO_NAO_ENCONTRADO') {
    return 'Chamado não encontrado.';
  }
  if (err.code === 'CHAMADO_ENCERRADO') {
    return 'Este chamado está encerrado e não aceita novas mensagens.';
  }
  if (err.code === 'EQUIPAMENTO_NAO_ENCONTRADO') {
    return 'Equipamento não encontrado.';
  }
  if (err.code === 'IMPRESSORA_NAO_ENCONTRADA') {
    return 'Impressora não encontrada.';
  }
  if (err.code === 'TONER_NAO_ENCONTRADO') {
    return 'Toner não encontrado.';
  }
  if (err.code === 'IP_JA_CADASTRADO') {
    return 'Este IP já está cadastrado para a mesma empresa.';
  }
  if (err.code === 'CODIGO_TONER_JA_CADASTRADO') {
    return 'Já existe um toner com este código.';
  }
  if (err.code === 'TONER_JA_VINCULADO') {
    return 'Este toner já está vinculado à impressora.';
  }
  if (err.code === 'IMPRESSORA_LOTADA') {
    return 'A impressora atingiu o limite de toners vinculados.';
  }
  if (err.code === 'QTD_TONERS_INSUFICIENTE') {
    return 'A quantidade de toners não pode ser menor que os já vinculados.';
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
  if (err.code === 'IMPORTACAO_ARQUIVO_INVALIDA') {
    return err.message || 'Arquivo inválido, vazio ou sem CPF identificável.';
  }
  if (err.code === 'CPF_INVALIDO') {
    return err.message || 'Um ou mais CPFs informados têm formato inválido.';
  }
  if (err.code === 'ARQUIVO_INVALIDO') {
    return err.message || 'Arquivo inválido. Envie JPEG, PNG, WebP, PDF, DOC ou DOCX (máx. 50 MB).';
  }
  if (err.code === 'TERMO_ASSINADO_NAO_ENCONTRADO') {
    return 'Termo assinado não encontrado.';
  }
  if (err.code === 'ROLE_INVALIDA') {
    return 'Uma ou mais roles informadas são inválidas.';
  }
  if (err.code === 'ULTIMO_ADMIN') {
    return 'Não é possível remover a role ADMIN do único administrador do sistema.';
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
