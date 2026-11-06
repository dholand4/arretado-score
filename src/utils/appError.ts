// Erro com mensagem já pronta para exibir ao usuário.
export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AppError';
  }
}

const AUTH_MESSAGES: Record<string, string> = {
  invalid_credentials: 'E-mail ou senha incorretos.',
  user_banned: 'Usuário desativado. Fale com o administrador.',
  same_password: 'A nova senha precisa ser diferente da atual.',
  weak_password: 'Senha fraca demais. Use ao menos 8 caracteres.',
  over_request_rate_limit: 'Muitas tentativas. Aguarde um pouco e tente de novo.',
  reauthentication_needed: 'Entre novamente para trocar a senha.',
  session_not_found: 'Sua sessão expirou. Entre novamente.',
};

// Violações de unicidade (23505), pelo nome da constraint/índice.
const UNIQUE_MESSAGES: Record<string, string> = {
  competicoes_slug_key: 'Esse endereço (slug) já está em uso por outra competição.',
  jogadores_time_numero_key: 'Já existe um jogador com esse número neste time.',
  jogadores_competicao_documento_key: 'Esse documento já está cadastrado em outro jogador desta competição.',
  competicao_admins_pkey: 'Esse usuário já administra a competição.',
  categorias_estatistica_cestas_unico: 'Já existe uma estatística que conta esse tipo de cesta.',
};

interface ICodedError {
  code: string;
  message?: string;
}

function hasCode(error: unknown): error is ICodedError {
  return typeof error === 'object' && error !== null && typeof (error as { code?: unknown }).code === 'string';
}

export function getErrorMessage(error: unknown, fallback = 'Algo deu errado. Tente novamente.'): string {
  if (error instanceof AppError) return error.message;
  if (hasCode(error)) {
    if (AUTH_MESSAGES[error.code]) return AUTH_MESSAGES[error.code];
    const message = error.message ?? '';
    // raise exception nas funções/triggers do banco: a mensagem já está em português.
    if (error.code === 'P0001' && message) return message;
    if (error.code === '23505') {
      const constraint = Object.keys(UNIQUE_MESSAGES).find((name) => message.includes(name));
      return constraint ? UNIQUE_MESSAGES[constraint] : 'Esse registro já existe.';
    }
    if (error.code === '42501') return 'Você não tem permissão para esta ação.';
    if (error.code === '23514') return 'Algum valor está fora do permitido. Confira os campos.';
  }
  if (error instanceof TypeError && /fetch/i.test(error.message)) {
    return 'Não foi possível conectar ao servidor. Verifique sua conexão.';
  }
  return fallback;
}

// Falha de rede (sem internet ou servidor fora do ar), e não um erro de regra do banco.
export function isNetworkError(error: unknown): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  const message = error instanceof Error ? error.message : (error as { message?: unknown } | null)?.message;
  return typeof message === 'string' && /failed to fetch|networkerror|load failed|network request failed/i.test(message);
}
