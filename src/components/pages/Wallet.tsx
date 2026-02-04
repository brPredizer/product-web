"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { walletClient } from "@/app/api/wallet";
import { paymentsClient } from "@/app/api/payments";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Download,
  X,
} from "lucide-react";
import StatsCard from "@/components/ui/StatsCard";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DialogClose } from "@radix-ui/react-dialog";

/**
 * Taxas (sua UI)
 */
const DEPOSIT_FEE = 0.025; // 2.5%
const WITHDRAWAL_FEE = 0.075; // 7.5%

type DepositMethod = "PIX" | "CARD";

interface WalletProps {
  user?: any;
  refreshUser?: () => void;
}

/**
 * =============================
 * HELPERS
 * =============================
 */

// Normaliza respostas de PIX do backend, aceitando PascalCase, snake_case ou camelCase
const normalizePixResponse = (pix: Record<string, any> | null) => {
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

const onlyDigits = (value: unknown) => String(value || "").replace(/\D/g, "");

const inferDocumentType = (digits: string) => (digits.length > 11 ? "CNPJ" : "CPF");

const normalizePaymentMethodId = (value: string) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "";
  if (normalized === "mastercard") return "master";
  if (normalized === "american express") return "amex";
  return normalized;
};

const resolveMpCardId = (method: any) =>
  method?.mpCardId ??
  method?.mp_card_id ??
  method?.cardId ??
  method?.card_id ??
  null;

const resolvePaymentMethodId = (method: any) =>
  method?.mpPaymentMethodId ??
  method?.mp_payment_method_id ??
  method?.paymentMethodId ??
  method?.payment_method_id ??
  method?.cardBrand ??
  method?.card_brand ??
  "";

const formatCardLabel = (method: any) => {
  const brand = String(method?.cardBrand || method?.mpPaymentMethodId || "Cartao").toUpperCase();
  const last4 = method?.cardLast4 ? `**** ${method.cardLast4}` : "";
  const expMonth = method?.cardExpMonth ? String(method.cardExpMonth).padStart(2, "0") : "";
  const expYear = method?.cardExpYear ? String(method.cardExpYear).slice(-2) : "";
  const exp = expMonth && expYear ? ` ${expMonth}/${expYear}` : "";
  return `${brand} ${last4}${exp}`.trim();
};

const getMpDeviceId = () => {
  if (typeof window === "undefined") return "";
  return (window as any).MP_DEVICE_SESSION_ID || "";
};

const getMercadoPagoInstance = () => {
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

function clampMoneyInput(v: string) {
  const raw = String(v ?? "")
    .replace(/[^\d.,]/g, "")
    .slice(0, 12);
  return raw.replace(",", ".");
}

function toNumberSafe(v: string) {
  const n = Number(String(v || "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function formatExpiresAtLabel(expiresAt: any) {
  if (!expiresAt) return "-";
  const d = new Date(expiresAt);
  if (Number.isNaN(d.getTime())) return "-";
  return format(d, "dd/MM, HH:mm", { locale: ptBR });
}

const formatCurrencyValue = (value: number, currency: string) => {
  const curr = String(currency || "BRL").toUpperCase();
  try {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: curr }).format(
      Number(value) || 0
    );
  } catch {
    return `${curr} ${(Number(value) || 0).toFixed(2)}`;
  }
};

const RECEIPT_TYPE_LABELS: Record<string, string> = {
  deposit: "Depósito",
  buy: "Compra",
  withdraw_request: "Solicitação de saque",
  withdraw_paid: "Saque pago",
  withdrawal: "Saque",
  fee: "Taxa",
  payout: "Pagamento",
};

const normalizeReceiptType = (rawType: string, amount: number) => {
  const t = String(rawType || "").toLowerCase();
  if (t === "withdraw_request" || t === "withdraw_paid") return "withdrawal";
  if (t === "buy" || t === "deposit" || t === "withdrawal" || t === "fee" || t === "payout") return t;
  if (t === "sell") return "sell";
  if (t === "order") return "buy";
  if (amount > 0) return "deposit";
  if (amount < 0) return "withdrawal";
  return "other";
};

const formatDateTimeFull = (value: any) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return format(d, "dd/MM/yyyy HH:mm:ss", { locale: ptBR });
};

const shortReceiptId = (value: string | null | undefined) => {
  const v = String(value || "").trim();
  if (!v) return "-";
  return v.slice(0, 8);
};

const isFinalStatus = (s: any) => {
  const v = String(s || "").toLowerCase();
  return ["approved", "completed", "rejected", "expired", "cancelled", "failed"].includes(v);
};

