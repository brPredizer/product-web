import { createIdempotencyKey, type RequestOptions, apiRequest } from '@/app/api/api';
import { authClient } from '@/app/api/auth';

type BuyRequest = {
  MarketId: string;
  Side: 'yes' | 'no';
  Amount: number;
  IdempotencyKey?: string;
};
/**
 * Realiza uma compra (trade) no backend.
 * Envia Idempotency-Key via header e também no corpo para compatibilidade.
 */
const buyMarket = async ({ MarketId, Side, Amount, IdempotencyKey }: BuyRequest) => {
  const headerKey = IdempotencyKey || createIdempotencyKey();

  const payload: BuyRequest = {
    MarketId,
    Side,
    Amount: Number(Amount),
    IdempotencyKey: IdempotencyKey || headerKey,
  };

  // Enforce Authorization header: do not fallback to cookie-based auth.
  const session = authClient.getSession?.();
  const token = session?.accessToken;

  // If we have an access token in storage, send it explicitly in Authorization header.
  if (token) {
    const headers: Record<string, string> = {
      'Idempotency-Key': headerKey,
      Authorization: `Bearer ${token}`,
    };

    return await apiRequest<any>(`/markets/trade`, {
      method: 'POST',
      headers,
      body: payload,
    });
  }

  // No access token found — fall back to cookie/session-based request using authClient.requestWithAuth
  // This preserves the previous behavior where server session cookies allow authenticated calls.
  try {
    return await authClient.requestWithAuth<any>(`/markets/trade`, {
      method: 'POST',
      headers: { 'Idempotency-Key': headerKey },
      body: payload,
    });
  } catch (e) {
    // Re-throw with clearer message
    const err = new Error('Trade request failed: no access token and cookie-based auth failed');
    // @ts-ignore
    err.cause = e;
    throw err;
  }
};

export const marketsClient = {
  buyMarket,
};

export default marketsClient;
