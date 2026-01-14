"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { walletClient } from "@/api/wallet";
import { paymentsClient } from "@/api/payments";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock,
  QrCode,
  Copy,
} from "lucide-react";
import StatsCard from "@/components/ui/StatsCard";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const DEPOSIT_FEE = 0.025; // 2.5%
const WITHDRAWAL_FEE = 0.075; // 7.5%

type DepositMethod = "PIX" | "CARD";

interface WalletProps {
  user?: any;
  refreshUser?: () => void;
}

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

function formatSecs(s: number | null) {
  if (s == null) return "--:--";
  const mm = Math.floor(s / 60).toString().padStart(2, "0");
  const ss = Math.floor(s % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

function formatExpiresAtLabel(expiresAt: any) {
  if (!expiresAt) return "—";
  const d = new Date(expiresAt);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, "dd/MM, HH:mm", { locale: ptBR });
}

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

// Scroll invisível (mantém scroll, mas sem a barra feia)
const InvisibleScrollArea = React.forwardRef<
  HTMLDivElement,
  { className?: string; children: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      {children}
    </div>
  );
});
InvisibleScrollArea.displayName = "InvisibleScrollArea";

function mapLedgerEntries(entries: any[] = []) {
  const typeMap: any = {
    DEPOSIT: "deposit",
    DEPOSIT_GATEWAY: "deposit",
    WITHDRAWAL: "withdrawal",
    WITHDRAWAL_REQUEST: "withdrawal",
    WITHDRAWAL_APPROVED: "withdrawal",
    WITHDRAWAL_REJECTED: "withdrawal",
    FEE: "fee",
    ORDER: "buy",
    BUY: "buy",
    SELL: "sell",
    PAYOUT: "payout",
  };

  const statusMap: any = {
    PENDING: { key: "pending", label: "Pendente", tone: "bg-amber-100 text-amber-700" },
    REQUESTED: { key: "pending", label: "Pendente", tone: "bg-amber-100 text-amber-700" },
    APPROVED: { key: "approved", label: "Aprovado", tone: "bg-emerald-100 text-emerald-700" },
    REJECTED: { key: "rejected", label: "Rejeitado", tone: "bg-rose-100 text-rose-700" },
    CANCELLED: { key: "cancelled", label: "Cancelado", tone: "bg-slate-100 text-slate-700" },
    FAILED: { key: "failed", label: "Falhou", tone: "bg-rose-100 text-rose-700" },
    COMPLETED: { key: "completed", label: "Concluído", tone: "bg-emerald-100 text-emerald-700" },
  };

  const descriptionMap: any = {
    withdrawal: "Saque",
    deposit: "Depósito",
    fee: "Taxa",
    market: "Mercado",
    order: "Compra",
    paymentintent: "Depósito",
    payment: "Pagamento",
    payout: "Pagamento",
  };

  const typeFallbackMap: any = {
    withdrawal: "withdrawal",
    deposit: "deposit",
    fee: "fee",
    order: "buy",
    payment: "payout",
    payout: "payout",
    paymentintent: "deposit",
  };

  const getDescriptionTokens = (value: any) => {
    const normalized = String(value).trim().toLowerCase();
    return [
      normalized,
      normalized.replace(/[^a-z0-9]+/g, ""),
      normalized.replace(/[^a-z0-9]+/g, "_"),
    ];
  };

  const translateDescription = (value: any) => {
    if (!value) return value;
    const tokens = getDescriptionTokens(value);
    for (const token of tokens) {
      if (descriptionMap[token]) return descriptionMap[token];
    }
    return value;
  };

  const resolveTypeFromText = (value: any) => {
    if (!value) return null;
    const tokens = getDescriptionTokens(value);
    for (const token of tokens) {
      if (typeFallbackMap[token]) return typeFallbackMap[token];
    }
    return null;
  };

  return entries.map((entry: any, index: number) => {
    const rawType = String(entry?.type || "");
    let normalizedType =
      typeMap[rawType] || typeMap[rawType.toUpperCase()] || "other";

    const amount = Number(entry?.amount ?? 0);

    const rawStatus = String(entry?.status || "");
    const normalizedStatus =
      statusMap[rawStatus] || statusMap[rawStatus.toUpperCase()] || null;

    const rawDescription =
      entry?.description || entry?.referenceType || entry?.type || "Movimento";

    if (normalizedType === "other") {
      normalizedType = resolveTypeFromText(rawDescription) || normalizedType;
    }

    return {
      id: entry?.id || entry?.referenceId || `${rawType || "entry"}-${index}`,
      type: normalizedType,
      amount,
      net_amount: Math.abs(amount),
      fee: Number(entry?.fee ?? 0),
      status: normalizedStatus?.key || entry?.status || null,
      statusLabel: normalizedStatus?.label || null,
      statusTone: normalizedStatus?.tone || null,
      description: translateDescription(rawDescription),
      createdAt: entry?.createdAt ?? entry?.created_date ?? null,
    };
  });
}

