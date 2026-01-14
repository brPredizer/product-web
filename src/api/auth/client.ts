import { apiRequest, API_BASE_URL, getRoleLevel, normalizeRoles, type RequestOptions } from '@/api/api';

type AuthUser = {
  id: string | null;
  full_name?: string;
  fullName?: string;
  name?: string;
  username?: string;
  email?: string;
  emailConfirmed?: boolean;
  isEmailConfirmed?: boolean;
  role?: string;
  roles?: string[];
  admin_level?: number;
  twoFactorEnabled?: boolean;
  two_factor_enabled?: boolean;
  is2faEnabled?: boolean;
  balance?: number;
  avatar_url?: string;
  avatarUrl?: string;
  pix_key?: string;
  address_zip?: string;
  address_street?: string;
  address_neighborhood?: string;
  address_number?: string;
  address_complement?: string;
  address_city?: string;
  address_state?: string;
  address_country?: string;
  phone_number?: string;
  cpf?: string;
  [key: string]: any;
};

type AuthSession = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
};

const isBrowser = typeof window !== 'undefined';

const STORAGE_KEYS = {
  access: 'predictx_access_token',
  refresh: 'predictx_refresh_token',
  user: 'predictx_user'
} as const;

const emitAuthEvent = () => {
  if (!isBrowser) return;
  window.dispatchEvent(new CustomEvent('predictx:auth-changed'));
};

const readStorage = (key: string): string | null => {
  if (!isBrowser) return null;
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    return null;
  }
};

const writeStorage = (key: string, value: string) => {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    // Ignore storage failures.
  }
};

const removeStorage = (key: string) => {
  if (!isBrowser) return;
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    // Ignore storage failures.
  }
};

const parseJson = <T,>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    return null;
  }
};

const normalizeUser = (user: Record<string, any> | null): AuthUser | null => {
  if (!user || typeof user !== 'object') return null;

  const personalData = user.personalData || user.personal_data || {};
  const address = personalData.address || user.address || {};
  const bankAccount = personalData.bankAccount || user.bankAccount || {};

  const firstName = user.first_name || user.firstName || '';
  const lastName = user.last_name || user.lastName || '';
  const inferredName = [firstName, lastName].filter(Boolean).join(' ').trim();

  const fullName = user.full_name || user.fullName || user.name || inferredName;
  const id =
    user.id ||
    user.userId ||
    user._id ||
    user.uid ||
    user.sub ||
    user.email ||
    null;
  const roles = normalizeRoles(user);
  const roleLevel = getRoleLevel({ roles, admin_level: user.admin_level ?? user.adminLevel });
  const role = roles[0] || 'USER';
  const emailConfirmed =
    typeof user.emailConfirmed === 'boolean'
      ? user.emailConfirmed
      : typeof user.email_confirmed === 'boolean'
        ? user.email_confirmed
        : typeof user.isEmailConfirmed === 'boolean'
          ? user.isEmailConfirmed
          : undefined;
  const twoFactorEnabled =
    typeof user.twoFactorEnabled === 'boolean'
      ? user.twoFactorEnabled
      : typeof user.two_factor_enabled === 'boolean'
        ? user.two_factor_enabled
        : typeof user.is2faEnabled === 'boolean'
          ? user.is2faEnabled
          : typeof user.isTwoFactorEnabled === 'boolean'
            ? user.isTwoFactorEnabled
            : undefined;

  return {
    ...user,
    id,
    name: user.name || fullName || '',
    full_name: fullName || '',
    email: user.email || '',
    emailConfirmed,
    twoFactorEnabled,
    is2faEnabled: typeof twoFactorEnabled === 'boolean' ? twoFactorEnabled : user.is2faEnabled,
    username: user.username || user.userName || '',
    avatar_url: user.avatar_url || user.avatarUrl || '',
    roles,
    role,
    admin_level: roleLevel,
    balance: typeof user.balance === 'number' ? user.balance : 0,
    cpf: user.cpf || personalData.cpf || '',
    phone_number: user.phone_number || personalData.phoneNumber || '',
    address_zip: user.address_zip || address.zipCode || '',
    address_street: user.address_street || address.street || '',
    address_neighborhood:
      user.address_neighborhood ||
      address.neighborhood ||
      address.Neighborhood ||
      address.bairro ||
      '',
    address_number: user.address_number || address.number || '',
    address_complement: user.address_complement || address.complement || address.complemento || '',
    address_city: user.address_city || address.city || '',
    address_state: user.address_state || address.state || '',
    address_country: user.address_country || address.country || '',
    pix_key: user.pix_key || bankAccount.pixKey || '',
    personalData,
    address,
    bankAccount
  };
};

