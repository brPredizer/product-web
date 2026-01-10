import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DollarSign, Target } from 'lucide-react';

interface Transaction {
  id?: string;
  type?: string;
  fee?: number;
  created_date?: string;
}

interface WithdrawalRequest {
  id?: string;
  status?: string;
  fee?: number;
  approved_at?: string;
  created_date?: string;
}

interface Props {
  allTransactions?: Transaction[];
  withdrawalRequests?: WithdrawalRequest[];
  period?: any;
}

export default function RevenueFeesChart({ allTransactions = [], withdrawalRequests = [], period }: Props) {
  const [revenueGoal, setRevenueGoal] = useState<number>(500);
  
  const groupByDate = () => {
    const grouped: Record<string, any> = {};
    
    (allTransactions || [])
      .filter(t => t.type === 'deposit')
      .forEach(tx => {
        const date = new Date(tx.created_date || 0);
        const dateKey = date.toISOString().split('T')[0];
        
        if (!grouped[dateKey]) {
          grouped[dateKey] = {
            date: dateKey,
            depositFees: 0,
            withdrawalFees: 0,
            totalRevenue: 0,
            goal: revenueGoal
          };
        }
        
        grouped[dateKey].depositFees += (tx.fee || 0);
      });
    
    (withdrawalRequests || [])
      .filter(w => w.status === 'approved' || w.status === 'completed')
      .forEach(w => {
        const date = new Date(w.approved_at || w.created_date || 0);
        const dateKey = date.toISOString().split('T')[0];
        
        if (!grouped[dateKey]) {
          grouped[dateKey] = {
            date: dateKey,
            depositFees: 0,
            withdrawalFees: 0,
            totalRevenue: 0,
            goal: revenueGoal
          };
        }
        
        grouped[dateKey].withdrawalFees += (w.fee || 0);
      });

    const sorted = Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
    
    sorted.forEach(item => {
      item.totalRevenue = (item.depositFees || 0) + (item.withdrawalFees || 0);
      item.goal = revenueGoal;
    });
    
    return sorted;
  };

  const data = groupByDate();

  const totalDepositFees = data.reduce((sum, d) => sum + (d.depositFees || 0), 0);
  const totalWithdrawalFees = data.reduce((sum, d) => sum + (d.withdrawalFees || 0), 0);
  const totalRevenue = totalDepositFees + totalWithdrawalFees;

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
          <p className="text-sm font-medium text-slate-900 mb-2">
            {label ? new Date(label).toLocaleDateString('pt-BR') : ''}
          </p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: R$ {Number(entry.value || 0).toFixed(2)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomLegend = () => {
    return (
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500">Taxa Depósito</span>
            <span className="text-xs font-semibold text-emerald-600">R$ {totalDepositFees.toFixed(2)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-cyan-500" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500">Taxa Saque</span>
            <span className="text-xs font-semibold text-cyan-600">R$ {totalWithdrawalFees.toFixed(2)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500">Receita Total</span>
            <span className="text-xs font-semibold text-amber-600">R$ {totalRevenue.toFixed(2)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-purple-500" style={{ opacity: 0.6 }} />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500">Meta</span>
            <span className="text-xs font-semibold text-purple-600">R$ {revenueGoal.toFixed(2)}</span>
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
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Receita de Taxas
          </CardTitle>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-600" />
            <span className="text-xs text-slate-600">Meta:</span>
            <Input
              type="number"
              value={revenueGoal}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRevenueGoal(parseFloat(e.target.value) || 0)}
              className="w-20 h-7 text-xs"
              placeholder="Meta"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-200">
            <p className="text-xs text-emerald-700">Taxa Depósito</p>
            <p className="text-sm font-bold text-emerald-600">R$ {totalDepositFees.toFixed(2)}</p>
          </div>
          <div className="bg-cyan-50 rounded-lg p-2 border border-cyan-200">
            <p className="text-xs text-cyan-700">Taxa Saque</p>
            <p className="text-sm font-bold text-cyan-600">R$ {totalWithdrawalFees.toFixed(2)}</p>
          </div>
          <div className="bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-lg p-2 text-white">
            <p className="text-xs text-emerald-100">Total</p>
            <p className="text-sm font-bold">R$ {totalRevenue.toFixed(2)}</p>
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
              dataKey="depositFees" 
              name="Taxa Depósito"
              stroke="var(--chart-green)"
              strokeWidth={2}
              dot={{ fill: 'var(--chart-green)', r: 3 }}
              connectNulls={true}
            />
            <Line 
              type="monotone" 
              dataKey="withdrawalFees" 
              name="Taxa Saque"
              stroke="var(--chart-cyan)"
              strokeWidth={2}
              dot={{ fill: 'var(--chart-cyan)', r: 3 }}
              connectNulls={true}
            />
            <Line 
              type="monotone" 
              dataKey="totalRevenue" 
              name="Receita Total"
              stroke="var(--chart-amber)"
              strokeWidth={3}
              dot={{ fill: 'var(--chart-amber)', r: 3 }}
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
