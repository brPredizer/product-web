import { apiRequest, API_BASE_URL, type RequestOptions } from '@/api/api';

type AuthUser = {
  id: string | null;
  full_name?: string;
  fullName?: string;
  name?: string;
  username?: string;
  email?: string;
  role?: string;
  roles?: string[];
  admin_level?: number;
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
  const roles = Array.isArray(user.roles) ? user.roles : user.role ? [user.role] : [];
  const role = user.role || roles[0] || 'user';

  return {
    ...user,
    id,
    name: user.name || fullName || '',
    full_name: fullName || '',
    email: user.email || '',
    username: user.username || user.userName || '',
    avatar_url: user.avatar_url || user.avatarUrl || '',
    roles,
    role,
    admin_level: user.admin_level ?? 0,
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

const extractSession = (data: Record<string, any> | null): AuthSession => ({
  accessToken: data?.accessToken || data?.access_token || data?.token || null,
  refreshToken: data?.refreshToken || data?.refresh_token || null,
  user: data?.user || data?.profile || data?.account || null
});

const setSessionFromResponse = (data: Record<string, any> | null) => {
  const session = extractSession(data || {});
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
    if (allowRefresh && error?.status === 401 && getSession().refreshToken) {
      try {
        await refresh();
      } catch (refreshError) {
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

const signup = async (payload: Record<string, any>) =>
  request('/auth/signup', { method: 'POST', body: payload });

const login = async ({ email, password }: { email: string; password: string }) => {
  const data = await request('/auth/login', {
    method: 'POST',
    body: { email, password }
  });
  return setSessionFromResponse(data as Record<string, any>);
};

const loginWithGoogle = async (idToken: string) => {
  const data = await request('/auth/login/google', {
    method: 'POST',
    body: { idToken }
  });
  return setSessionFromResponse(data as Record<string, any>);
};

const refresh = async () => {
  const { refreshToken } = getSession();
  if (!refreshToken) {
    const error = new Error('No refresh token available.') as Error & { code?: string };
    error.code = 'missing_refresh_token';
    throw error;
  }
  const data = await request('/auth/refresh', {
    method: 'POST',
    body: { refreshToken }
  });
  return setSessionFromResponse(data as Record<string, any>);
};

const logout = async () => {
  const { refreshToken } = getSession();
  try {
    if (refreshToken) {
      await requestWithAuth(
        '/auth/logout',
        {
          method: 'POST',
          body: { refreshToken }
        },
        false
      );
    }
  } finally {
    clearSession();
  }
};

const forgotPassword = async (email: string) =>
  request('/auth/forgot-password', { method: 'POST', body: { email } });

const resetPassword = async (payload: {
  token: string;
  password: string;
  confirmPassword: string;
}) => request('/auth/reset-password', { method: 'POST', body: payload });

const verifyEmail = async (token: string) =>
  request('/auth/verify-email', { method: 'POST', body: { token } });

const getProfile = async () => {
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
  getSession,
  setSession,
  getProfile,
  updateProfile,
  updateAddress,
  updateAvatar,
  updateUser,
  clearSession,
  signup,
  login,
  loginWithGoogle,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  getUserSessions,
  revokeUserSession
};
