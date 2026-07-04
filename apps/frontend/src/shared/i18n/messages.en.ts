import type { ErrorMessages } from './messages.pt';

export const errorMessagesEn: ErrorMessages = {
  DEFAULT_API_ERROR: 'An unexpected error occurred while contacting the server.',
  INVALID_ARRAY: 'The value must be an array.',
  INVALID_ITEM: 'Invalid item.',
  INVALID_OBJECT: 'The value must be an object.',
  INVALID_VALUE: 'Invalid value.',
  MAX_ITEMS: 'Maximum of {{max}} items.',
  MIN_ITEMS: 'Minimum of {{min}} items.',
  REQUIRED_FIELD: 'This field is required.',
  SHELL_CONTEXT_PROVIDER_REQUIRED: 'useShellContext must be used within <ShellProvider>.',
  THEME_CONTEXT_PROVIDER_REQUIRED: 'useTheme must be used within <ThemeProvider>.',
  UNKNOWN_ERROR_CODE: 'Unknown error: {{code}}',
  INTERNAL_SERVER_ERROR: 'An internal server error occurred. Please try again later.',
  'user.name.required': 'Name is required.',
  'user.name.min.length': 'Name must be at least 3 characters long.',
  'user.name.max.length': 'Name must be at most 80 characters long.',
  'user.name.person.name': 'Please enter a valid name.',
  'user.email.required': 'Email is required.',
  'user.email.email': 'Please enter a valid email.',
  'user.password.required': 'Password is required.',
  'user.password.strong.password':
    'Password must be at least 8 characters long and include uppercase, lowercase, number and special character.',
  'user.password.no.common.password': 'This password is too common. Please choose another one.',
  'user.password.bcrypt.hash': 'Unable to process the provided password.',
  'user.email.already.registered': 'This email is already registered.',
};
