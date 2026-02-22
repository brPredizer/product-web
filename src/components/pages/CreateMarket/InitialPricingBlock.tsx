"use client";

import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { clampNumber } from "./utils";

// Workarounds: some UI primitives are untyped JS; treat them as loosely-typed React components
const LabelC = (Label as unknown) as React.ComponentType<any>;
const BadgeC = (Badge as unknown) as React.ComponentType<any>;
const InputC = (Input as unknown) as React.ComponentType<any>;

const InitialPricingBlock: React.FC<{
  yesPercent: number;
  setYesPercent: (v: number) => void;
  categoryLabel?: string;
  closingDate?: string;
}> = ({ yesPercent, setYesPercent, categoryLabel = 'â€”' }) => {
  const yesInt = clampNumber(parseInt(String(yesPercent ?? 50), 10), 0, 100);
  const noInt = 100 - yesInt;

  return (
    <div className="space-y-1.5">
      <LabelC className="text-sm font-semibold text-slate-700">
        Probabilidade inicial (SIM) (%)
      </LabelC>
      <InputC
        type="number"
        inputMode="numeric"
        min={0}
        max={100}
        step={1}
        value={yesInt}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const v = clampNumber(parseInt(e.target.value || '0', 10), 0, 100);
          setYesPercent(v);
        }}
        className={cn(
          "h-10 w-full tabular-nums",
          yesInt <= 0 || yesInt >= 100 ? "border-amber-300 focus-visible:ring-amber-200" : ""
        )}
      />
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <BadgeC className="bg-emerald-50 text-emerald-700 border border-emerald-200">
          SIM: {yesInt}%
        </BadgeC>
        <BadgeC className="bg-rose-50 text-rose-700 border border-rose-200">
          NÃO: {noInt}%
        </BadgeC>
      </div>
      <p className="text-xs text-slate-500">
        Mercado binÃ¡rio: o <b>NÃO</b> Ã© calculado automaticamente como <b>100% âˆ’ SIM</b>.
      </p>
      {(yesInt <= 0 || yesInt >= 100) && (
        <p className="text-xs text-amber-700">
          Dica: valores 0% ou 100% travam o preÃ§o; em produÃ§Ã£o use algo entre 5â€“95% para liquidez.
        </p>
      )}
    </div>
  );
};

export default InitialPricingBlock;
