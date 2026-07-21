export function stripDigits(value) {
  return String(value ?? '').replace(/\D/g, '');
}

export function isValidEmail(value) {
  const email = String(value ?? '').trim();
  if (!email || email.length > 150) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateNome(value) {
  const nome = String(value ?? '').trim();
  if (!nome) return 'Nome é obrigatório.';
  if (nome.length > 150) return 'Nome deve ter no máximo 150 caracteres.';
  return null;
}

export function validateEmail(value) {
  const email = String(value ?? '').trim();
  if (!email) return 'E-mail é obrigatório.';
  if (email.length > 150) return 'E-mail deve ter no máximo 150 caracteres.';
  if (!isValidEmail(email)) return 'Informe um e-mail válido.';
  return null;
}

export function validateSenha(value) {
  if (!value) return 'Senha é obrigatória.';
  if (value.length < 6) return 'Senha deve ter no mínimo 6 caracteres.';
  if (value.length > 100) return 'Senha deve ter no máximo 100 caracteres.';
  return null;
}

export function validateSetor(value) {
  if (value && String(value).length > 100) {
    return 'Setor deve ter no máximo 100 caracteres.';
  }
  return null;
}

export function validateBrazilianMobile(value) {
  const digits = stripDigits(value);
  if (digits.length !== 11) {
    return 'Informe um celular válido com DDD (11 dígitos).';
  }
  if (!/^\d{2}9\d{8}$/.test(digits)) {
    return 'Celular inválido. Use DDD + 9 + 8 dígitos (ex.: (11) 98765-4321).';
  }
  return null;
}

export function normalizeBrazilianMobile(value) {
  return stripDigits(value);
}

export function formatBrazilianMobileInput(value) {
  const digits = stripDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function validateNumericCode(value, label = 'Código') {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return `${label} é obrigatório.`;
  if (!/^\d+$/.test(trimmed)) return `${label} deve conter apenas números.`;
  if (trimmed.length > 100) return `${label} deve ter no máximo 100 caracteres.`;
  return null;
}

export function validateAssunto(value) {
  const assunto = String(value ?? '').trim();
  if (!assunto) return 'Assunto é obrigatório.';
  if (assunto.length > 200) return 'Assunto deve ter no máximo 200 caracteres.';
  return null;
}

export function validateDescricao(value) {
  const descricao = String(value ?? '').trim();
  if (!descricao) return 'Descrição é obrigatória.';
  return null;
}

export function validateRegisterForm(form) {
  const errors = {};
  const nomeError = validateNome(form.nome);
  const emailError = validateEmail(form.email);
  const senhaError = validateSenha(form.senha);
  const setorError = validateSetor(form.setor);

  if (nomeError) errors.nome = nomeError;
  if (emailError) errors.email = emailError;
  if (senhaError) errors.senha = senhaError;
  if (setorError) errors.setor = setorError;

  return errors;
}

export function validateProfileForm(form) {
  const errors = {};
  const nomeError = validateNome(form.nome);
  const emailError = validateEmail(form.email);
  const setorError = validateSetor(form.setor);

  if (nomeError) errors.nome = nomeError;
  if (emailError) errors.email = emailError;
  if (setorError) errors.setor = setorError;

  return errors;
}

export function validateOpenChamadoForm(form) {
  const errors = {};
  const assuntoError = validateAssunto(form.assunto);
  const descricaoError = validateDescricao(form.descricao);
  const telefoneError = validateBrazilianMobile(form.telefoneContato);
  const codigoError = validateNumericCode(form.codigoAcessoRemoto, 'Código de acesso remoto');

  if (assuntoError) errors.assunto = assuntoError;
  if (descricaoError) errors.descricao = descricaoError;
  if (telefoneError) errors.telefoneContato = telefoneError;
  if (codigoError) errors.codigoAcessoRemoto = codigoError;

  return errors;
}
