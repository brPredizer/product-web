import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, QrCode } from "lucide-react";
import { toast } from "sonner";
import InvisibleScrollArea from "./InvisibleScrollArea";
import {
  clampMoneyInput,
  DEPOSIT_FEE,
  DepositMethod,
  formatBrlMoneyInput,
  formatCardLabel,
  formatCurrencyValue,
  getMercadoPagoInstance,
  getMpDeviceId,
  inferDocumentType,
  normalizePaymentMethodId,
  normalizePixResponse,
  onlyDigits,
  resolveMpCardId,
  resolvePaymentMethodId,
} from "./helpers";
import { walletClient } from "@/app/api/wallet";
import { paymentsClient } from "@/app/api/payments";

interface DepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  refreshUser?: () => void;
  onPixReady: (pixData: any) => void;
}

function DepositDialog({ open, onOpenChange, user, refreshUser, onPixReady }: DepositDialogProps) {
  const queryClient = useQueryClient();
  const [depositAmountStr, setDepositAmountStr] = useState(() => formatBrlMoneyInput("0").formatted);
  const [depositMethod, setDepositMethod] = useState<DepositMethod>("PIX");
  const [selectedCardId, setSelectedCardId] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardInstallments, setCardInstallments] = useState("1");
  const [cardOrderResult, setCardOrderResult] = useState<any>(null);
  const [payerEmail, setPayerEmail] = useState("");
  const [payerDocument, setPayerDocument] = useState("");

  const paymentMethodsQuery = useQuery({
    queryKey: ["payment-methods", user?.id],
    enabled: open && !!user?.id,
    queryFn: async () => {
      const res =
        (await (paymentsClient as any).getPaymentMethods?.()) ??
        (await (paymentsClient as any).getMethods?.());
      return res ?? [];
    },
  });

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

  useEffect(() => {
    if (!open) {
      setDepositAmountStr(formatBrlMoneyInput("0").formatted);
      setDepositMethod("PIX");
      setSelectedCardId("");
      setCardCvv("");
      setCardInstallments("1");
      setCardOrderResult(null);
    }
  }, [open]);

  const depositAmount = useMemo(
    () => formatBrlMoneyInput(depositAmountStr).numeric,
    [depositAmountStr]
  );
  const depositFee = useMemo(() => depositAmount * DEPOSIT_FEE, [depositAmount]);
  const depositNet = useMemo(
    () => Math.max(0, depositAmount - depositFee),
    [depositAmount, depositFee]
  );

  const selectedCard = useMemo(
    () =>
      usableCardMethods.find(
        (method: any) => String(resolveMpCardId(method) || "") === String(selectedCardId || "")
      ),
    [usableCardMethods, selectedCardId]
  );

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

      onPixReady({ ...normalized, intent: data?.intent, amount: depositAmount });
      toast.success("PIX gerado.");

      queryClient.invalidateQueries({ queryKey: ["wallet-receipts", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["wallet-summary", user?.id] });
      onOpenChange(false);
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

      const status = String(data?.status ?? data?.Status ?? "").toLowerCase();
      const normalizedStatus = status === "approved" || status === "completed" ? "approved" : status;
      if (normalizedStatus === "approved") {
        toast.success("Pagamento aprovado. Atualizando saldo...");
        queryClient.invalidateQueries({ queryKey: ["wallet-balances", user?.id] });
        queryClient.invalidateQueries({ queryKey: ["wallet-summary", user?.id] });
        queryClient.invalidateQueries({ queryKey: ["wallet-ledger", user?.id] });
        queryClient.invalidateQueries({ queryKey: ["wallet-receipts", user?.id] });
        refreshUser?.();
        onOpenChange(false);
        return;
      }

      if (normalizedStatus === "rejected") {
        toast.error("Pagamento recusado. Tente novamente.");
        return;
      }

      toast.message("Pagamento em processamento. Acompanhe o status.");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Falha ao processar cartão.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(88vw,720px)] max-h-[92vh] overflow-hidden p-0 focus:outline-none focus-visible:outline-none focus:ring-0 ring-0">
        <div className="border-b border-slate-100 p-5">
          <DialogHeader>
            <DialogTitle>Depositar</DialogTitle>
            <DialogDescription>Informe o valor e escolha o método.</DialogDescription>
          </DialogHeader>
        </div>

        <InvisibleScrollArea className="max-h-[calc(92vh-72px-20px)] pt-1 pb-5 px-5 space-y-5">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Valor do depósito</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">R$</span>
              <Input
                value={depositAmountStr}
                onChange={(e: any) => setDepositAmountStr(formatBrlMoneyInput(e.target.value).formatted)}
                inputMode="numeric"
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
                <span className="font-medium">{formatCurrencyValue(depositAmount, "BRL")}</span>
              </div>

              <div className="mt-2 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Taxa (4,99%)</span>
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
                          O desconto já aparece em “Você recebe”.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <span className="font-medium text-rose-600 text-sm">
                  - {formatCurrencyValue(depositFee, "BRL")}
                </span>
              </div>

              <div className="mt-3 border-t pt-3 flex items-center justify-between">
                <span className="font-medium text-slate-900">Você recebe</span>
                <span className="font-bold text-emerald-600 text-sm">
                  {formatCurrencyValue(depositNet, "BRL")}
                </span>
              </div>
            </div>
          )}

          {depositAmount > 0 ? (
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Método de pagamento</label>

              <Tabs value={depositMethod} onValueChange={(v) => setDepositMethod(v as DepositMethod)}>
                <TabsList
                  className={`w-full grid ${usableCardMethods.length > 0 ? "grid-cols-2" : "grid-cols-1"}`}
                >
                  <TabsTrigger value="PIX">PIX</TabsTrigger>
                  {usableCardMethods.length > 0 ? <TabsTrigger value="CARD">Cartao</TabsTrigger> : null}
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
              <div className="text-sm text-slate-600">No PIX, você recebe um QR Code e o código copia e cola.</div>
            </div>
          )}

          {depositMethod === "CARD" ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
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
                  {!selectedCard ? <p className="text-xs text-rose-600">Selecione um cartão salvo.</p> : null}
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
                  <Input
                    value={cardCvv}
                    onChange={(e) => setCardCvv(onlyDigits(e.target.value).slice(0, 4))}
                    placeholder="***"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">Email do pagador</p>
                  <Input
                    value={payerEmail}
                    onChange={(e) => setPayerEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">Documento do pagador (CPF/CNPJ)</p>
                <Input
                  value={payerDocument}
                  onChange={(e) => setPayerDocument(onlyDigits(e.target.value).slice(0, 14))}
                  placeholder="Somente números"
                />
                <p className="text-xs text-slate-500">Detectado: {inferDocumentType(onlyDigits(payerDocument || ""))}</p>
              </div>

              <Button
                className="w-full"
                disabled={cardOrderMutation.isPending || depositAmount < 0.01}
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
                <div className="text-xs text-slate-500 break-all">Resultado: {JSON.stringify(cardOrderResult)}</div>
              ) : null}
            </div>
          ) : null}

          {depositMethod === "PIX" ? (
            <div className="mt-2 border-t border-slate-100 pt-4 flex gap-2 mb-6">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onOpenChange(false)}
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
          ) : (
            <div className="mt-2 border-t border-slate-100 pt-4 flex gap-2 mb-6">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onOpenChange(false)}
                disabled={cardOrderMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={depositAmount < 0.01 || cardOrderMutation.isPending}
                onClick={() => cardOrderMutation.mutate()}
              >
                {cardOrderMutation.isPending ? "Processando..." : "Confirmar pagamento"}
              </Button>
            </div>
          )}
        </InvisibleScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default DepositDialog;
