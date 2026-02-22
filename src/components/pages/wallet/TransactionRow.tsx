import React from "react";
import {
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  ShoppingCart,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCurrencyValue } from "./helpers";

interface TransactionRowProps {
  transaction: any;
  onClick?: (id: string) => void;
}

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
    icon: ShoppingCart,
    color: "text-blue-600 bg-blue-100",
    label: "Compra",
  },
  sell: {
    icon: ShoppingCart,
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

export function TransactionRow({ transaction, onClick }: TransactionRowProps) {
  const config = typeConfig[transaction.type] || typeConfig.other;
  const Icon = config.icon;

  const description = transaction.description || "Transação";
  const marketLabel = transaction.marketTitle || null;
  const marketSlug = transaction.marketSlug || null;
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
        <p className={cn("font-semibold", amountTone)}>{amountFormatted}</p>

        {transaction.statusLabel && (
          <Badge className={`${transaction.statusTone || "bg-slate-100 text-slate-700"} mt-1`}>
            {transaction.statusLabel}
          </Badge>
        )}
      </div>
    </div>
  );
}

export default TransactionRow;