const mergeUsers = (base: AuthUser | null, incoming: AuthUser | null) => {
  if (!incoming) return incoming;
  if (!base) return incoming;
  return { ...base, ...incoming };
};

const getSession = (): AuthSession => {
  const accessToken = readStorage(STORAGE_KEYS.access);
  const refreshToken = readStorage(STORAGE_KEYS.refresh);
  const user = parseJson<AuthUser>(readStorage(STORAGE_KEYS.user));
  return {
    accessToken,
    refreshToken,
    user: normalizeUser(user)
  };
};

const setSession = ({ accessToken, refreshToken, user }: Partial<AuthSession>): AuthSession => {
  const existing = getSession();
  const resolvedAccessToken = accessToken === undefined ? existing.accessToken : accessToken;
  const resolvedRefreshToken = refreshToken === undefined ? existing.refreshToken : refreshToken;
  const mergedUser = user === undefined ? existing.user : mergeUsers(existing.user, user);
  const normalizedUser = normalizeUser(mergedUser);

  if (resolvedAccessToken) {
    writeStorage(STORAGE_KEYS.access, resolvedAccessToken);
  } else if (resolvedAccessToken === null) {
    removeStorage(STORAGE_KEYS.access);
  }

  if (resolvedRefreshToken) {
    writeStorage(STORAGE_KEYS.refresh, resolvedRefreshToken);
  } else if (resolvedRefreshToken === null) {
    removeStorage(STORAGE_KEYS.refresh);
  }

  if (normalizedUser) {
    writeStorage(STORAGE_KEYS.user, JSON.stringify(normalizedUser));
  } else if (mergedUser === null) {
    removeStorage(STORAGE_KEYS.user);
  }

  emitAuthEvent();

  return {
    accessToken: resolvedAccessToken ?? null,
    refreshToken: resolvedRefreshToken ?? null,
    user: normalizedUser
  };
};

const extractSession = (data: Record<string, any> | null): AuthSession => {
  if (!data) return { accessToken: null, refreshToken: null, user: null };

  const maybe = (obj: any, ...keys: string[]) => {
    if (!obj || typeof obj !== 'object') return null;
    for (const k of keys) {
      if (k in obj && obj[k] !== undefined) return obj[k];
    }
    return null;
  };

  // Try several nesting patterns so client tolerates different backend shapes
  const accessToken =
    maybe(data, 'accessToken', 'access_token', 'token') || maybe(data?.data, 'accessToken', 'access_token', 'token');
  const refreshToken =
    maybe(data, 'refreshToken', 'refresh_token') || maybe(data?.data, 'refreshToken', 'refresh_token');

  const userCandidate =
    maybe(data, 'user', 'profile', 'account') ||
    maybe(data, 'data') ||
    maybe(data, 'result') ||
    maybe(data?.data, 'user', 'profile', 'account') ||
    null;

  // If nothing found yet, check if the root object looks like a user (common when
  // apiRequest already returned payload.data). Detect by presence of id/email/name/username.
  const looksLikeUser = (obj: any) => {
    if (!obj || typeof obj !== 'object') return false;
    return (
      'id' in obj ||
      'email' in obj ||
      'username' in obj ||
      'userName' in obj ||
      'name' in obj ||
      'full_name' in obj ||
      'fullName' in obj
    );
  };

  const finalUser = userCandidate ?? (looksLikeUser(data) ? data : null);

  return {
    accessToken: accessToken ?? null,
    refreshToken: refreshToken ?? null,
    user: finalUser ?? null
  };
};