const mapStatus = (s: any) => {
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

function TransactionRow({
  transaction,
  onClick,
}: {
  transaction: any;
  onClick?: (id: string) => void;
}) {
  const typeConfig: any = {
    deposit: {
      icon: ArrowDownCircle,
      color: "text-emerald-600 bg-emerald-100",
      label: "Depósito",
    },
    withdrawal: {
      icon: ArrowUpCircle,
      color: "text-rose-600 bg-rose-100",
      label: "Saque",
    },
    withdraw_request: {
      icon: ArrowUpCircle,
      color: "text-amber-600 bg-amber-100",
      label: "Solicitação de saque",
    },
    withdraw_paid: {
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-100",
      label: "Saque pago",
    },
    fee: {
      icon: AlertCircle,
      color: "text-amber-600 bg-amber-100",
      label: "Taxa",
    },
    buy: {
      icon: CreditCard,
      color: "text-blue-600 bg-blue-100",
      label: "Compra",
    },
    sell: {
      icon: CreditCard,
      color: "text-purple-600 bg-purple-100",
      label: "Venda",
    },
    payout: {
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-100",
      label: "Pagamento",
    },
    other: {
      icon: AlertCircle,
      color: "text-slate-600 bg-slate-100",
      label: "Movimento",
    },
  };

  const config = typeConfig[transaction.type] || typeConfig.other;
  const Icon = config.icon;

  const description = transaction.description || "Transação";
  const marketLabel = transaction.marketTitle || null;
  const marketSlug = transaction.marketSlug || null;
  const paymentLabel = transaction.paymentMethod
    ? `Método: ${String(transaction.paymentMethod).toUpperCase()}`
    : null;
  const externalPaymentId = transaction.providerPaymentIdText || transaction.providerPaymentId || null;
  const currencyLabel = transaction.currency || "BRL";
  const amountNumber = Number(transaction.amount ?? transaction.net_amount ?? 0) || 0;
  const amountValue = Math.abs(amountNumber);
  const sign = amountNumber === 0 ? "" : amountNumber > 0 ? "+" : "-";
  const amountFormatted = `${sign}${formatCurrencyValue(amountValue, currencyLabel)}`;
  const amountTone =
    sign === "+" ? "text-emerald-600" : sign === "-" ? "text-rose-600" : "text-slate-600";

  const createdAt = transaction.createdAt;
  const createdLabel = createdAt
    ? format(new Date(createdAt), "d 'de' MMM, HH:mm", { locale: ptBR })
    : "-";

  return (
    <div
      className={cn(
        "p-4 sm:p-6 flex items-center gap-4 hover:bg-slate-50 transition-colors",
        onClick && "cursor-pointer"
      )}
      onClick={onClick ? () => onClick(transaction.id) : undefined}
    >
      <div className={cn("p-2.5 rounded-full", config.color)}>
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900">{transaction.label || config.label}</p>
        <p className="text-sm text-slate-500 truncate">{description}</p>

        {marketLabel ? (
          <p className="text-xs text-emerald-700 truncate">
            {marketSlug ? `${marketLabel} (${marketSlug})` : marketLabel}
          </p>
        ) : null}

        <p className="text-xs text-slate-400 mt-1">{createdLabel}</p>
      </div>

      <div className="text-right">
        <p className={cn("font-semibold", amountTone)}>
          {amountFormatted}
        </p>

        {transaction.statusLabel && (
          <Badge className={`${transaction.statusTone || "bg-slate-100 text-slate-700"} mt-1`}>
            {transaction.statusLabel}
          </Badge>
        )}
      </div>
    </div>
  );
}

/**
 * =============================
 * MAPS
 * =============================
 */
function mapReceipts(items: any[] = []) {
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

function ReceiptModal({
  open,
  receiptId,
  onOpenChange,
}: {
  open: boolean;
  receiptId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["wallet-receipt", receiptId],
    enabled: open && Boolean(receiptId),
    queryFn: async () => {
      return await (walletClient as any).getReceipt?.(receiptId as string);
    },
  });

  const receipt = data as any;
  const amountNumber = Number(receipt?.amount ?? 0) || 0;
  const sign = amountNumber === 0 ? "" : amountNumber > 0 ? "+" : "-";
  const amountLabel = `${sign}${formatCurrencyValue(Math.abs(amountNumber), receipt?.currency || "BRL")}`;
  const amountTone =
    sign === "+" ? "text-emerald-600" : sign === "-" ? "text-rose-600" : "text-slate-600";
  const typeLabel = receipt
    ? RECEIPT_TYPE_LABELS[String(receipt.type || "").toLowerCase()] ||
      RECEIPT_TYPE_LABELS[normalizeReceiptType(receipt.type, amountNumber)] ||
      "Recibo"
    : "Recibo";
  const createdLabel = formatDateTimeFull(receipt?.createdAt);
  const market = receipt?.market || null;
  const payment = receipt?.payment || null;
  const isExpired = payment?.expiresAt ? new Date(payment.expiresAt).getTime() < Date.now() : false;
  const qrImage = payment?.qrCodeBase64 ? `data:image/png;base64,${payment.qrCodeBase64}` : null;

  const handlePrint = () => {
    if (typeof window === "undefined") return;
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="receipt-dialog max-w-2xl max-h-[95vh] print:w-full print:max-w-full print:max-h-none print:overflow-visible print:border-0 print:shadow-none [&>button.absolute]:hidden p-4 sm:p-5 print:p-0">
        <style>{`
          @media print {
            @page { size: A4 portrait; margin: 12mm; }

            html, body { height: auto !important; }
            body { margin: 0 !important; background: #fff !important; }

            /* Esconde tudo (sem remover do DOM/portal) */
            body * { visibility: hidden !important; }

            /* Some com o overlay do Radix */
            [data-radix-dialog-overlay] { display: none !important; }

            /* Dialog não pode ser fixed/translate no print */
            .receipt-dialog {
              position: static !important;
              inset: auto !important;
              transform: none !important;
              margin: 0 !important;
              padding: 0 !important;
              max-height: none !important;
              overflow: visible !important;
              border: 0 !important;
              box-shadow: none !important;
              background: transparent !important;
            }

            /* Mostra só o recibo */
            .receipt-print, .receipt-print * { visibility: visible !important; }

            /* E fixa ele no topo da página (evita página em branco) */
            .receipt-print {
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              right: 0 !important;
              width: 100% !important;
              max-width: 720px !important;
              margin: 0 auto !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          }
        `}</style>
        <div className="absolute top-3 right-3 flex items-center gap-2 print:hidden">
          <Button
            onClick={handlePrint}
            variant="ghost"
            size="sm"
            className="text-slate-600 hover:text-slate-900 gap-2"
            aria-label="Baixar comprovante"
          >
            <Download className="w-4 h-4" />
            <span className="text-xs">Baixar comprovante</span>
          </Button>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-600 hover:text-slate-900"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogClose>
        </div>
        <DialogHeader>
          <DialogTitle>Recibo</DialogTitle>
          <DialogDescription>Documento gerado eletronicamente.</DialogDescription>
        </DialogHeader>

        <div className="max-h-[92vh] overflow-y-auto space-y-4 print:max-h-none print:space-y-3 print:overflow-visible">
          {isLoading ? (
            <div className="mx-auto w-full max-w-[420px] p-6 space-y-3">
              <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
              <div className="h-10 w-full bg-slate-200 rounded animate-pulse" />
              <div className="h-24 w-full bg-slate-200 rounded animate-pulse" />
            </div>
          ) : error ? (
            <div className="text-sm text-rose-600">Falha ao carregar recibo.</div>
          ) : !receipt ? (
            <div className="text-sm text-slate-600">Recibo não encontrado.</div>
          ) : (
            <div
              className="receipt-print mx-auto w-full max-w-[520px] bg-white border border-slate-200 rounded-2xl p-4 shadow-sm print:shadow-none print:border-slate-300 print:max-w-full"
              style={{ breakInside: "avoid", pageBreakInside: "avoid", pageBreakBefore: "avoid", pageBreakAfter: "avoid" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Recibo</p>
                  <p className="text-lg font-semibold text-slate-900">{typeLabel}</p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p>ID: {shortReceiptId(receipt.id)}</p>
                  <p>{createdLabel}</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <p className="text-sm text-slate-500">Descrição</p>
                <p className="text-base font-semibold text-slate-900 leading-snug">
                  {receipt.description || "—"}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between py-3 border-y border-slate-200">
                <span className="text-sm text-slate-600">Valor</span>
                <span className={`text-xl font-bold ${amountTone}`}>{amountLabel}</span>
              </div>

              {market ? (
                <div className="mt-4 rounded-lg border border-slate-200 p-3 bg-slate-50">
                  <p className="text-xs text-slate-500">Mercado</p>
                  <p className="text-sm font-semibold text-slate-900">{market.title}</p>
                  {market.slug ? (
                    <p className="text-xs text-emerald-700">{market.slug}</p>
                  ) : null}
                </div>
              ) : null}

              {receipt.contracts != null || receipt.unitPrice != null ? (
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  {receipt.contracts != null ? (
                    <div>
                      <p className="text-xs text-slate-500">Contratos</p>
                      <p className="font-medium text-slate-900">{receipt.contracts}</p>
                    </div>
                  ) : null}
                  {receipt.unitPrice != null ? (
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Preço unitário</p>
                      <p className="font-medium text-slate-900">
                        {formatCurrencyValue(receipt.unitPrice, receipt.currency || "BRL")}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {payment ? (
                <div className="mt-4 rounded-lg border border-slate-200 p-4 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Pagamento</p>
                      <p className="text-xs text-slate-500">
                        Método {payment.method ? String(payment.method).toUpperCase() : "-"}
                      </p>
                    </div>
                    {payment.checkoutUrl && !isExpired ? (
                      <Button asChild size="sm" variant="outline" className="print:hidden">
                        <a href={payment.checkoutUrl} target="_blank" rel="noreferrer">
                          Pagar
                        </a>
                      </Button>
                    ) : null}
                  </div>

                  {payment.externalPaymentId ? (
                    <p className="text-xs text-slate-600">
                      ID do pagamento: <span className="font-medium">{payment.externalPaymentId}</span>
                    </p>
                  ) : null}

                  {qrImage ? (
                    <div className="mt-3 text-center space-y-1">
                      <img
                        src={qrImage}
                        alt="QR Code"
                        className={cn("mx-auto w-48 h-48 object-contain border rounded-lg", isExpired && "opacity-60")}
                      />
                      <p className="text-xs text-slate-500">
                        {isExpired ? "Expirado" : "Escaneie para pagar"}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-6 text-xs text-slate-500 border-t border-dashed border-slate-200 pt-3">
                <p>Documento gerado eletronicamente.</p>
                <p>Ref.: {shortReceiptId(receipt.id)}</p>
                <p>Emitido em: {createdLabel}</p>
              </div>
            </div>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
}


/**
 * =============================
 * PAGE
 * =============================
 */
export default function WalletView({ user, refreshUser }: WalletProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // modais
  const [depositSetupOpen, setDepositSetupOpen] = useState(false);
  const [pixOpen, setPixOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);

  // depósito
  const [depositAmountStr, setDepositAmountStr] = useState("");
  const [depositMethod, setDepositMethod] = useState<DepositMethod>("PIX");
  const [selectedCardId, setSelectedCardId] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardInstallments, setCardInstallments] = useState("1");
  const [cardOrderResult, setCardOrderResult] = useState<any>(null);
  const [payerEmail, setPayerEmail] = useState("");
  const [payerDocument, setPayerDocument] = useState("");

  // pix
  const [pixData, setPixData] = useState<any>(null);
  const [expiresIn, setExpiresIn] = useState<number | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const pixScrollRef = useRef<HTMLDivElement | null>(null);

  // evita chamadas concorrentes ao endpoint de status
  const statusRequestRef = useRef<boolean>(false);
  // toast anti-spam
  const finalToastRef = useRef<string | null>(null);

  // saque
  const [withdrawAmountStr, setWithdrawAmountStr] = useState("");

  const depositAmount = useMemo(() => toNumberSafe(depositAmountStr), [depositAmountStr]);
  const depositFee = useMemo(() => depositAmount * DEPOSIT_FEE, [depositAmount]);
  const depositNet = useMemo(() => Math.max(0, depositAmount - depositFee), [depositAmount, depositFee]);

  const withdrawAmount = useMemo(() => toNumberSafe(withdrawAmountStr), [withdrawAmountStr]);
  const withdrawFee = useMemo(() => withdrawAmount * WITHDRAWAL_FEE, [withdrawAmount]);
  const withdrawNet = useMemo(() => Math.max(0, withdrawAmount - withdrawFee), [withdrawAmount, withdrawFee]);

  const balancesQuery = useQuery({
    queryKey: ["wallet-balances", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await (walletClient as any).getBalances?.();
      return res ?? [];
    },
  });

  const ledgerQuery = useQuery({
    queryKey: ["wallet-ledger", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await (walletClient as any).getLedger?.();
      return res ?? { entries: [], nextCursor: null };
    },
  });

  const receiptsQuery = useQuery({
    queryKey: ["wallet-receipts", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await (walletClient as any).getReceipts?.();
      return res ?? { items: [], nextCursor: null };
    },
  });

  const paymentMethodsQuery = useQuery({
    queryKey: ["payment-methods", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res =
        (await (paymentsClient as any).getPaymentMethods?.()) ??
        (await (paymentsClient as any).getMethods?.());
      return res ?? [];
    },
  });

  const availableBalance = useMemo(() => {
    const b = balancesQuery.data as any;
    const list = Array.isArray(b) ? b : b?.balances ?? b?.data ?? [];
    if (!Array.isArray(list)) return 0;
    const brl = list.find((item: any) => String(item?.currency || "").toUpperCase() === "BRL");
    return Number(brl?.available ?? brl?.balance ?? 0) || 0;
  }, [balancesQuery.data]);

  const totals = useMemo(() => {
    const raw = ledgerQuery.data as any;
    const entries = Array.isArray(raw) ? raw : raw?.entries ?? raw?.data?.entries ?? raw?.data ?? [];
    let deposited = 0;
    let withdrawn = 0;

    (entries || []).forEach((entry: any) => {
      const amount = Number(entry?.amount ?? 0) || 0;
      const type = String(entry?.type || "").toUpperCase();
      if (type.includes("DEPOSIT")) deposited += amount;
      if (type.includes("WITHDRAWAL")) withdrawn += amount;
    });

    return {
      deposited,
      withdrawn,
      wagered: Number(user?.total_wagered ?? 0) || 0,
    };
  }, [ledgerQuery.data, user?.total_wagered]);

  const transactions = useMemo(() => {
    const rawReceipts = receiptsQuery.data as any;
    const items = Array.isArray(rawReceipts)
      ? rawReceipts
      : rawReceipts?.items ?? rawReceipts?.data?.items ?? rawReceipts?.data ?? [];
    return mapReceipts(items);
  }, [receiptsQuery.data]);

  const handleOpenReceipt = (id: string | null) => {
    if (!id) return;
    setSelectedReceiptId(id);
    setReceiptModalOpen(true);
  };

  const cardMethods = useMemo(() => {
    const raw = paymentMethodsQuery.data as any;
    const list = Array.isArray(raw) ? raw : raw?.methods ?? raw?.data ?? [];
    return (list || []).filter((m: any) => {
      const type = String(m?.type || m?.paymentType || "").toUpperCase();
      return type.includes("CARD") || Boolean(m?.cardLast4 || m?.mpCardId || m?.mpPaymentMethodId);
    });
  }, [paymentMethodsQuery.data]);
  const usableCardMethods = useMemo(
    () => cardMethods.filter((method: any) => Boolean(resolveMpCardId(method))),
    [cardMethods]
  );

  useEffect(() => {
    if (!payerEmail && user?.email) setPayerEmail(user.email);
    const doc = user?.cpf || user?.document || "";
    if (!payerDocument && doc) setPayerDocument(onlyDigits(doc));
  }, [user, payerEmail, payerDocument]);

  useEffect(() => {
    if (!selectedCardId && usableCardMethods.length > 0) {
      const firstId = resolveMpCardId(usableCardMethods[0]);
      if (firstId) setSelectedCardId(String(firstId));
    }
  }, [usableCardMethods, selectedCardId]);

  useEffect(() => {
    if (depositMethod === "CARD" && usableCardMethods.length === 0) {
      setDepositMethod("PIX");
    }
  }, [depositMethod, usableCardMethods.length]);

  const isLoading = balancesQuery.isLoading || ledgerQuery.isLoading || receiptsQuery.isLoading;

  const withdrawMutation = useMutation({
    mutationFn: async (amount: number) => {
      await (walletClient as any).createWithdrawal?.({ amount });
    },
    onSuccess: () => {
      toast.success("Saque solicitado! Aguarde aprovação do administrador.");
      queryClient.invalidateQueries({ queryKey: ["wallet-balances", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["wallet-ledger", user?.id] });
      refreshUser?.();
      setWithdrawOpen(false);
      setWithdrawAmountStr("");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Falha ao solicitar saque.");
    },
  });

  const depositMutation = useMutation({
    mutationFn: async ({ amount }: { amount: number }) => {
      return await (walletClient as any).createDepositIntent?.({ amount });
    },
    onSuccess: (data: any) => {
      const normalized = normalizePixResponse(data?.pix || data || null);
      if (!normalized?.qrCode && !normalized?.qrBase64) {
        toast.error("PIX não retornou QR/código. Verifique a resposta do backend.");
        return;
      }

      setPixData({ ...normalized, intent: data?.intent, amount: depositAmount });
      toast.success("PIX gerado.");

      setDepositSetupOpen(false);
      setPixOpen(true);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Falha ao gerar PIX.");
    },
  });

  const cardOrderMutation = useMutation({
    mutationFn: async () => {
      const amount = depositAmount;
      if (amount < 0.01) throw new Error("Informe um valor válido");

      const selected = usableCardMethods.find(
        (method: any) => String(resolveMpCardId(method) || "") === String(selectedCardId || "")
      );
      if (!selected) throw new Error("Selecione um cartão salvo");

      const cardId = resolveMpCardId(selected);
      if (!cardId) throw new Error("Cartão sem mpCardId");

      const cvvDigits = onlyDigits(cardCvv);
      if (cvvDigits.length < 3) throw new Error("CVV inválido");

      const mp = getMercadoPagoInstance();
      if (!mp || typeof (mp as any).createCardToken !== "function") {
        throw new Error("SDK do Mercado Pago não carregado");
      }

      const tokenResp = await (mp as any).createCardToken({
        cardId,
        card_id: cardId,
        securityCode: cvvDigits,
        security_code: cvvDigits,
      });
      const tokenId = tokenResp?.id || tokenResp?.card?.id || tokenResp?.token;
      if (!tokenId) throw new Error("Falha ao tokenizar cartão");

      const paymentMethodId = normalizePaymentMethodId(resolvePaymentMethodId(selected));
      if (!paymentMethodId) throw new Error("Bandeira do cartão indisponível");

      const email = payerEmail.trim();
      if (!email) throw new Error("Informe o email do pagador");

      const docDigits = onlyDigits(payerDocument);
      const payer: any = { email };
      if (docDigits) payer.identification = { type: inferDocumentType(docDigits), number: docDigits };

      const installments = Math.max(1, Number(cardInstallments || 1));
      const deviceId = getMpDeviceId();
      const orderId = `WALLET_DEPOSIT_${Date.now()}`;
      const createOrder = (paymentsClient as any).createMercadoPagoOrderWithCard;
      if (typeof createOrder !== "function") throw new Error("Endpoint de cartão indisponível");

      return await createOrder({
        orderId,
        amount,
        token: tokenId,
        paymentMethodId,
        installments,
        payer,
        deviceId,
      });
    },
    onSuccess: (data: any) => {
      if (!data) {
        toast.error("Falha ao processar cartão.");
        return;
      }
      setCardOrderResult(data);
      setCardCvv("");

      const status = mapStatus(data?.status ?? data?.Status ?? "");
      if (status === "approved") {
        toast.success("Pagamento aprovado. Atualizando saldo...");
        queryClient.invalidateQueries({ queryKey: ["wallet-balances", user?.id] });
        queryClient.invalidateQueries({ queryKey: ["wallet-ledger", user?.id] });
        refreshUser?.();
        setDepositSetupOpen(false);
        return;
      }

      if (status === "rejected") {
        toast.error("Pagamento recusado. Tente novamente.");
        return;
      }

      toast.message("Pagamento em processamento. Acompanhe o status.");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Falha ao processar cartão.");
    },
  });

  // =============================
  // PIX: contador local (expiração)
  // =============================
  useEffect(() => {
    let timer: any = null;

    if (pixData?.expiresAt) {
      const expiresAtMs = new Date(pixData.expiresAt).getTime();

      const tick = () => {
        const secs = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));
        setExpiresIn(secs);

        if (secs <= 0) {
          setPixData((prev: any) => {
            if (!prev) return prev;
            if (String(prev.status || "").toLowerCase() === "approved") return prev;
            if (String(prev.status || "").toLowerCase() === "expired") return prev;
            return { ...prev, status: "expired", qrCode: null, qrBase64: null };
          });
          setQrImage(null);
        }
      };

      tick();
      timer = setInterval(tick, 1000);
    } else {
      setExpiresIn(null);
    }

    return () => timer && clearInterval(timer);
  }, [pixData?.expiresAt]);

  const isExpiredLocal = useMemo(() => {
    if (!pixData?.expiresAt) return false;
    const ms = new Date(pixData.expiresAt).getTime();
    if (Number.isNaN(ms)) return false;
    return ms <= Date.now();
  }, [pixData?.expiresAt]);

  // =============================
  // PIX polling
  // =============================
  const mpStatusQuery = useQuery({
    queryKey: ["mp-status", pixData?.paymentId],
    enabled:
      pixOpen &&
      !!pixData?.paymentId &&
      !isFinalStatus(pixData?.status) &&
      !isExpiredLocal,
    queryFn: async () => {
      if (statusRequestRef.current) return null;
      statusRequestRef.current = true;
      try {
        return await (paymentsClient as any).getMercadoPagoStatus?.(pixData.paymentId as any);
      } finally {
        statusRequestRef.current = false;
      }
    },
    refetchOnWindowFocus: false,
    retry: 1,
    refetchInterval: (data: any) => {
      if (!data) return 10000;

      const backendStatus = String(data?.status || "").toLowerCase();
      const statusDetail = String(data?.statusDetail || data?.status_detail || "").toLowerCase();
      const normalized = mapStatus(backendStatus);

      const final =
        data?.isFinal === true ||
        isFinalStatus(normalized) ||
        statusDetail === "expired" ||
        statusDetail === "rejected";

      return final ? false : 10000;
    },
  });

  const closePixModal = () => {
    setPixOpen(false);
    setPixData(null);
    setQrImage(null);
    setExpiresIn(null);
    setDepositAmountStr("");
    setDepositMethod("PIX");
    finalToastRef.current = null;

    queryClient.cancelQueries({ queryKey: ["mp-status"] });
  };

  useEffect(() => {
    const res: any = mpStatusQuery.data;
    if (!res) return;

    const backendStatus = String(res?.status || "").toLowerCase();
    const statusDetail = String(res?.statusDetail || res?.status_detail || "").toLowerCase();
    const normalized = mapStatus(backendStatus);

    setPixData((prev: any) => (prev ? { ...prev, status: normalized } : prev));

    const final =
      res?.isFinal === true ||
      isFinalStatus(normalized) ||
      statusDetail === "expired" ||
      statusDetail === "rejected";

    if (!final) return;

    const toastKey = `${pixData?.paymentId || ""}:${normalized}:${statusDetail}`;
    if (finalToastRef.current === toastKey) return;
    finalToastRef.current = toastKey;

    if (normalized === "approved") {
      toast.success("Pagamento confirmado! Atualizando saldo...");

      queryClient.invalidateQueries({ queryKey: ["wallet-balances", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["wallet-ledger", user?.id] });
      refreshUser?.();

      closePixModal();
      return;
    }

    if (normalized === "rejected") {
      toast.error("Pagamento recusado/cancelado. Gere um novo PIX.");
      setPixData((prev: any) => (prev ? { ...prev, qrCode: null, qrBase64: null } : prev));
      setQrImage(null);
      return;
    }

    if (normalized === "expired" || statusDetail === "expired") {
      toast.info("PIX expirado. Gere um novo pagamento.");
      setPixData((prev: any) => (prev ? { ...prev, status: "expired", qrCode: null, qrBase64: null } : prev));
      setQrImage(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mpStatusQuery.data]);

  const pixStatus = String(pixData?.status || "").toLowerCase();
  const pixIsFinal =
    ["expired", "rejected", "cancelled", "failed"].includes(pixStatus) || (expiresIn ?? 0) <= 0;

  const copyPix = async () => {
    const code = pixData?.qrCode;
    if (!code) return toast.error("Código PIX indisponível.");
    if (pixIsFinal) return toast.error("Este PIX não está mais disponível. Gere um novo pagamento.");
    await navigator.clipboard?.writeText(code);
    toast.success("PIX copiado");
  };

  // Gera QR localmente se vier só o payload; ou usa base64 do backend.
  useEffect(() => {
    let mounted = true;

    async function generate() {
      if (!pixData) {
        setQrImage(null);
        return;
      }

      if (pixData.qrBase64) {
        setQrImage(`data:image/png;base64,${pixData.qrBase64}`);
        return;
      }

      if (pixData.qrCode) {
        try {
          const QRCode = (await import("qrcode")).default;
          const dataUrl = await QRCode.toDataURL(pixData.qrCode, { margin: 2, scale: 9 });
          if (mounted) setQrImage(dataUrl as string);
        } catch (err) {
          console.error("Falha ao gerar QR localmente", err);
          setQrImage(null);
        }
        return;
      }

      setQrImage(null);
    }

    generate();
    return () => {
      mounted = false;
    };
  }, [pixData?.paymentId, pixData?.qrBase64, pixData?.qrCode]);

  useEffect(() => {
    if (!pixOpen) return;
    const el = pixScrollRef.current;
    if (!el) return;

    const t = setTimeout(() => {
      try {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      } catch {
        el.scrollTop = el.scrollHeight;
      }
    }, 80);

    return () => clearTimeout(t);
  }, [pixOpen, pixData, qrImage]);

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full text-center">
          <Wallet className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Acesse sua Carteira</h2>
          <p className="text-slate-500 mb-6">Faça login para gerenciar seu saldo.</p>
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => router.push("/sign-in")}>
            Entrar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Carteira</h1>
          <p className="text-slate-500 mt-1">Gerencie seus depósitos e saques</p>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 mb-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <p className="text-slate-400 text-sm mb-1">Saldo Disponível</p>
              <p className="text-4xl font-bold">
                {formatCurrencyValue(availableBalance, "BRL")}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setDepositSetupOpen(true)}
              >
                <ArrowDownCircle className="w-4 h-4 mr-2" />
                Depositar
              </Button>
              <Button
                variant="outline"
                className="text-white border-white/20 hover:bg-white/10"
                onClick={() => setWithdrawOpen(true)}
              >
                <ArrowUpCircle className="w-4 h-4 mr-2" />
                Sacar
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <StatsCard title="Total Depositado" value={formatCurrencyValue(totals.deposited, "BRL")} icon={ArrowDownCircle} />
          <StatsCard title="Total Sacado" value={formatCurrencyValue(totals.withdrawn, "BRL")} icon={ArrowUpCircle} />
          <StatsCard title="Total Apostado" value={formatCurrencyValue(totals.wagered, "BRL")} icon={CreditCard} />
        </div>

        {/* Fee Transparency */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-8">
          <h3 className="font-semibold text-emerald-900 mb-3">Taxas Transparentes</h3>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <ArrowDownCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700">
                Depósito: <strong>2,5%</strong> do valor
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700">
                Saque: <strong>7,5%</strong> do valor
              </span>
            </div>
          </div>
          <p className="text-sm text-emerald-600 mt-3">
            Nenhuma taxa escondida. Nenhuma posição proprietária contra você.
          </p>
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-2xl border border-slate-200">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900">Histórico</h3>
          </div>

          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="w-10 h-10 bg-slate-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded w-48 mb-2" />
                    <div className="h-3 bg-slate-200 rounded w-24" />
                  </div>
                  <div className="h-5 bg-slate-200 rounded w-20" />
                </div>
              ))}
            </div>
          ) : transactions.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {transactions.map((tx: any) => (
                <TransactionRow
                  key={tx.id}
                  transaction={tx}
                  onClick={tx?.id ? () => handleOpenReceipt(tx.id) : undefined}
                />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-semibold text-slate-900 mb-2">Sem recibos</h3>
              <p className="text-slate-500">Suas transações aparecerão aqui.</p>
            </div>
          )}
        </div>
      </div>

      {/* ===== MODAL DEPÓSITO (simples) ===== */}
      <Dialog open={depositSetupOpen} onOpenChange={setDepositSetupOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Depositar</DialogTitle>
            <DialogDescription>Escolha o método e informe o valor.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">Valor</p>
                <Input
                  value={depositAmountStr}
                  onChange={(e) => setDepositAmountStr(clampMoneyInput(e.target.value))}
                  placeholder="Ex: 150.00"
                />
                <p className="text-xs text-slate-500">
                  Taxa: {formatCurrencyValue(depositFee, "BRL")} • Líquido:{" "}
                  {formatCurrencyValue(depositNet, "BRL")}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">Método</p>
                <Select value={depositMethod} onValueChange={(v) => setDepositMethod(v as DepositMethod)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="CARD" disabled={usableCardMethods.length === 0}>
                      Cartão
                    </SelectItem>
                  </SelectContent>
                </Select>
                {depositMethod === "CARD" && usableCardMethods.length === 0 ? (
                  <p className="text-xs text-rose-600">Você não tem cartão salvo.</p>
                ) : null}
              </div>
            </div>

            {depositMethod === "CARD" ? (
              <div className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700">Cartão</p>
                    <Select value={selectedCardId} onValueChange={setSelectedCardId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cartão" />
                      </SelectTrigger>
                      <SelectContent>
                        {usableCardMethods.map((m: any) => {
                          const id = String(resolveMpCardId(m) || "");
                          return (
                            <SelectItem key={id} value={id}>
                              {formatCardLabel(m)}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700">Parcelas</p>
                    <Select value={cardInstallments} onValueChange={setCardInstallments}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }).map((_, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>
                            {i + 1}x
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700">CVV</p>
                    <Input value={cardCvv} onChange={(e) => setCardCvv(onlyDigits(e.target.value).slice(0, 4))} placeholder="***" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700">Email do pagador</p>
                    <Input value={payerEmail} onChange={(e) => setPayerEmail(e.target.value)} placeholder="email@exemplo.com" />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">Documento do pagador (CPF/CNPJ)</p>
                  <Input value={payerDocument} onChange={(e) => setPayerDocument(onlyDigits(e.target.value).slice(0, 14))} placeholder="Somente números" />
                  <p className="text-xs text-slate-500">Detectado: {inferDocumentType(onlyDigits(payerDocument || ""))}</p>
                </div>

                <Button
                  className="w-full"
                  disabled={cardOrderMutation.isPending}
                  onClick={() => cardOrderMutation.mutate()}
                >
                  {cardOrderMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    "Pagar com cartão"
                  )}
                </Button>

                {cardOrderResult ? (
                  <div className="text-xs text-slate-500 break-all">
                    Resultado: {JSON.stringify(cardOrderResult)}
                  </div>
                ) : null}
              </div>
            ) : (
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={depositMutation.isPending}
                onClick={() => depositMutation.mutate({ amount: depositAmount })}
              >
                {depositMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando PIX...
                  </>
                ) : (
                  "Gerar PIX"
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== MODAL PIX (instrumento de pagamento) ===== */}
      <Dialog open={pixOpen} onOpenChange={(v) => (!v ? closePixModal() : setPixOpen(true))}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Pagamento via PIX</DialogTitle>
            <DialogDescription>
              Use o QR ou copie o código. (Isso não é recibo — é pagamento.)
            </DialogDescription>
          </DialogHeader>

          <div ref={pixScrollRef} className="max-h-[70vh] overflow-y-auto pr-1 space-y-4">
            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
              <p className="text-sm text-slate-700">
                Status:{" "}
                <span className="font-semibold capitalize">{pixStatus || "pendente"}</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Expira em: {formatExpiresAtLabel(pixData?.expiresAt)} • Restante:{" "}
                {expiresIn == null ? "-" : `${Math.floor(expiresIn / 60)
                  .toString()
                  .padStart(2, "0")}:${Math.floor(expiresIn % 60)
                  .toString()
                  .padStart(2, "0")}`}
              </p>
            </div>

            {qrImage ? (
              <div className="flex justify-center">
                <img
                  src={qrImage}
                  alt="QR Code PIX"
                  className={cn(
                    "w-60 h-60 object-contain rounded-xl border",
                    pixIsFinal && "opacity-40"
                  )}
                />
              </div>
            ) : null}

            <div className="flex gap-2">
              <Button className="flex-1" variant="outline" onClick={copyPix} disabled={pixIsFinal}>
                Copiar código PIX
              </Button>
              <Button className="flex-1" onClick={closePixModal}>
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== MODAL SAQUE (simples) ===== */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Saque</DialogTitle>
            <DialogDescription>Informe o valor do saque.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              value={withdrawAmountStr}
              onChange={(e) => setWithdrawAmountStr(clampMoneyInput(e.target.value))}
              placeholder="Ex: 100.00"
            />
            <p className="text-xs text-slate-500">
              Taxa: {formatCurrencyValue(withdrawFee, "BRL")} • Líquido:{" "}
              {formatCurrencyValue(withdrawNet, "BRL")}
            </p>

            <Button
              className="w-full"
              disabled={withdrawMutation.isPending}
              onClick={() => withdrawMutation.mutate(withdrawAmount)}
            >
              {withdrawMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Solicitando...
                </>
              ) : (
                "Solicitar saque"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ReceiptModal
        open={receiptModalOpen}
        receiptId={selectedReceiptId}
        onOpenChange={(open) => {
          setReceiptModalOpen(open);
          if (!open) setSelectedReceiptId(null);
        }}
      />
    </div>
  );
}
