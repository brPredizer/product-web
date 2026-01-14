"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CreditCard, ShieldCheck } from "lucide-react";

type Props = {
    orderId: string;
    amount: number;
    payerEmail?: string;
    endpoint?: string;
    buttonLabel?: string;
    className?: string;
    onSuccess?: (payload: any) => void;
    submitMode?: "internal" | "external";
    idPrefix?: string;
};

export default function MpCardCheckoutOneShot({
    orderId,
    amount,
    payerEmail,
    buttonLabel,
    className,
    onSuccess,
}: Props) {
    // Componente simplificado: toda a lógica do cartão foi removida.
    // Mantemos a API pública mínima para não quebrar consumidores.

    const handleFallback = () => {
        // Notifica o chamador que o fluxo de cartão foi removido
        onSuccess?.({ skipped: true, orderId, amount });
    };

    return (
        <div className={cn("rounded-2xl border-none bg-white p-4", className)}>
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-3xl bg-slate-900 text-white flex items-center justify-center">
                    <CreditCard className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 leading-5">Cartão (removido)</div>
                    <div className="text-xs text-slate-500 leading-4">A lógica de captura de cartão foi removida.</div>
                </div>
            </div>

            <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-start gap-2 text-xs text-slate-600">
                    <ShieldCheck className="h-4 w-4 mt-0.5 text-slate-500" />
                    <div>
                        Pagamentos com cartão não estão mais suportados neste componente. Use outro método de pagamento.
                    </div>
                </div>

                <Button className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800" onClick={handleFallback}>
                    {buttonLabel || "Continuar"}
                </Button>
            </div>
        </div>
    );
}