const setSessionFromResponse = (data: Record<string, any> | null) => {
  if (!data || typeof data !== 'object') {
    return getSession();
  }
  const session = extractSession(data || {});
  const hasSessionPayload = Boolean(session.accessToken || session.refreshToken || session.user);
  if (!hasSessionPayload) {
    return getSession();
  }
  return setSession(session);
};

const clearSession = () => {
  removeStorage(STORAGE_KEYS.access);
  removeStorage(STORAGE_KEYS.refresh);
  removeStorage(STORAGE_KEYS.user);
  emitAuthEvent();
};

const getAuthorizationHeader = (): Record<string, string> => {
  const { accessToken } = getSession();
  if (!accessToken) return {};
  return { Authorization: `Bearer ${accessToken}` };
};

const request = async <T>(path: string, options?: RequestOptions) => apiRequest<T>(path, options);

const requestWithFallback = async <T>(
  primaryPath: string,
  fallbackPath: string | null,
  options?: RequestOptions
) => {
  try {
    return await request<T>(primaryPath, options);
  } catch (error: any) {
    if (fallbackPath && (error?.status === 404 || error?.status === 405)) {
      return request<T>(fallbackPath, options);
    }
    throw error;
  }
};

const requestWithAuth = async <T>(
  path: string,
  options: RequestOptions = {},
  allowRefresh = true
) => {
  const headers = {
    ...(options.headers || {}),
    ...getAuthorizationHeader()
  };

  try {
    return await apiRequest<T>(path, { ...options, headers });
  } catch (error: any) {
    if (allowRefresh && error?.status === 401) {
      try {
        await refresh();
      } catch (refreshError) {
        // If refresh fails, clear local session to avoid keeping invalid tokens.
        try {
          clearSession();
        } catch (e) {}
        throw error;
      }
      const retryHeaders = {
        ...(options.headers || {}),
        ...getAuthorizationHeader()
      };
      return apiRequest<T>(path, { ...options, headers: retryHeaders });
    }
    throw error;
  }
};

const buildQueryString = (params: Record<string, string | boolean | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) return;
    search.set(key, String(value));
  });
  return search.toString();
};

const getManageInfo = async () => {
  // Prefer the canonical /users/me endpoint, fallback to /auth/manage/info for backwards compatibility.
  let data: Record<string, any> | null = null;
  try {
    data = await requestWithAuth<Record<string, any>>('/users/me');
  } catch (err: any) {
    // if users/me not available, fallback
    try {
      // Important: when cookie-based auth is used, call the endpoint without
      // adding Authorization header so the server can rely on cookies.
      data = await request<Record<string, any>>('/auth/manage/info');
    } catch (err2) {
      throw err; // rethrow original
    }
  }
  if (!data || typeof data !== 'object') return null;
  const baseUser = data.user || data.profile || data.account || data;
  const normalized = normalizeUser(baseUser);
  if (!normalized) return null;
  const emailConfirmed =
    typeof data.emailConfirmed === 'boolean'
      ? data.emailConfirmed
      : typeof data.email_confirmed === 'boolean'
        ? data.email_confirmed
        : typeof data.isEmailConfirmed === 'boolean'
          ? data.isEmailConfirmed
          : normalized.emailConfirmed;
  const twoFactorEnabled =
    typeof data.twoFactorEnabled === 'boolean'
      ? data.twoFactorEnabled
      : typeof data.two_factor_enabled === 'boolean'
        ? data.two_factor_enabled
        : typeof data.is2faEnabled === 'boolean'
          ? data.is2faEnabled
          : normalized.twoFactorEnabled;
  const mergedUser: AuthUser = {
    ...normalized,
    emailConfirmed,
    twoFactorEnabled,
    is2faEnabled:
      typeof twoFactorEnabled === 'boolean' ? twoFactorEnabled : normalized.is2faEnabled
  };
  setSession({ user: mergedUser });
  return mergedUser;
};

const signUp = async (payload: Record<string, any>) => {
  const data = await requestWithFallback('/auth/sign-up', '/auth/signup', {
    method: 'POST',
    body: payload
  });
  return setSessionFromResponse(data as Record<string, any>);
};

