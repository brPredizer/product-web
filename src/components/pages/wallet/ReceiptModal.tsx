import React from "react";
import { useQuery } from "@tanstack/react-query";
import { DialogClose } from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Download, X } from "lucide-react";
import { walletClient } from "@/app/api/wallet";
import {
  formatCurrencyValue,
  formatDateTimeFull,
  normalizeReceiptType,
  RECEIPT_TYPE_LABELS,
  shortReceiptId,
} from "./helpers";

interface ReceiptModalProps {
  open: boolean;
  receiptId: string | null;
  onOpenChange: (open: boolean) => void;
}

function ReceiptModal({ open, receiptId, onOpenChange }: ReceiptModalProps) {
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
  const amountLabel = `${sign}${formatCurrencyValue(
    Math.abs(amountNumber),
    receipt?.currency || "BRL"
  )}`;
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

            body * { visibility: hidden !important; }

            [data-radix-dialog-overlay] { display: none !important; }

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

            .receipt-print, .receipt-print * { visibility: visible !important; }

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
                  {market.slug ? <p className="text-xs text-emerald-700">{market.slug}</p> : null}
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

export default ReceiptModal;
