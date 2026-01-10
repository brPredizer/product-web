import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  value: number;
  previousValue?: number | null;
  format?: 'number' | 'currency' | 'percentage' | string;
  icon?: React.ComponentType<any> | null;
  trend?: string;
  onDrillDown?: (() => void) | null;
  subtitle?: string | null;
  loading?: boolean;
};

export default function KPICard({
  title,
  value,
  previousValue,
  format = 'number',
  icon: Icon,
  trend,
  onDrillDown,
  subtitle,
  loading
}: Props) {
  const changeNum = (previousValue) ? ((value - previousValue) / previousValue * 100) : 0;
  const change = Number(changeNum.toFixed(1));
  const isPositive = change >= 0;

  const formatValue = (val: number) => {
    if (format === 'currency') return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    if (format === 'percentage') return `${val.toFixed(1)}%`;
    return val.toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <Card className="p-4 animate-pulse">
        <div className="h-3 bg-slate-200 rounded w-20 mb-3" />
        <div className="h-6 bg-slate-200 rounded w-24 mb-2" />
        <div className="h-2 bg-slate-200 rounded w-12" />
      </Card>
    );
  }

  return (
    <Card className="p-4 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{formatValue(value)}</p>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="p-2 rounded-lg bg-slate-50">
            <Icon className="w-4 h-4 text-slate-600" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {isPositive ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
          )}
          <span className={cn(
            'text-xs font-semibold',
            isPositive ? 'text-emerald-600' : 'text-rose-600'
          )}>
            {isPositive ? '+' : ''}{change}%
          </span>
          <span className="text-xs text-slate-500">vs período anterior</span>
        </div>
        {onDrillDown && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDrillDown}
            className="h-6 w-6 p-0 bg-emerald-50 hover:bg-emerald-100 text-emerald-600"
          >
            <ExternalLink className="w-3 h-3" />
          </Button>
        )}
      </div>
    </Card>
  );
}