const signIn = async ({
  email,
  password,
  useCookies = true,
  useSessionCookies
}: {
  email: string;
  password: string;
  useCookies?: boolean;
  useSessionCookies?: boolean;
}) => {
  const query = buildQueryString({
    useCookies,
    useSessionCookies
  });
  const path = query ? `/auth/sign-in?${query}` : '/auth/sign-in';
  const data = await requestWithFallback(path, path, {
    method: 'POST',
    body: { email, password }
  });
  const session = setSessionFromResponse(data as Record<string, any>);
  if (!session?.user) {
    try {
      const info = await getManageInfo();
      if (info) {
        return setSession({ user: info });
      }
    } catch (error) {
      // Ignore manage info failures after sign in.
    }
  }
  return getSession();
};

const googleSignIn = async (
  idToken: string,
  options?: { useCookies?: boolean; useSessionCookies?: boolean }
) => {
  const useCookies = options?.useCookies ?? true;
  const useSessionCookies = options?.useSessionCookies;
  const query = buildQueryString({ useCookies, useSessionCookies });
  const path = query ? `/auth/sign-in/google?${query}` : '/auth/sign-in/google';
  const data = await requestWithFallback(path, path, {
    method: 'POST',
    body: { idToken }
  });
  let session = setSessionFromResponse(data as Record<string, any>);

  // Note: do NOT perform an automatic fallback to `useCookies=false` here.
  // The front-end should explicitly choose cookie or token flow to avoid
  // duplicate requests and mixed auth strategies.

  if (!session?.user) {
    try {
      const info = await getManageInfo();
      if (info) {
        return setSession({ user: info });
      }
    } catch (error) {
      // Ignore manage info failures after social sign in.
    }
  }

  return getSession();
};

const refresh = async () => {
  const { refreshToken } = getSession();
  // Debug: log whether we have a stored refresh token
  try {
    // eslint-disable-next-line no-console
    console.debug('[auth] refresh() - hasStoredRefreshToken=', Boolean(refreshToken));
  } catch (e) {}

  const body = refreshToken ? { refreshToken } : {};
  try {
    const data = await request('/auth/refresh', {
      method: 'POST',
      body,
      credentials: 'include'
    });
    return setSessionFromResponse(data as Record<string, any>);
  } catch (err: any) {
    // If refresh fails (expired/invalid refresh token), clear local session.
    try {
      clearSession();
    } catch (e) {}
    throw err;
  }
};

const signOut = async () => {
  const { refreshToken } = getSession();
  try {
    try {
      await requestWithAuth('/auth/sign-out', { method: 'POST' }, false);
      return;
    } catch (error: any) {
      if (error?.status !== 404 && error?.status !== 405) {
        throw error;
      }
    }

    await requestWithAuth(
      '/auth/logout',
      {
        method: 'POST',
        body: refreshToken ? { refreshToken } : undefined
      },
      false
    );
  } finally {
    clearSession();
  }
};

const update2fa = async (payload: Record<string, any>) => {
  await requestWithAuth('/auth/manage/2fa', { method: 'POST', body: payload });
  return getManageInfo();
};

const changePassword = async (payload: {
  oldPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}) => {
  await requestWithAuth('/auth/manage/password', { method: 'POST', body: payload });
  // Optionally refresh user info after password change
  try {
    await getManageInfo();
  } catch (e) {
    // ignore
  }
  return { success: true };
};

const confirmEmail = async ({ userId, code }: { userId: string; code: string }) => {
  const query = buildQueryString({ userId, code });
  const path = query ? `/auth/confirmEmail?${query}` : '/auth/confirmEmail';
  return request(path, { method: 'POST' });
};

const resendConfirmationEmail = async (payload: Record<string, any>) =>
  request('/auth/resendConfirmationEmail', { method: 'POST', body: payload });

const forgotPassword = async (email: string) =>
  requestWithFallback('/auth/forgotPassword', '/auth/forgot-password', {
    method: 'POST',
    body: { email }
  });

const resetPassword = async (payload: {
  email?: string;
  code?: string;
  resetCode?: string;
  password?: string;
  newPassword?: string;
  confirmPassword?: string;
}) =>
  requestWithFallback('/auth/resetPassword', '/auth/reset-password', {
    method: 'POST',
    body: payload
  });

