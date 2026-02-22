import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Copy } from "lucide-react";
import InvisibleScrollArea from "./InvisibleScrollArea";
import {
  DEPOSIT_FEE,
  formatCurrencyValue,
  formatExpiresAtLabel,
  formatSecs,
  isFinalStatus,
  mapStatus,
} from "./helpers";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { paymentsClient } from "@/app/api/payments";

interface PixDialogProps {
  open: boolean;
  pixData: any;
  onClose: () => void;
  setPixData: React.Dispatch<React.SetStateAction<any>>;
  refreshUser?: () => void;
  userId?: string;
}

function PixDialog({ open, pixData, onClose, setPixData, refreshUser, userId }: PixDialogProps) {
  const queryClient = useQueryClient();
  const [expiresIn, setExpiresIn] = useState<number | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const pixScrollRef = useRef<HTMLDivElement | null>(null);
  const statusRequestRef = useRef<boolean>(false);
  const finalToastRef = useRef<string | null>(null);

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
  }, [pixData?.expiresAt, setPixData]);

  const isExpiredLocal = useMemo(() => {
    if (!pixData?.expiresAt) return false;
    const ms = new Date(pixData.expiresAt).getTime();
    if (Number.isNaN(ms)) return false;
    return ms <= Date.now();
  }, [pixData?.expiresAt]);

  const mpStatusQuery = useQuery({
    queryKey: ["mp-status", pixData?.paymentId],
    enabled: open && !!pixData?.paymentId && !isFinalStatus(pixData?.status) && !isExpiredLocal,
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
    onClose();
    setPixData(null);
    setQrImage(null);
    setExpiresIn(null);
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

      queryClient.invalidateQueries({ queryKey: ["wallet-balances", userId] });
      queryClient.invalidateQueries({ queryKey: ["wallet-summary", userId] });
      queryClient.invalidateQueries({ queryKey: ["wallet-ledger", userId] });
      queryClient.invalidateQueries({ queryKey: ["wallet-receipts", userId] });
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
      setPixData((prev: any) =>
        prev ? { ...prev, status: "expired", qrCode: null, qrBase64: null } : prev
      );
      setQrImage(null);
    }
  }, [mpStatusQuery.data, pixData?.paymentId, queryClient, refreshUser, setPixData, userId]);

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
    if (!open) return;
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
  }, [open, pixData, qrImage]);

  if (!pixData) return null;

  const pixAmount = Number(pixData?.amount ?? 0) || 0;
  const pixFee = pixAmount * DEPOSIT_FEE;
  const pixNet = Math.max(0, pixAmount - pixFee);

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? closePixModal() : undefined)}>
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
                Expira em <span className="font-medium">{formatExpiresAtLabel(pixData?.expiresAt)}</span>
                {" • "}
                <span className="font-medium tabular-nums">{formatSecs(expiresIn)}</span>
                {mpStatusQuery.isFetching ? <span className="ml-2 text-slate-400">(verificando…)</span> : null}
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
                  Payment id: <span className="text-slate-700 font-medium break-all">{pixData?.paymentId || "—"}</span>
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
                  <img src={qrImage} alt="PIX QR" className="h-80 w-80 rounded-xl bg-white object-contain shadow-sm" />
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 w-full">
                  {pixIsFinal ? (
                    <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 text-center">
                      <span className="font-medium">Pagamento encerrado.</span> Para continuar, gere um novo PIX.
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
                  <pre className="whitespace-pre-wrap break-words text-xs text-slate-700">{pixData?.qrCode || "—"}</pre>
                </div>
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between w-full">
                  <span className="text-xs text-slate-500">Valor</span>
                  <span className="font-semibold text-slate-900 tabular-nums whitespace-nowrap text-sm">
                    {formatCurrencyValue(pixAmount, "BRL")}
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
                            Cobramos <strong>4,99%</strong> para cobrir custos do gateway e processamento.
                            O valor já está descontado no “Você recebe”.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <span className="font-medium text-rose-600 tabular-nums whitespace-nowrap text-sm">
                    - {formatCurrencyValue(pixFee, "BRL")}
                  </span>
                </div>

                <div className="flex items-baseline justify-between w-full">
                  <span className="text-xs text-slate-500">Você recebe</span>
                  <span className="font-bold text-emerald-600 tabular-nums whitespace-nowrap text-sm">
                    {formatCurrencyValue(pixNet, "BRL")}
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
  );
}

export default PixDialog;