function TransactionRow({ transaction }: { transaction: any }) {
  const typeConfig: any = {
    deposit: {
      icon: ArrowDownCircle,
      color: "text-emerald-600 bg-emerald-100",
      label: "Depósito",
      sign: "+",
    },
    withdrawal: {
      icon: ArrowUpCircle,
      color: "text-rose-600 bg-rose-100",
      label: "Saque",
      sign: "-",
    },
    fee: {
      icon: AlertCircle,
      color: "text-amber-600 bg-amber-100",
      label: "Taxa",
      sign: "-",
    },
    buy: {
      icon: CreditCard,
      color: "text-blue-600 bg-blue-100",
      label: "Compra",
      sign: "-",
    },
    sell: {
      icon: CreditCard,
      color: "text-purple-600 bg-purple-100",
      label: "Venda",
      sign: "+",
    },
    payout: {
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-100",
      label: "Pagamento",
      sign: "+",
    },
    other: {
      icon: AlertCircle,
      color: "text-slate-600 bg-slate-100",
      label: "Movimento",
      sign: "",
    },
  };

  const config = typeConfig[transaction.type] || typeConfig.other;
  const Icon = config.icon;

  const createdAt = transaction.createdAt;
  const createdLabel = createdAt
    ? format(new Date(createdAt), "d 'de' MMM, HH:mm", { locale: ptBR })
    : "-";

  return (
    <div className="p-4 sm:p-6 flex items-center gap-4 hover:bg-slate-50 transition-colors">
      <div className={cn("p-2.5 rounded-full", config.color)}>
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900">{config.label}</p>
        <p className="text-sm text-slate-500 truncate">
          {transaction.description || transaction.market_title || "-"}
        </p>
        <p className="text-xs text-slate-400 mt-1">{createdLabel}</p>
      </div>

      <div className="text-right">
        <p
          className={cn(
            "font-semibold",
            config.sign === "+" ? "text-emerald-600" : "text-slate-900"
          )}
        >
          {config.sign}R$ {(transaction.net_amount || transaction.amount || 0).toFixed(2)}
        </p>

        {transaction.fee > 0 && (
          <p className="text-xs text-slate-500">Taxa: R$ {transaction.fee.toFixed(2)}</p>
        )}

        {transaction.statusLabel && (
          <Badge className={`${transaction.statusTone || "bg-slate-100 text-slate-700"} mt-1`}>
            {transaction.statusLabel}
          </Badge>
        )}
      </div>
    </div>
  );
}

