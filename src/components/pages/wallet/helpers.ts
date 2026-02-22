import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const DEPOSIT_FEE = 0.0499; // 4.99%
export const WITHDRAWAL_FEE = 0.0799; // 7.99%

export type DepositMethod = "PIX" | "CARD";

export const normalizePixResponse = (pix: Record<string, any> | null) => {
  if (!pix || typeof pix !== "object") return null;
  return {
    paymentId: pix.PaymentId ?? pix.paymentId ?? pix.payment_id ?? pix.id ?? null,
    qrBase64:
      pix.QrCodeBase64 ??
      pix.qrCodeBase64 ??
      pix.qr_code_base64 ??
      pix.qrBase64 ??
      null,
    qrCode:
      pix.QrCode ??
      pix.qrCode ??
      pix.qr ??
      pix.payload ??
      pix.payloadString ??
      null,
    expiresAt: pix.ExpiresAt ?? pix.expiresAt ?? pix.expires_at ?? null,
    status: pix.Status ?? pix.status ?? null,
    orderId:
      pix.OrderId ??
      pix.orderId ??
      pix.order_id ??
      pix.external_reference ??
      null,
    _raw: pix,
  };
};

export const onlyDigits = (value: unknown) => String(value || "").replace(/\D/g, "");
export const inferDocumentType = (digits: string) => (digits.length > 11 ? "CNPJ" : "CPF");

export const normalizePaymentMethodId = (value: string) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "";
  if (normalized === "mastercard") return "master";
  if (normalized === "american express") return "amex";
  return normalized;
};

export const resolveMpCardId = (method: any) =>
  method?.mpCardId ??
  method?.mp_card_id ??
  method?.cardId ??
  method?.card_id ??
  null;

export const resolvePaymentMethodId = (method: any) =>
  method?.mpPaymentMethodId ??
  method?.mp_payment_method_id ??
  method?.paymentMethodId ??
  method?.payment_method_id ??
  method?.cardBrand ??
  method?.card_brand ??
  "";

export const formatCardLabel = (method: any) => {
  const brand = String(method?.cardBrand || method?.mpPaymentMethodId || "Cartao").toUpperCase();
  const last4 = method?.cardLast4 ? `**** ${method.cardLast4}` : "";
  const expMonth = method?.cardExpMonth ? String(method.cardExpMonth).padStart(2, "0") : "";
  const expYear = method?.cardExpYear ? String(method.cardExpYear).slice(-2) : "";
  const exp = expMonth && expYear ? ` ${expMonth}/${expYear}` : "";
  return `${brand} ${last4}${exp}`.trim();
};

export const getMpDeviceId = () => {
  if (typeof window === "undefined") return "";
  return (window as any).MP_DEVICE_SESSION_ID || "";
};

export const getMercadoPagoInstance = () => {
  if (typeof window === "undefined") return null;
  const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;
  const MercadoPago = (window as any).MercadoPago;
  if (!MercadoPago || !publicKey) return null;
  if (typeof MercadoPago === "function") {
    try {
      return new MercadoPago(publicKey, { locale: "pt-BR" });
    } catch {
      return MercadoPago(publicKey, { locale: "pt-BR" });
    }
  }
  return MercadoPago;
};

export function clampMoneyInput(v: string) {
  const raw = String(v ?? "")
    .replace(/[^\d.,]/g, "")
    .slice(0, 12);
  return raw.replace(",", ".");
}

export function formatBrlMoneyInput(value: string) {
  const digits = onlyDigits(value).slice(0, 12);
  const numeric = (Number(digits) || 0) / 100;
  const formatted = numeric.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return { formatted, numeric };
}

export function toNumberSafe(v: string) {
  const n = Number(String(v || "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function formatExpiresAtLabel(expiresAt: any) {
  if (!expiresAt) return "-";
  const d = new Date(expiresAt);
  if (Number.isNaN(d.getTime())) return "-";
  return format(d, "dd/MM, HH:mm", { locale: ptBR });
}

export function formatSecs(s: number | null) {
  if (s == null) return "--:--";
  const mm = Math.floor(s / 60).toString().padStart(2, "0");
  const ss = Math.floor(s % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

export const formatCurrencyValue = (value: number, currency: string) => {
  const curr = String(currency || "BRL").toUpperCase();
  try {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: curr }).format(
      Number(value) || 0
    );
  } catch {
    return `${curr} ${(Number(value) || 0).toFixed(2)}`;
  }
};

export const RECEIPT_TYPE_LABELS: Record<string, string> = {
  deposit: "Depósito",
  buy: "Compra",
  withdraw_request: "Solicitação de saque",
  withdraw_paid: "Saque pago",
  withdrawal: "Saque",
  fee: "Taxa",
  payout: "Pagamento",
};

export const normalizeReceiptType = (rawType: string, amount: number) => {
  const t = String(rawType || "").toLowerCase();
  if (t === "withdraw_request" || t === "withdraw_paid") return "withdrawal";
  if (t === "buy" || t === "deposit" || t === "withdrawal" || t === "fee" || t === "payout")
    return t;
  if (t === "sell") return "sell";
  if (t === "order") return "buy";
  if (amount > 0) return "deposit";
  if (amount < 0) return "withdrawal";
  return "other";
};

export const formatDateTimeFull = (value: any) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return format(d, "dd/MM/yyyy HH:mm:ss", { locale: ptBR });
};

export const shortReceiptId = (value: string | null | undefined) => {
  const v = String(value || "").trim();
  if (!v) return "-";
  return v.slice(0, 8);
};

export const isFinalStatus = (s: any) => {
  const v = String(s || "").toLowerCase();
  return ["approved", "completed", "rejected", "expired", "cancelled", "failed"].includes(v);
};

export const mapStatus = (s: any) => {
  switch (String(s || "").toLowerCase()) {
    case "approved":
    case "authorized":
    case "paid":
    case "completed":
      return "approved";
    case "pending":
    case "in_process":
      return "pending";
    case "rejected":
    case "refunded":
    case "cancelled":
    case "cancelled_by_user":
    case "failed":
      return "rejected";
    case "expired":
      return "expired";
    default:
      return String(s || "");
  }
};

export function mapReceipts(items: any[] = []) {
  return items.map((item: any, index: number) => {
    const amount = Number(item?.amount ?? 0) || 0;
    const normalizedType = normalizeReceiptType(item?.type, amount);
    const label =
      RECEIPT_TYPE_LABELS[String(item?.type || "").toLowerCase()] ||
      RECEIPT_TYPE_LABELS[normalizedType] ||
      "Movimento";

    return {
      id: item?.id || `receipt-${index}`,
      type: normalizedType,
      rawType: item?.type ?? null,
      label,
      amount,
      currency: item?.currency || "BRL",
      description: item?.description || label,
      provider: item?.provider || null,
      paymentMethod: item?.payment?.method || null,
      providerPaymentId: item?.payment?.externalPaymentId || item?.providerPaymentId || null,
      createdAt: item?.createdAt ?? null,
      marketTitle: item?.market?.title ?? null,
      marketSlug: item?.market?.slug ?? null,
    };
  });
}