const verifyResetCode = async (payload: { email: string; code?: string; resetCode?: string }) => {
  const resetCode = payload.resetCode ?? payload.code ?? '';
  const body = { email: payload.email, resetCode };
  return requestWithFallback('/auth/verifyResetCode', '/auth/verify-reset-code', {
    method: 'POST',
    body
  });
};

const verifyEmail = async (token: string) =>
  request('/auth/verify-email', { method: 'POST', body: { token } });

const getProfile = async () => {
  try {
    const info = await getManageInfo();
    if (info) return info;
  } catch (error: any) {
    if (error?.status !== 404 && error?.status !== 405) {
      throw error;
    }
  }
  const data = await requestWithAuth<Record<string, any>>('/users/me');
  const normalized = normalizeUser(data);
  if (normalized) {
    setSession({ user: normalized });
  }
  return normalized;
};

const updateProfile = async (payload: Record<string, any>) => {
  const data = await requestWithAuth<Record<string, any>>('/users/me', {
    method: 'PUT',
    body: payload
  });
  const normalized = normalizeUser(data);
  if (normalized) {
    setSession({ user: normalized });
  }
  return normalized;
};

const updateAddress = async (payload: Record<string, any>) => {
  const data = await requestWithAuth<Record<string, any>>('/users/me/address', {
    method: 'PUT',
    body: payload
  });
  const normalized = normalizeUser(data);
  if (normalized) {
    setSession({ user: normalized });
  }
  return normalized;
};

const updateAvatar = async (avatarUrl: string | null) => {
  const data = await requestWithAuth<Record<string, any>>('/users/me/avatar', {
    method: 'PUT',
    body: { avatarUrl }
  });
  const normalized = normalizeUser(data);
  if (normalized) {
    setSession({ user: normalized });
  }
  return normalized;
};

const getUserSessions = async () =>
  requestWithAuth<Record<string, any>>('/users/me/sessions');

const revokeUserSession = async (sessionId: string) =>
  requestWithAuth(`/users/me/sessions/${sessionId}`, { method: 'DELETE' });

const buildAddressPayload = (updates: Record<string, any>, sessionUser: AuthUser | null) => {
  const addressInput = updates.address || {};
  const hasAddressUpdate =
    'address' in updates ||
    'address_zip' in updates ||
    'address_street' in updates ||
    'address_neighborhood' in updates ||
    'address_number' in updates ||
    'address_complement' in updates ||
    'address_city' in updates ||
    'address_state' in updates ||
    'address_country' in updates ||
    'zipCode' in addressInput ||
    'street' in addressInput ||
    'neighborhood' in addressInput ||
    'number' in addressInput ||
    'complement' in addressInput ||
    'city' in addressInput ||
    'state' in addressInput ||
    'country' in addressInput;

  if (!hasAddressUpdate) return null;

  return {
    zipCode:
      addressInput.zipCode ??
      updates.address_zip ??
      sessionUser?.address_zip ??
      sessionUser?.address?.zipCode ??
      '',
    street:
      addressInput.street ??
      updates.address_street ??
      updates.street ??
      sessionUser?.address_street ??
      sessionUser?.address?.street ??
      '',
    neighborhood:
      addressInput.neighborhood ??
      updates.address_neighborhood ??
      updates.neighborhood ??
      sessionUser?.address_neighborhood ??
      sessionUser?.address?.neighborhood ??
      '',
    number:
      addressInput.number ??
      updates.address_number ??
      sessionUser?.address_number ??
      sessionUser?.address?.number ??
      '',
    complement:
      addressInput.complement ??
      updates.address_complement ??
      sessionUser?.address_complement ??
      sessionUser?.address?.complement ??
      '',
    city:
      addressInput.city ??
      updates.address_city ??
      sessionUser?.address_city ??
      sessionUser?.address?.city ??
      '',
    state:
      addressInput.state ??
      updates.address_state ??
      sessionUser?.address_state ??
      sessionUser?.address?.state ??
      '',
    country:
      addressInput.country ??
      updates.address_country ??
      sessionUser?.address_country ??
      sessionUser?.address?.country ??
      'BR'
  };
};