export default function WalletView({ user, refreshUser }: WalletProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // modais
  const [depositSetupOpen, setDepositSetupOpen] = useState(false);
  const [pixOpen, setPixOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  // depósito
  const [depositAmountStr, setDepositAmountStr] = useState("");
  const [depositMethod, setDepositMethod] = useState<DepositMethod>("PIX");

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

  const paymentMethodsQuery = useQuery({
    queryKey: ["payment-methods", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await (paymentsClient as any).getPaymentMethods?.();
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
    const raw = ledgerQuery.data as any;
    const entries = Array.isArray(raw) ? raw : raw?.entries ?? raw?.data ?? [];
    return mapLedgerEntries(entries);
  }, [ledgerQuery.data]);

  const cardMethods = useMemo(() => {
    const raw = paymentMethodsQuery.data as any;
    const list = Array.isArray(raw) ? raw : raw?.methods ?? raw?.data ?? [];
    return (list || []).filter(
      (m: any) =>
        (m?.type || m?.paymentType || "CARD").toUpperCase().includes("CARD") || m?.cardLast4
    );
  }, [paymentMethodsQuery.data]);

  const isLoading = balancesQuery.isLoading || ledgerQuery.isLoading;

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

      // ✅ guarda também o amount do PIX pra UI ficar consistente
      setPixData({ ...normalized, intent: data?.intent });
      toast.success("PIX gerado.");

      setDepositSetupOpen(false);
      setPixOpen(true);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Falha ao gerar PIX.");
    },
  });

  // ============
  // CONTADOR: só conta e marca expired localmente. NÃO faz request.
  // ============
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

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [pixData?.expiresAt]);

  const isExpiredLocal = useMemo(() => {
    if (!pixData?.expiresAt) return false;
    const ms = new Date(pixData.expiresAt).getTime();
    if (Number.isNaN(ms)) return false;
    return ms <= Date.now();
  }, [pixData?.expiresAt]);

  // ============
  // POLLING: para sozinho quando isFinal=true ou status final.
  // ============
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

  // ✅ aplica resposta do polling + FECHA AUTOMÁTICO quando aprovado final
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

      // ✅ FECHA SÓ quando aprovado final
      closePixModal();
      return;
    }

    if (normalized === "rejected") {
      toast.error("Pagamento recusado/cancelado. Gere um novo PIX.");
      setPixData((prev: any) =>
        prev ? { ...prev, qrCode: null, qrBase64: null } : prev
      );
      setQrImage(null);
      return;
    }

    if (normalized === "expired" || statusDetail === "expired") {
      toast.info("PIX expirado. Gere um novo pagamento.");
      setPixData((prev: any) =>
        prev ? { ...prev, status: "expired", qrCode: null, qrBase64: null } : prev
      );
      setQrImage(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mpStatusQuery.data]);

  // UI helpers
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

  // Rola até o final quando abrir o modal PIX
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
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            onClick={() => router.push("/sign-in")}
          >
            Entrar
          </Button>
        </div>
      </div>
    );
  }

  const pixAmount = Number(pixData?.amount ?? depositAmount) || 0;
  const pixFee = pixAmount * DEPOSIT_FEE;
  const pixNet = Math.max(0, pixAmount - pixFee);

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
              <p className="text-4xl font-bold">R$ {availableBalance.toFixed(2)}</p>
            </div>

            <div className="flex gap-3">
              {/* Modal 1: Depósito */}
              <Dialog open={depositSetupOpen} onOpenChange={(v) => setDepositSetupOpen(v)}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <ArrowDownCircle className="w-4 h-4 mr-2" />
                    Depositar
                  </Button>
                </DialogTrigger>

                <DialogContent className="w-[min(88vw,720px)] max-h-[92vh] overflow-hidden p-0 focus:outline-none focus-visible:outline-none focus:ring-0 ring-0">
                  <div className="border-b border-slate-100 p-5">
                    <DialogHeader>
                      <DialogTitle>Depositar</DialogTitle>
                      <DialogDescription>Informe o valor e escolha o método.</DialogDescription>
                    </DialogHeader>
                  </div>

                  <InvisibleScrollArea className="max-h-[calc(92vh-72px-20px)] pt-1 pb-5 px-5 space-y-5">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">
                        Valor do depósito
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                          R$
                        </span>
                        <Input
                          value={depositAmountStr}
                          onChange={(e: any) => setDepositAmountStr(clampMoneyInput(e.target.value))}
                          inputMode="decimal"
                          placeholder="0,00"
                          className="pl-10 h-12 text-lg"
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-2">Mínimo: R$ 0,01</p>
                    </div>

                    {depositAmount > 0 && (
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Valor</span>
                          <span className="font-medium">R$ {depositAmount.toFixed(2)}</span>
                        </div>

                        <div className="mt-2 flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-600">Taxa (2,5%)</span>
                            <TooltipProvider delayDuration={120}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className="h-5 w-5 rounded-full border border-slate-300 text-slate-600 flex items-center justify-center text-[11px] font-bold select-none"
                                    aria-label="Entenda a taxa"
                                  >
                                    i
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="top"
                                  align="start"
                                  sideOffset={10}
                                  className="z-[9999] max-w-[280px] rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700 shadow-lg"
                                >
                                  <p className="font-semibold text-slate-900 mb-1">Tarifa de processamento</p>
                                  <p>
                                    Cobramos <strong>2,5%</strong> para cobrir custos do gateway e processamento.
                                    O desconto já aparece em “Você recebe”.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>

                          <span className="font-medium text-rose-600 text-sm">
                            - R$ {depositFee.toFixed(2)}
                          </span>
                        </div>

                        <div className="mt-3 border-t pt-3 flex items-center justify-between">
                          <span className="font-medium text-slate-900">Você recebe</span>
                          <span className="font-bold text-emerald-600 text-sm">
                            R$ {depositNet.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}

                    {depositAmount > 0 ? (
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-2 block">
                          Método de pagamento
                        </label>

                        <Tabs value={depositMethod} onValueChange={(v) => setDepositMethod(v as DepositMethod)}>
                          <TabsList className="w-full grid grid-cols-1">
                            <TabsTrigger value="PIX">PIX</TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-slate-100 bg-yellow-50 p-3 text-sm text-slate-700">
                        Informe um valor válido para escolher o método de pagamento.
                      </div>
                    )}

                    {depositMethod === "PIX" && (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex gap-3">
                        <QrCode className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
                        <div className="text-sm text-slate-600">
                          No PIX, você recebe um QR Code e o código copia e cola.
                        </div>
                      </div>
                    )}

                    {depositMethod === "PIX" ? (
                      <div className="mt-2 border-t border-slate-100 pt-4 flex gap-2 mb-6">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setDepositSetupOpen(false)}
                          disabled={depositMutation.isPending}
                        >
                          Cancelar
                        </Button>

                        <Button
                          className="w-full bg-emerald-600 hover:bg-emerald-700"
                          disabled={depositAmount < 0.01 || depositMutation.isPending}
                          onClick={() => depositMutation.mutate({ amount: depositAmount })}
                        >
                          {depositMutation.isPending ? "Gerando..." : "Gerar PIX"}
                        </Button>
                      </div>
                    ) : null}
                  </InvisibleScrollArea>
                </DialogContent>
              </Dialog>

              {/* Modal 2: PIX */}
              <Dialog open={pixOpen} onOpenChange={setPixOpen}>
                <DialogContent className="w-[min(98vw,860px)] max-h-[92vh] overflow-hidden p-0 focus:outline-none focus-visible:outline-none focus:ring-0 ring-0">
                  <div className="border-b border-slate-100 p-5 flex items-start justify-between gap-3">
                    <div>
                      <DialogHeader>
                        <DialogTitle>Pagamento via PIX</DialogTitle>
                        <DialogDescription>Escaneie o QR ou copie o código.</DialogDescription>
                      </DialogHeader>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge
                          className={cn(
                            "capitalize",
                            (pixData?.status || "pending").toLowerCase() === "approved" ||
                              (pixData?.status || "").toLowerCase() === "completed"
                              ? "bg-emerald-100 text-emerald-700"
                              : pixIsFinal
                              ? "bg-slate-100 text-slate-700"
                              : "bg-amber-100 text-amber-700"
                          )}
                        >
                          {pixData?.status || "pending"}
                        </Badge>

                        <span className="text-xs text-slate-500">
                          Expira em{" "}
                          <span className="font-medium">
                            {formatExpiresAtLabel(pixData?.expiresAt)}
                          </span>
                          {" • "}
                          <span className="font-medium tabular-nums">{formatSecs(expiresIn)}</span>
                          {mpStatusQuery.isFetching ? (
                            <span className="ml-2 text-slate-400">(verificando…)</span>
                          ) : null}
                        </span>
                      </div>
                    </div>
                  </div>

                  <InvisibleScrollArea ref={pixScrollRef} className="max-h-[calc(92vh-84px)] p-5">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 mb-12">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">QR Code</p>
                          <div className="mt-1 text-xs text-slate-500">
                            Payment id:{" "}
                            <span className="text-slate-700 font-medium break-all">
                              {pixData?.paymentId || "—"}
                            </span>
                          </div>
                        </div>

                        <Button
                          className="bg-emerald-600 hover:bg-emerald-700 h-9 px-3 text-sm rounded-lg"
                          onClick={copyPix}
                          disabled={!pixData?.qrCode || pixIsFinal}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copiar PIX
                        </Button>
                      </div>

                      <div className="mt-4 flex items-center justify-center">
                        {qrImage ? (
                          <div className="rounded-2xl bg-slate-50 p-5">
                            <img
                              src={qrImage}
                              alt="PIX QR"
                              className="h-80 w-80 rounded-xl bg-white object-contain shadow-sm"
                            />
                          </div>
                        ) : (
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 w-full">
                            {pixIsFinal ? (
                              <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 text-center">
                                <span className="font-medium">Pagamento encerrado.</span>{" "}
                                Para continuar, gere um novo PIX.
                              </div>
                            ) : (
                              <div>QR indisponível. Use o código abaixo.</div>
                            )}
                          </div>
                        )}
                      </div>

                      {!pixIsFinal && (
                        <div className="mt-6">
                          <p className="text-sm font-semibold text-slate-900">Código PIX</p>
                          <p className="text-xs text-slate-500 mt-1">Copie e cole no app do banco.</p>

                          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <pre className="whitespace-pre-wrap break-words text-xs text-slate-700">
                              {pixData?.qrCode || "—"}
                            </pre>
                          </div>
                        </div>
                      )}

                      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-baseline justify-between w-full">
                            <span className="text-xs text-slate-500">Valor</span>
                            <span className="font-semibold text-slate-900 tabular-nums whitespace-nowrap text-sm">
                              R$ {pixAmount.toFixed(2)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">Taxa</span>
                              <TooltipProvider delayDuration={120}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      className="h-5 w-5 rounded-full border border-slate-300 text-slate-600 flex items-center justify-center text-[11px] font-bold select-none"
                                      aria-label="Entenda a taxa"
                                    >
                                      i
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent
                                    side="top"
                                    align="start"
                                    sideOffset={10}
                                    className="z-[9999] max-w-[280px] rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700 shadow-lg"
                                  >
                                    <p className="font-semibold text-slate-900 mb-1">Tarifa de processamento</p>
                                    <p>
                                      Cobramos <strong>2,5%</strong> para cobrir custos do gateway e processamento.
                                      O valor já está descontado no “Você recebe”.
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>

                            <span className="font-medium text-rose-600 tabular-nums whitespace-nowrap text-sm">
                              - R$ {(pixAmount * DEPOSIT_FEE).toFixed(2)}
                            </span>
                          </div>

                          <div className="flex items-baseline justify-between w-full">
                            <span className="text-xs text-slate-500">Você recebe</span>
                            <span className="font-bold text-emerald-600 tabular-nums whitespace-nowrap text-sm">
                              R$ {(Math.max(0, pixAmount - pixAmount * DEPOSIT_FEE)).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6">
                        <Button variant="outline" className="w-full h-11 rounded-xl" onClick={closePixModal}>
                          Fechar
                        </Button>
                      </div>
                    </div>
                  </InvisibleScrollArea>
                </DialogContent>
              </Dialog>

              {/* Modal 3: Saque */}
              <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-rose-600 hover:bg-rose-700 text-white">
                    <ArrowUpCircle className="w-4 h-4 mr-2" />
                    Sacar
                  </Button>
                </DialogTrigger>

                <DialogContent className="w-[min(96vw,720px)] max-h-[92vh] overflow-hidden p-0 focus:outline-none focus-visible:outline-none focus:ring-0 ring-0">
                  <div className="border-b border-slate-100 p-5">
                    <DialogHeader>
                      <DialogTitle>Sacar</DialogTitle>
                      <DialogDescription>Transfira seu saldo para sua conta bancária.</DialogDescription>
                    </DialogHeader>
                  </div>

                  <InvisibleScrollArea className="max-h-[calc(92vh-72px-96px)] p-5 space-y-5">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">
                        Valor do saque
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                          R$
                        </span>
                        <Input
                          value={withdrawAmountStr}
                          onChange={(e: any) => setWithdrawAmountStr(clampMoneyInput(e.target.value))}
                          inputMode="decimal"
                          placeholder="0,00"
                          className="pl-10 h-12 text-lg"
                        />
                      </div>
                      <p className="text-sm text-slate-500 mt-2">
                        Saldo disponível: R$ {availableBalance.toFixed(2)}
                      </p>
                    </div>

                    {withdrawAmount > 0 && (
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Valor solicitado</span>
                          <span className="font-medium">R$ {withdrawAmount.toFixed(2)}</span>
                        </div>
                        <div className="mt-2 flex justify-between text-sm">
                          <span className="text-slate-600">Taxa (7,5%)</span>
                          <span className="font-medium text-rose-600 text-sm">
                            - R$ {withdrawFee.toFixed(2)}
                          </span>
                        </div>
                        <div className="mt-3 border-t pt-3 flex justify-between">
                          <span className="font-medium">Você recebe</span>
                          <span className="font-bold text-emerald-600">
                            R$ {withdrawNet.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </InvisibleScrollArea>

                  <div className="border-t border-slate-100 p-5 flex gap-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setWithdrawOpen(false)}
                      disabled={withdrawMutation.isPending}
                    >
                      Cancelar
                    </Button>

                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      disabled={
                        withdrawAmount < 10 ||
                        withdrawAmount > availableBalance ||
                        withdrawMutation.isPending
                      }
                      onClick={() => withdrawMutation.mutate(withdrawAmount)}
                    >
                      {withdrawMutation.isPending ? "Processando..." : "Confirmar Saque"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <StatsCard title="Total Depositado" value={`R$ ${totals.deposited.toFixed(2)}`} icon={ArrowDownCircle} />
          <StatsCard title="Total Sacado" value={`R$ ${totals.withdrawn.toFixed(2)}`} icon={ArrowUpCircle} />
          <StatsCard title="Total Apostado" value={`R$ ${totals.wagered.toFixed(2)}`} icon={CreditCard} />
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
                <TransactionRow key={tx.id} transaction={tx} />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-semibold text-slate-900 mb-2">Sem transações</h3>
              <p className="text-slate-500">Suas transações aparecerão aqui.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
