export type RequestOptions = {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  credentials?: RequestCredentials;
};

export type ApiError = Error & { status?: number; code?: string; payload?: any };

export type ApiResponse<T> = {
  data: T;
  meta?: any;
};

export type ProblemDetails = {
  title?: string;
  detail?: string;
  status?: number;
  type?: string;
  instance?: string;
  [key: string]: any;
};

export type UserRole = 'USER' | 'ADMIN_L1' | 'ADMIN_L2' | 'ADMIN_L3';

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: Record<string, any>;
};

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5280/api/v1';

const parseResponse = async (response: Response) => {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
};

const buildError = (response: Response, payload: any): ApiError => {
  // If the backend returned ValidationProblemDetails, `errors` is an object
  // mapping field -> array of messages. Flatten that into a single string.
  let validationMessage: string | null = null;
  if (payload?.errors && typeof payload.errors === 'object' && !Array.isArray(payload.errors)) {
    try {
      const first = Object.values(payload.errors)[0];
      if (Array.isArray(first) && first.length > 0) {
        validationMessage = String(first[0]);
      } else if (typeof first === 'string') {
        validationMessage = first;
      }
    } catch (e) {
      validationMessage = null;
    }
  }

  let message =
    payload?.detail ||
    payload?.message ||
    validationMessage ||
    payload?.error?.message ||
    payload?.title ||
    `Request failed (${response.status})`;

  // If the backend returned a plain string (e.g. "invalid_credentials"), prefer it
  if (typeof payload === 'string' && payload.trim()) {
    message = String(payload).trim();
  }

  // Map common backend error codes/messages to PT-BR for consistent UI display
  const lookup = (key?: string | null) => (key ? String(key).trim().toLowerCase() : '');
  const discovered = lookup(payload) || lookup(payload?.code) || lookup(payload?.title) || lookup(message) || lookup(payload?.error?.code);

  const ERROR_MAP: Record<string, string> = {
    invalid_credentials: 'E-mail ou senha inválidos.',
    user_locked_out: 'Conta bloqueada. Tente recuperar a senha ou contate o suporte.',
    user_not_found: 'Conta não encontrada para este e-mail.',
    account_disabled: 'Conta desativada. Contate o suporte.',
    too_many_requests: 'Muitas tentativas. Aguarde e tente novamente.',
    invalid_password: 'Senha inválida. Verifique requisitos de formato.',
    password_mismatch: 'Senha atual não confere com a fornecida.',
    confirm_password_mismatch: 'A confirmação não coincide com a nova senha.',
    invalid_token: 'Token inválido.',
    reset_code_invalid: 'Código de reset inválido.',
    reset_code_expired: 'Código de reset expirado.',
    missing_current_password: 'Informe sua senha atual para alterar a senha.',
    email_unconfirmed: 'E-mail não confirmado. Verifique sua caixa de entrada.'
  };

  if (discovered && ERROR_MAP[discovered]) {
    message = ERROR_MAP[discovered];
  } else {
    // Fallback: try to match substrings
    const subs = discovered;
    if (subs.includes('invalid_credentials')) message = ERROR_MAP.invalid_credentials;
    else if (subs.includes('locked') || subs.includes('lockout') || subs.includes('user_locked_out')) message = ERROR_MAP.user_locked_out;
    else if (subs.includes('not found')) message = ERROR_MAP.user_not_found;
    else if (subs.includes('too_many')) message = ERROR_MAP.too_many_requests;
  }
  const error = new Error(message) as ApiError;
  error.status = response.status;
  error.code = typeof payload === 'string' ? String(payload) : (payload?.title || payload?.code || payload?.error?.code || payload?.error);
  error.payload = payload;
  return error;
};

