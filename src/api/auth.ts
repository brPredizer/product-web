import * as client from './auth/client';
import { apiRequest, AuthResponse, API_BASE_URL } from './api';

export const authClient = client.authClient;

export type SignUpPayload = {
  email: string;
  password: string;
  name?: string;
};

export type SignInPayload = {
  email?: string;
  username?: string;
  password: string;
  remember?: boolean;
  useCookies?: boolean;
};

export type ForgotPasswordPayload = { email: string };
export type ResetPasswordPayload = { token: string; password: string };

export const signUp = (payload: SignUpPayload) => authClient.signUp(payload);

export const signIn = (payload: SignInPayload) => authClient.signIn(payload as any);

export const signOut = () => authClient.signOut();

export const refresh = () => authClient.refresh();

export const confirmEmail = (userId: string, code: string) =>
  authClient.confirmEmail({ userId, code } as any);

export const resendConfirmationEmail = (email: string) =>
  authClient.resendConfirmationEmail({ email } as any);

export const forgotPassword = (payload: ForgotPasswordPayload) => authClient.forgotPassword(payload as any);

export const resetPassword = (payload: ResetPasswordPayload) => authClient.resetPassword(payload as any);

export const verifyResetCode = (payload: { email: string; code: string }) =>
  authClient.verifyResetCode(payload as any);

export const googleSignInUrl = (redirectUri?: string) => {
  const url = `${API_BASE_URL}/auth/oauth2/google`;
  if (!redirectUri) return url;
  return `${url}?redirect=${encodeURIComponent(redirectUri)}`;
};

export const getManageInfo = () => authClient.getManageInfo();

export const update2fa = (payload: Record<string, any>) => authClient.update2fa(payload as any);

export const changePassword = (payload: { oldPassword?: string; newPassword?: string; confirmPassword?: string }) =>
  authClient.changePassword(payload as any);

export default authClient;