const updateUser = async (updates: Record<string, any>) => {
  const session = getSession();
  if (!session.user) {
    const error = new Error('No user in session.') as Error & { code?: string };
    error.code = 'missing_user';
    throw error;
  }

  const serverKeys = new Set([
    'full_name',
    'fullName',
    'name',
    'username',
    'email',
    'password',
    'confirmPassword',
    'cpf',
    'phoneNumber',
    'phone_number',
    'address',
    'address_zip',
    'street',
    'neighborhood',
    'address_street',
    'address_neighborhood',
    'address_number',
    'address_complement',
    'address_city',
    'address_state',
    'address_country',
    'bankAccount',
    'bank_account',
    'pix_key',
    'bank_account_pix_key',
    'avatar_url',
    'avatarUrl'
  ]);

  const localUpdates = Object.fromEntries(
    Object.entries(updates).filter(([key]) => !serverKeys.has(key))
  );

  const profilePayload: Record<string, any> = {};
  const addressPayload = buildAddressPayload(updates, session.user);

  if ('full_name' in updates || 'fullName' in updates || 'name' in updates) {
    profilePayload.name = updates.full_name ?? updates.fullName ?? updates.name ?? '';
  }
  if ('username' in updates) {
    profilePayload.username = updates.username ?? '';
  }
  if ('email' in updates) {
    profilePayload.email = updates.email ?? '';
  }
  if ('password' in updates) {
    profilePayload.password = updates.password ?? null;
  }
  if ('confirmPassword' in updates) {
    profilePayload.confirmPassword = updates.confirmPassword ?? null;
  }
  if ('cpf' in updates) {
    profilePayload.cpf = updates.cpf ?? null;
  }
  if ('phoneNumber' in updates || 'phone_number' in updates) {
    profilePayload.phoneNumber = updates.phoneNumber ?? updates.phone_number ?? null;
  }
  const avatarUrl =
    'avatar_url' in updates || 'avatarUrl' in updates
      ? updates.avatar_url ?? updates.avatarUrl ?? null
      : undefined;
  const normalizedAvatarUrl =
    typeof avatarUrl === 'string' ? avatarUrl.trim() : avatarUrl;
  const currentAvatar = session.user.avatar_url || session.user.avatarUrl || '';
  const shouldUpdateAvatar =
    normalizedAvatarUrl &&
    typeof normalizedAvatarUrl === 'string' &&
    normalizedAvatarUrl !== currentAvatar;

  let nextUser: AuthUser | null = session.user;
  const shouldUpdateProfile = Object.keys(profilePayload).length > 0;

  if (shouldUpdateProfile) {
    profilePayload.name =
      profilePayload.name ?? session.user.full_name ?? session.user.name ?? '';
    profilePayload.email = profilePayload.email ?? session.user.email ?? '';

    const updatedProfile = await updateProfile(profilePayload);
    nextUser = mergeUsers(nextUser, updatedProfile);
  }

  if (addressPayload) {
    const updatedAddress = await updateAddress(addressPayload);
    nextUser = mergeUsers(nextUser, updatedAddress);
  }

  if (shouldUpdateAvatar) {
    const updatedAvatar = await updateAvatar(normalizedAvatarUrl);
    nextUser = mergeUsers(nextUser, updatedAvatar);
  }

  if (Object.keys(localUpdates).length > 0) {
    const mergedLocal = normalizeUser({ ...(nextUser || {}), ...localUpdates });
    if (mergedLocal) {
      nextUser = setSession({ user: mergedLocal }).user;
    }
  } else if (nextUser) {
    setSession({ user: nextUser });
  }

  return nextUser;
};

export const authClient = {
  API_BASE_URL,
  request,
  requestWithAuth,
  getSession,
  setSession,
  getManageInfo,
  getProfile,
  updateProfile,
  updateAddress,
  updateAvatar,
  updateUser,
  clearSession,
  signUp,
  signIn,
  signOut,
  googleSignIn,
  refresh,
  confirmEmail,
  changePassword,
  resendConfirmationEmail,
  forgotPassword,
  resetPassword,
  verifyResetCode,
  update2fa,
  signup: signUp,
  signin: signIn,
  logout: signOut,
  loginWithGoogle: googleSignIn,
  verifyEmail,
  getUserSessions,
  revokeUserSession
};
