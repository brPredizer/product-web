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

// Create MercadoPago PIX payment via backend
const createMercadoPagoPix = async (payload: {
  amount: number;
  description?: string;
  buyerEmail?: string;
  orderId?: string;
}) => {
  const data = await requestWithAuth<any>('/payments/mercadopago/pix', {
    method: 'POST',
    body: payload
  });

  if (!data) return null;

  return {
    paymentId: data.paymentId ?? data.id ?? data.payment_id ?? null,
    qrBase64: data.qrBase64 ?? data.qr_base64 ?? data.qr_image_base64 ?? null,
    qrCode: data.qrCode ?? data.qr_code ?? data.payload ?? data.payloadString ?? null,
    expiresAt: data.expiresAt ?? data.date_of_expiration ?? data.expires_at ?? null,
    status: data.status ?? data.Status ?? null,
    _raw: data
  } as any;
};

const getMercadoPagoStatus = async (paymentId: string | number) => {
  const id = String(paymentId);
  const data = await requestWithAuth<any>(`/payments/mercadopago/status/${encodeURIComponent(id)}`);
  if (!data) return null;
  return {
    paymentId: data.paymentId ?? data.id ?? data.payment_id ?? id,
    status: data.status ?? data.Status ?? null,
    _raw: data
  } as any;
};

export const paymentsClient = {
  getMethods,
  createMethod,
  deleteMethod,
  createMercadoPagoPix,
  getMercadoPagoStatus
};