export const apiRequest = async <T>(
  path: string,
  { method = 'GET', body, headers, signal, credentials }: RequestOptions = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${path}`;
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers || {})
  };

  const options: RequestInit = {
    method,
    headers: requestHeaders,
    signal,
    credentials: credentials ?? 'include'
  };
  if (body !== undefined) {
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const payload = await parseResponse(response);

  if (!response.ok) {
    throw buildError(response, payload);
  }

  return (payload?.data ?? payload) as T;
};

export const createIdempotencyKey = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `idem-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

type RoleInput =
  | { roles?: string[] | null; role?: string | null; admin_level?: number | null; adminLevel?: number | null }
  | string[]
  | string
  | null
  | undefined;

const ROLE_LEVELS: Record<UserRole, number> = {
  USER: 0,
  ADMIN_L1: 1,
  ADMIN_L2: 2,
  ADMIN_L3: 3
};

const normalizeRoleValue = (value: string | null | undefined): UserRole | null => {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  if (normalized === 'USER') return 'USER';
  if (normalized === 'ADMIN_L1') return 'ADMIN_L1';
  if (normalized === 'ADMIN_L2') return 'ADMIN_L2';
  if (normalized === 'ADMIN_L3') return 'ADMIN_L3';
  return null;
};

const expandRoleHierarchy = (roles: UserRole[]): UserRole[] => {
  const set = new Set<UserRole>();
  roles.forEach((role) => {
    set.add(role);
    if (role === 'ADMIN_L3') {
      set.add('ADMIN_L2');
      set.add('ADMIN_L1');
    } else if (role === 'ADMIN_L2') {
      set.add('ADMIN_L1');
    }
  });

  if (set.size === 0) {
    set.add('USER');
  }

  return Array.from(set).sort((a, b) => ROLE_LEVELS[b] - ROLE_LEVELS[a]);
};

export const normalizeRoles = (input?: RoleInput): UserRole[] => {
  const values: string[] = [];
  let hasLegacyAdmin = false;

  if (Array.isArray(input)) {
    input.forEach((value) => {
      if (typeof value !== 'string' || !value) return;
      if (value.trim().toLowerCase() === 'admin') {
        hasLegacyAdmin = true;
      } else {
        values.push(value);
      }
    });
  } else if (typeof input === 'string') {
    if (input.trim().toLowerCase() === 'admin') {
      hasLegacyAdmin = true;
    } else {
      values.push(input);
    }
  } else if (input && typeof input === 'object') {
    if (Array.isArray(input.roles)) {
      input.roles.forEach((value) => {
        if (typeof value !== 'string' || !value) return;
        if (value.trim().toLowerCase() === 'admin') {
          hasLegacyAdmin = true;
        } else {
          values.push(value);
        }
      });
    }
    if (typeof input.role === 'string' && input.role) {
      if (input.role.trim().toLowerCase() === 'admin') {
        hasLegacyAdmin = true;
      } else {
        values.push(input.role);
      }
    }
  }

  const normalized = values
    .map((value) => normalizeRoleValue(value))
    .filter(Boolean) as UserRole[];

  if (normalized.length === 0) {
    const adminLevel =
      input && typeof input === 'object' && !Array.isArray(input)
        ? typeof input.admin_level === 'number'
          ? input.admin_level
          : typeof input.adminLevel === 'number'
            ? input.adminLevel
            : null
        : null;

    if (adminLevel && adminLevel > 0) {
      const clamped = Math.min(3, Math.max(1, adminLevel));
      normalized.push(`ADMIN_L${clamped}` as UserRole);
    } else if (hasLegacyAdmin) {
      normalized.push('ADMIN_L3');
    }
  }

  if (normalized.length === 0) {
    normalized.push('USER');
  }

  return expandRoleHierarchy(normalized);
};

export const getRoleLevel = (input?: RoleInput): number => {
  const roles = normalizeRoles(input);
  return roles.reduce((max, role) => Math.max(max, ROLE_LEVELS[role] ?? 0), 0);
};

export const hasRole = (input: RoleInput, role: UserRole): boolean =>
  normalizeRoles(input).includes(role);

export const isAdminL1 = (input?: RoleInput): boolean => getRoleLevel(input) >= 1;
export const isAdminL2 = (input?: RoleInput): boolean => getRoleLevel(input) >= 2;
export const isAdminL3 = (input?: RoleInput): boolean => getRoleLevel(input) >= 3;
