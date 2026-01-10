import { type RequestOptions } from '@/api/api';
import { authClient } from '@/api/auth';

export type PaymentMethodType = 'PIX' | 'BANK_ACCOUNT' | 'CARD';

export type PaymentMethod = {
  id: string;
  type: PaymentMethodType;
  isDefault?: boolean;
  pixKey?: string;
  bankCode?: string;
  bankName?: string;
  agency?: string;
  accountNumber?: string;
  accountDigit?: string;
  accountType?: string;
  cardBrand?: string;
  cardLast4?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  cardHolderName?: string;
};

const requestWithAuth = async <T>(path: string, options: RequestOptions = {}) =>
  authClient.requestWithAuth<T>(path, options);

const normalizeMethods = (data: any): PaymentMethod[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.methods)) return data.methods;
  return [];
};

const getMethods = async (): Promise<PaymentMethod[]> => {
  const data = await requestWithAuth<any>('/payments/methods');
  return normalizeMethods(data);
};

const createMethod = async (payload: Record<string, any>): Promise<PaymentMethod | null> => {
  const data = await requestWithAuth<any>('/payments/methods', {
    method: 'POST',
    body: payload
  });
  if (data && typeof data === 'object' && data.id) return data as PaymentMethod;
  return null;
};

const deleteMethod = async (id: string) =>
  requestWithAuth(`/payments/methods/${id}`, { method: 'DELETE' });

export const paymentsClient = {
  getMethods,
  createMethod,
  deleteMethod
};
