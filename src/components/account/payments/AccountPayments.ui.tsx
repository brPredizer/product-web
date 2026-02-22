import React, { FC } from "react";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PaymentMethod } from "./AccountPayments.types";

export const fieldFocusClass =
  "focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none";

export const SectionHeader: FC<{ icon: React.ReactNode; title: string; subtitle: string }> = ({
  icon,
  title,
  subtitle,
}) => (
  <div className="flex items-start justify-between gap-4">
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
        {icon}
      </div>
      <div>
        <div className="text-base font-semibold text-slate-900">{title}</div>
        <div className="mt-0.5 text-sm text-slate-500">{subtitle}</div>
      </div>
    </div>
  </div>
);

export const EmptyState: FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
  <div className="flex items-center justify-center">
    <div className="flex w-full items-center justify-center gap-3 rounded-xl border border-dashed bg-white px-4 py-3">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
        {icon}
      </div>
      <p className="text-sm text-slate-600">{text}</p>
    </div>
  </div>
);

/** helpers p/ deixar o card mais “premium” */
const format2 = (v?: string | number | null) => {
  if (v === null || v === undefined) return "--";
  const s = String(v).trim();
  if (!s) return "--";
  return s.padStart(2, "0").slice(-2);
};

const formatYY = (v?: string | number | null) => {
  if (v === null || v === undefined) return "--";
  const s = String(v).trim();
  if (!s) return "--";
  return s.length === 4 ? s.slice(-2) : s.padStart(2, "0").slice(-2);
};

const brandAccent = (brandLabel: string) => {
  const b = brandLabel.toLowerCase();
  if (b.includes("visa")) return "from-indigo-500/20 via-slate-50 to-slate-50";
  if (b.includes("master")) return "from-amber-500/20 via-slate-50 to-slate-50";
  if (b.includes("elo")) return "from-emerald-500/20 via-slate-50 to-slate-50";
  if (b.includes("amex")) return "from-cyan-500/20 via-slate-50 to-slate-50";
  return "from-emerald-500/18 via-slate-50 to-slate-50";
};

export const SavedCardItem: FC<{
  method: PaymentMethod;
  isOnlyOne: boolean;
  onRemove: () => void;
  loading?: boolean;
}> = ({ method, isOnlyOne, onRemove, loading }) => {
  const expYY = formatYY(method.cardExpYear ?? null);
  const expMM = format2(method.cardExpMonth ?? null);
  const isDefault = Boolean(method.isDefault || isOnlyOne);

  const brandLabel = String(method.cardBrand || method.mpPaymentMethodId || "CARD").toUpperCase();
  const holder = String(method.cardHolderName || "-").toUpperCase();

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border shadow-sm",
        "hover:-translate-y-[1px] hover:shadow-md",
        "bg-gradient-to-br",
        brandAccent(brandLabel)
      )}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500/70" />

      <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(16,185,129,0.10),transparent_40%),radial-gradient(circle_at_90%_30%,rgba(2,132,199,0.08),transparent_35%)]" />

      <div className="relative p-4">
        {/* topo */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full bg-white/70">
              {brandLabel}
            </Badge>

            {isDefault ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50/80 px-2 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-500/10">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Preferencial
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onRemove}
            disabled={loading}
            className={cn(
              "absolute right-3 top-3 z-20", // dentro do card
              "grid h-9 w-9 place-items-center rounded-full", // bolinha
              "bg-white/70 text-slate-600 ring-1 ring-black/10 shadow-sm",
              "hover:bg-white hover:text-rose-600",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/30",
              loading && "opacity-60 pointer-events-none"
            )}
            title="Remover cartao"
            aria-label="Remover cartao"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* conteúdo */}
        <div className="mt-3 text-left">
          {/* titular */}
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Titular</div>
          <div className="mt-0.5 truncate text-sm font-medium text-slate-900" title={holder}>
            {holder}
          </div>

          {/* número + validade (alinhados e compactos) */}
          <div className="mt-3">
            <div className="flex items-end justify-between gap-3">
              {/* Número */}
              <div className="min-w-0 flex-1">
                <div className="text-[11px] uppercase tracking-wide text-slate-500">Numero</div>

                <div className="mt-0.5 flex items-baseline gap-2">
                  {/* máscara + last4 na MESMA linha e baseline */}
                  <div className="font-mono text-[16px] font-semibold tracking-[0.16em] leading-none text-slate-900">
                    •••• •••• ••••
                  </div>
                  <div className="font-mono text-[16px] font-semibold tracking-[0.16em] leading-none text-slate-900">
                    {method.cardLast4 || "----"}
                  </div>
                </div>
              </div>

              {/* Validade */}
              <div className="shrink-0 text-right">
                <div className="text-[11px] uppercase tracking-wide text-slate-500">Validade</div>
                <div className="mt-0.5 font-mono text-[16px] font-semibold leading-none text-slate-900">
                  {expMM}/{expYY}
                </div>
              </div>
            </div>
          </div>

          {/* se quiser colocar mais infos depois, mantém aqui */}
        </div>
      </div>
    </div>
  );
};
