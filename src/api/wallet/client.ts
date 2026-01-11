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
  amount: number;
};

const toCents = (value: number) => Math.round(Number(value || 0) * 100);
const fromCents = (value: number) => Number(value || 0) / 100;
const toAmountRequest = (value: number): AmountRequest => ({ amount: toCents(value) });

const requestWithAuth = async <T>(path: string, options: RequestOptions = {}) =>
  authClient.requestWithAuth<T>(path, options);

const getBalances = async (): Promise<WalletBalance[]> => {
  const data = await requestWithAuth<WalletBalance[]>('/wallet/balances');
  return (data || []).map((item) => ({
    ...item,
    balance: fromCents(item.balance),
    available: fromCents(item.available)
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
  const data = await requestWithAuth<LedgerListResponse>(
    query ? `/wallet/ledger?${query}` : '/wallet/ledger'
  );

  return {
    entries: (data?.entries || []).map((entry) => ({
      ...entry,
      amount: fromCents(entry.amount)
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
      amount: fromCents(item.amount)
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
  return requestWithAuth('/wallet/withdrawals', {
    method: 'POST',
    headers: { 'Idempotency-Key': headerKey },
    body: toAmountRequest(amount)
  });
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
      amount: fromCents(item.amount)
    })),
    nextCursor: data?.nextCursor ?? null
  };
};

const approveWithdrawal = async (withdrawalId: string, notes: string) =>
  requestWithAuth(`/wallet/withdrawals/${withdrawalId}/approve`, {
    method: 'POST',
    body: { notes }
  });

const rejectWithdrawal = async (withdrawalId: string, notes: string) =>
  requestWithAuth(`/wallet/withdrawals/${withdrawalId}/reject`, {
    method: 'POST',
    body: { notes }
  });

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

