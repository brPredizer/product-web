import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowDownCircle, Target } from 'lucide-react';

type Transaction = {
  created_date?: string | number | Date | null;
  type?: string;
  amount?: number | null;
};

type GroupedItem = {
  date: string;
  dailyDeposits: number;
  totalDeposits: number;
  goal: number;
};

export default function DepositsChart({ allTransactions = [], period }: { allTransactions?: Transaction[]; period?: any }) {
  const [depositGoal, setDepositGoal] = useState<number>(1000);

  const groupByDate = (): GroupedItem[] => {
    const grouped: Record<string, GroupedItem> = {};

    (allTransactions || []).filter(t => t.type === 'deposit').forEach(tx => {
      const date = new Date(tx.created_date || Date.now());
      const dateKey = date.toISOString().split('T')[0];

      if (!grouped[dateKey]) {
        grouped[dateKey] = { date: dateKey, dailyDeposits: 0, totalDeposits: 0, goal: depositGoal };
      }

      grouped[dateKey].dailyDeposits += Number(tx.amount ?? 0);
    });

    const sorted = Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
    let cumulative = 0;
    sorted.forEach(item => {
      cumulative += item.dailyDeposits;
      item.totalDeposits = cumulative;
      item.goal = depositGoal;
    });

    return sorted;
  };

  const data = groupByDate();

  const latestData = data.length > 0 ? data[data.length - 1] : null;
  const totalDeposits = latestData?.totalDeposits ?? 0;
  const dailyDeposits = latestData?.dailyDeposits ?? 0;
  const totalDepositCount = (allTransactions || []).filter(t => t.type === 'deposit').length;

  const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
          <p className="text-sm font-medium text-slate-900 mb-2">{new Date(label).toLocaleDateString('pt-BR')}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: R$ {Number(entry.value ?? 0).toFixed(2)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomLegend: React.FC = () => {
    return (
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500">Depósitos Diários</span>
            <span className="text-xs font-semibold text-blue-600">R$ {dailyDeposits.toFixed(2)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500">Total Acumulado</span>
            <span className="text-xs font-semibold text-emerald-600">R$ {totalDeposits.toFixed(2)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-purple-500" style={{ opacity: 0.6 }} />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500">Meta</span>
            <span className="text-xs font-semibold text-purple-600">R$ {depositGoal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowDownCircle className="w-5 h-5 text-blue-600" />
            Depósitos Brutos
          </CardTitle>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-600" />
            <span className="text-xs text-slate-600">Meta:</span>
            <Input
              type="number"
              value={depositGoal}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDepositGoal(Number(e.target.value) || 0)}
              className="w-20 h-7 text-xs"
              placeholder="Meta"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
            <p className="text-xs text-blue-700">Depósitos</p>
            <p className="text-sm font-bold text-blue-600">{totalDepositCount}</p>
          </div>
          <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-200">
            <p className="text-xs text-emerald-700">Total Bruto</p>
            <p className="text-sm font-bold text-emerald-600">R$ {totalDeposits.toFixed(2)}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-2 border border-purple-200">
            <p className="text-xs text-purple-700">Meta</p>
            <p className="text-sm font-bold text-purple-600">R$ {depositGoal.toFixed(2)}</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis
              dataKey="date"
              stroke="var(--chart-tick)"
              fontSize={11}
              tickFormatter={(value: string) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            />
            <YAxis stroke="var(--chart-tick)" fontSize={11} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="dailyDeposits"
              name="Depósitos Diários"
              stroke="var(--chart-blue)"
              strokeWidth={2}
              dot={{ fill: 'var(--chart-blue)', r: 3 }}
              connectNulls={true}
            />
            <Line
              type="monotone"
              dataKey="totalDeposits"
              name="Total Acumulado"
              stroke="var(--chart-green)"
              strokeWidth={3}
              dot={{ fill: 'var(--chart-green)', r: 3 }}
              connectNulls={true}
            />
            <Line
              type="monotone"
              dataKey="goal"
              name="Meta"
              stroke="var(--chart-purple)"
              strokeWidth={3}
              dot={{ fill: 'var(--chart-purple)', r: 3 }}
              strokeDasharray="5 5"
              connectNulls={true}
            />
          </LineChart>
        </ResponsiveContainer>
        <CustomLegend />
      </CardContent>
    </Card>
  );
}
