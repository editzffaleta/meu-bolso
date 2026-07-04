export const errorMessagesPt = {
  DEFAULT_API_ERROR: 'Ocorreu um erro inesperado na comunicação com o servidor.',
  INVALID_ARRAY: 'O valor deve ser uma lista.',
  INVALID_ITEM: 'Item inválido.',
  INVALID_OBJECT: 'O valor deve ser um objeto.',
  INVALID_VALUE: 'Valor inválido.',
  MAX_ITEMS: 'Máximo de {{max}} itens.',
  MIN_ITEMS: 'Mínimo de {{min}} itens.',
  REQUIRED_FIELD: 'Campo de preenchimento obrigatório.',
  SHELL_CONTEXT_PROVIDER_REQUIRED: 'useShellContext deve ser usado dentro de <ShellProvider>.',
  THEME_CONTEXT_PROVIDER_REQUIRED: 'useTheme deve ser usado dentro de <ThemeProvider>.',
  UNKNOWN_ERROR_CODE: 'Erro desconhecido: {{code}}',
  INTERNAL_SERVER_ERROR: 'Ocorreu um erro interno no servidor. Tente novamente mais tarde.',
  'user.name.required': 'O nome é obrigatório.',
  'user.name.min.length': 'O nome deve ter no mínimo 3 caracteres.',
  'user.name.max.length': 'O nome deve ter no máximo 80 caracteres.',
  'user.name.person.name': 'Informe um nome válido.',
  'user.email.required': 'O e-mail é obrigatório.',
  'user.email.email': 'Informe um e-mail válido.',
  'user.password.required': 'A senha é obrigatória.',
  'user.password.strong.password':
    'A senha deve ter no mínimo 8 caracteres, com letra maiúscula, minúscula, número e caractere especial.',
  'user.password.no.common.password': 'Essa senha é muito comum. Escolha outra senha.',
  'user.password.bcrypt.hash': 'Não foi possível processar a senha informada.',
  'user.email.already.registered': 'Este e-mail já está cadastrado.',
} as const;

export type ErrorMessageKey = keyof typeof errorMessagesPt;
export type ErrorMessages = Record<ErrorMessageKey, string>;
