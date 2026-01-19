import { type RequestOptions } from '@/app/api/api';
import { authClient } from '@/app/api/auth';

export type PaymentMethodType = 'PIX' | 'BANK_ACCOUNT' | 'CARD';

export type PaymentMethod = {
  id: string;
  type?: PaymentMethodType | string;
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
  mpCustomerId?: string;
  mpCardId?: string;
  mpPaymentMethodId?: string;
};

const requestWithAuth = async <T>(path: string, options: RequestOptions = {}) =>
  authClient.requestWithAuth<T>(path, options);

const getMpDeviceId = () => {
  if (typeof window === 'undefined') return '';
  return (window as any).MP_DEVICE_SESSION_ID || '';
};

const withDeviceId = (options: RequestOptions = {}, deviceId?: string) => {
  const resolvedDeviceId = deviceId || getMpDeviceId();
  if (!resolvedDeviceId) return options;
  return {
    ...options,
    headers: {
      ...(options.headers || {}),
      'X-meli-session-id': resolvedDeviceId
    }
  };
};

const requestWithAuthFallback = async <T>(
  primaryPath: string,
  fallbackPath: string | null,
  options: RequestOptions = {}
) => {
  try {
    return await requestWithAuth<T>(primaryPath, options);
  } catch (error: any) {
    if (fallbackPath && (error?.status === 404 || error?.status === 405)) {
      return await requestWithAuth<T>(fallbackPath, options);
    }
    throw error;
  }
};

const requestWithAuthDevice = async <T>(
  path: string,
  options: RequestOptions = {},
  deviceId?: string
) => requestWithAuth<T>(path, withDeviceId(options, deviceId));

const requestWithAuthFallbackDevice = async <T>(
  primaryPath: string,
  fallbackPath: string | null,
  options: RequestOptions = {},
  deviceId?: string
) => requestWithAuthFallback<T>(primaryPath, fallbackPath, withDeviceId(options, deviceId));

const normalizeMethods = (data: any): PaymentMethod[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.methods)) return data.methods;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
  const data = await requestWithAuthFallbackDevice<any>('/payments/methods', '/payment-methods');
  return normalizeMethods(data);
};

const createMethod = async (payload: Record<string, any>): Promise<PaymentMethod | null> => {
  const data = await requestWithAuthFallbackDevice<any>(
    '/payments/methods',
    '/payment-methods',
    {
      method: 'POST',
      body: payload
    },
    payload?.deviceId
  );
  if (data && typeof data === 'object' && data.id) return data as PaymentMethod;
  return null;
};

const deleteMethod = async (id: string) =>
  requestWithAuthFallback(`/payments/methods/${id}`, `/payment-methods/${id}`, { method: 'DELETE' });

type MpPayer = {
  email: string;
  cardholderName?: string;
  identification?: { type: string; number: string };
};

export type MpSavedCardRequest = {
  payer: MpPayer;
  token: string;
  paymentMethodId?: string;
  issuerId?: string;
  deviceId?: string;
};

export type MpOrderCardRequest = {
  orderId: string;
  amount: number;
  token: string;
  paymentMethodId: string;
  installments?: number;
  payer?: MpPayer;
  deviceId?: string;
  mpCardId?: string;
};

const saveMercadoPagoCard = async (payload: MpSavedCardRequest & Record<string, any>) => {
  const body = payload.type ? payload : { ...payload, type: 'CARD' };
  return requestWithAuthFallbackDevice<any>(
    '/payments/methods',
    '/payment-methods',
    {
      method: 'POST',
      body
    },
    payload?.deviceId
  );
};

const createMercadoPagoOrderWithCard = async (payload: MpOrderCardRequest) => {
  return requestWithAuthDevice<any>(
    '/payments/mercadopago/orders/card',
    {
      method: 'POST',
      body: payload
    },
    payload.deviceId
  );
};

// Create MercadoPago PIX payment via backend
const createMercadoPagoPix = async (payload: {
  amount: number;
  description?: string;
  buyerEmail?: string;
  orderId?: string;
  deviceId?: string;
}) => {
  const data = await requestWithAuthDevice<any>(
    '/payments/mercadopago/pix',
    {
      method: 'POST',
      body: payload
    },
    payload.deviceId
  );

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

const getMercadoPagoOrderStatus = async (orderIdOrMpId: string) => {
  const id = encodeURIComponent(String(orderIdOrMpId));
  const data = await requestWithAuth<any>(`/payments/mercadopago/orders/${id}/status`);
  if (!data) return null;
  return {
    orderId: data.orderId ?? data.order_id ?? orderIdOrMpId,
    providerOrderId: data.providerOrderId ?? data.provider_order_id ?? null,
    providerPaymentId: data.providerPaymentId ?? data.provider_payment_id ?? null,
    status: data.status ?? data.Status ?? null,
    statusDetail: data.statusDetail ?? data.status_detail ?? null,
    isFinal: data.isFinal ?? data.is_final ?? null,
    amount: data.amount ?? data.total_amount ?? null,
    _raw: data
  } as any;
};

export const paymentsClient = {
  getMethods: getPaymentMethods,
  getPaymentMethods,
  createMethod,
  createPaymentMethod: createMethod,
  deleteMethod,
  deletePaymentMethod: deleteMethod,
  saveMercadoPagoCard,
  createMercadoPagoOrderWithCard,
  createMercadoPagoPix,
  getMercadoPagoStatus,
  getMercadoPagoOrderStatus
};
