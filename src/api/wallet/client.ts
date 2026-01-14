import { createIdempotencyKey, type RequestOptions } from '@/api/api';
import { authClient } from '@/api/auth';

type WalletBalance = {
  currency: string;
  balance: number;
  available: number;
};

type LedgerEntry = {
  id: string;
  type: string;
  amount: number;
  currency: string;
  referenceType?: string;
  referenceId?: string;
  idempotencyKey?: string;
  createdAt?: string;
  status?: string;
  description?: string;
};

type LedgerListResponse = {
  entries: LedgerEntry[];
  nextCursor: string | null;
};

type AmountRequest = {
  amount: string;
};

const parseDecimalMoney = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const normalized = value.trim().replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const toAmountRequest = (value: number): AmountRequest => ({
  amount: (Number.isFinite(value) ? value : 0).toFixed(6)
});

const requestWithAuth = async <T>(path: string, options: RequestOptions = {}) =>
  authClient.requestWithAuth<T>(path, options);

const getBalances = async (): Promise<WalletBalance[]> => {
  const data = await requestWithAuth<Array<{ currency: string; balance: unknown; available: unknown }>>(
    '/wallet/balances'
  );
  return (data || []).map((item) => ({
    ...item,
    balance: parseDecimalMoney(item.balance),
    available: parseDecimalMoney(item.available)
  }));
};

const getLedger = async ({
  cursor,
  limit
}: {
  cursor?: string | null;
  limit?: number;
} = {}): Promise<LedgerListResponse> => {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  if (limit) params.set('limit', String(limit));
  const query = params.toString();
  const data = await requestWithAuth<{ entries: any[]; nextCursor: string | null }>(
    query ? `/wallet/ledger?${query}` : '/wallet/ledger'
  );

  return {
    entries: (data?.entries || []).map((entry: any) => ({
      ...entry,
      amount: parseDecimalMoney(entry.amount)
    })),
    nextCursor: data?.nextCursor ?? null
  };
};

const createDepositIntent = async ({
  amount,
  idempotencyKey
}: {
  amount: number;
  idempotencyKey?: string;
}) => {
  // 1) Create a PaymentIntent on backend (amount in cents)
  const headerKey = idempotencyKey || createIdempotencyKey();

  const intentRes = await requestWithAuth<any>('/wallet/deposits/intent', {
    method: 'POST',
    headers: { 'Idempotency-Key': headerKey },
    body: toAmountRequest(amount)
  });

  // extract paymentIntentId and possibly returned idempotencyKey
  const paymentIntentId = intentRes?.data?.paymentIntentId || intentRes?.paymentIntentId;
  const returnedIdempotency = intentRes?.data?.idempotencyKey || intentRes?.idempotencyKey || headerKey;

  // 2) Create PIX via backend (which calls Mercado Pago), correlate using orderId
  const session = authClient.getSession();
  const buyerEmail = session?.user?.email || session?.user?.username || undefined;
  const orderId = paymentIntentId ? `WALLET_DEPOSIT_${paymentIntentId}` : `WALLET_DEPOSIT_${Date.now()}`;

  const pixRes = await requestWithAuth<any>('/payments/mercadopago/pix', {
    method: 'POST',
    headers: { 'Idempotency-Key': returnedIdempotency },
    body: {
      amount: Number(amount),
      description: 'Depósito - carteira',
      orderId,
      buyerEmail
    }
  });

  // Return both intent and pix responses so caller can use whichever fields needed
  return {
    intent: intentRes,
    pix: pixRes
  };
};

const getDeposits = async ({
  cursor,
  limit
}: {
  cursor?: string | null;
  limit?: number;
} = {}) => {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  if (limit) params.set('limit', String(limit));
  const query = params.toString();
  const data = await requestWithAuth<any>(
    query ? `/wallet/deposits?${query}` : '/wallet/deposits'
  );

  return {
    items: (data?.items || []).map((item: any) => ({
      ...item,
      amount: parseDecimalMoney(item.amount)
    })),
    nextCursor: data?.nextCursor ?? null
  };
};

const createWithdrawal = async ({
  amount,
  idempotencyKey
}: {
  amount: number;
  idempotencyKey?: string;
}) => {
  const headerKey = idempotencyKey || createIdempotencyKey();
  const data = await requestWithAuth<any>('/wallet/withdrawals', {
    method: 'POST',
    headers: { 'Idempotency-Key': headerKey },
    body: toAmountRequest(amount)
  });

  if (!data || typeof data !== 'object') return data;
  return { ...data, amount: parseDecimalMoney((data as any).amount) };
};

const getWithdrawals = async ({
  cursor,
  limit
}: {
  cursor?: string | null;
  limit?: number;
} = {}) => {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  if (limit) params.set('limit', String(limit));
  const query = params.toString();
  const data = await requestWithAuth<any>(
    query ? `/wallet/withdrawals?${query}` : '/wallet/withdrawals'
  );

  return {
    items: (data?.items || []).map((item: any) => ({
      ...item,
      amount: parseDecimalMoney(item.amount)
    })),
    nextCursor: data?.nextCursor ?? null
  };
};

const approveWithdrawal = async (withdrawalId: string, notes: string) => {
  const data = await requestWithAuth<any>(`/wallet/withdrawals/${withdrawalId}/approve`, {
    method: 'POST',
    body: { notes }
  });

  if (!data || typeof data !== 'object') return data;
  return { ...data, amount: parseDecimalMoney((data as any).amount) };
};

const rejectWithdrawal = async (withdrawalId: string, notes: string) => {
  const data = await requestWithAuth<any>(`/wallet/withdrawals/${withdrawalId}/reject`, {
    method: 'POST',
    body: { notes }
  });

  if (!data || typeof data !== 'object') return data;
  return { ...data, amount: parseDecimalMoney((data as any).amount) };
};

export const walletClient = {
  getBalances,
  getLedger,
  createDepositIntent,
  getDeposits,
  createWithdrawal,
  getWithdrawals,
  approveWithdrawal,
  rejectWithdrawal
};

