import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Wallet, Target } from 'lucide-react';

interface Transaction {
  id?: string;
  type?: string;
  amount?: number;
  fee?: number;
  created_date?: string;
}

interface WithdrawalRequest {
  id?: string;
  status?: string;
  amount?: number;
  fee?: number;
  approved_at?: string;
  created_date?: string;
}

interface Period {
  start: Date;
  end: Date;
}

interface Props {
  transactions: Transaction[];
  period: Period;
  withdrawalRequests?: WithdrawalRequest[];
}

export default function TransactionsChart({ transactions, period, withdrawalRequests = [] }: Props) {
  const [goalAmount, setGoalAmount] = useState<number>(1000);
  
  const depositsInPeriod = transactions.filter(t => t.type === 'deposit');
  const totalDepositGross = depositsInPeriod.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalDepositFees = depositsInPeriod.reduce((sum, t) => sum + (t.fee || 0), 0);
  
  const withdrawalsInPeriod = (withdrawalRequests || []).filter(w => {
    if (w.status !== 'approved' && w.status !== 'completed') return false;
    const date = new Date(w.approved_at || w.created_date || 0);
    return date >= period.start && date <= period.end;
  });
  
  const totalWithdrawalGross = withdrawalsInPeriod.reduce((sum, w) => sum + (w.amount || 0), 0);
  const totalWithdrawalFees = withdrawalsInPeriod.reduce((sum, w) => sum + (w.fee || 0), 0);
  
  const totalRevenue = totalDepositFees + totalWithdrawalFees;
  
  const groupByDate = () => {
    const grouped: Record<string, any> = {};
    
    depositsInPeriod.forEach(tx => {
      const date = new Date(tx.created_date || 0);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: dateKey,
          deposits: 0,
          withdrawals: 0,
          revenue: 0,
          goal: goalAmount
        };
      }
      
      grouped[dateKey].deposits += (tx.amount || 0);
      grouped[dateKey].revenue += (tx.fee || 0);
    });
    
    withdrawalsInPeriod.forEach(w => {
      const date = new Date(w.approved_at || w.created_date || 0);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: dateKey,
          deposits: 0,
          withdrawals: 0,
          revenue: 0,
          goal: goalAmount
        };
      }
      
      grouped[dateKey].withdrawals += (w.amount || 0);
      grouped[dateKey].revenue += (w.fee || 0);
    });
    
    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  };

  const data = groupByDate();

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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-600" />
            Volume de Transações
          </CardTitle>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-600" />
            <span className="text-sm text-slate-600">Meta:</span>
            <Input
              type="number"
              value={goalAmount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGoalAmount(parseFloat(e.target.value) || 0)}
              className="w-24 h-8 text-sm"
              placeholder="Meta"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
            <p className="text-xs text-emerald-700 mb-1">Taxa Depósito (7%)</p>
            <p className="text-lg font-bold text-emerald-600">R$ {totalDepositFees.toFixed(2)}</p>
            <p className="text-xs text-emerald-600 mt-1">{depositsInPeriod.length} depósitos processados</p>
          </div>
          <div className="bg-cyan-50 rounded-lg p-3 border border-cyan-200">
            <p className="text-xs text-cyan-700 mb-1">Taxa Saque (10%)</p>
            <p className="text-lg font-bold text-cyan-600">R$ {totalWithdrawalFees.toFixed(2)}</p>
            <p className="text-xs text-cyan-600 mt-1">{withdrawalsInPeriod.length} saques aprovados</p>
          </div>
          <div className="bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-lg p-3 text-white">
            <p className="text-xs text-emerald-100 mb-1">Receita Total</p>
            <p className="text-lg font-bold">R$ {totalRevenue.toFixed(2)}</p>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis 
              dataKey="date" 
              stroke="var(--chart-tick)"
              fontSize={12}
              tickFormatter={(value: string) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            />
            <YAxis 
              stroke="var(--chart-tick)"
              fontSize={12}
              tickFormatter={(value: number) => `R$ ${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="deposits" 
              name="Depósitos"
              stroke="var(--chart-green)"
              strokeWidth={2}
              dot={{ fill: 'var(--chart-green)' }}
            />
            <Line 
              type="monotone" 
              dataKey="withdrawals" 
              name="Saques"
              stroke="var(--chart-cyan)"
              strokeWidth={2}
              dot={{ fill: 'var(--chart-cyan)' }}
            />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              name="Receita Total"
              stroke="var(--chart-amber)"
              strokeWidth={2}
              dot={{ fill: 'var(--chart-amber)' }}
            />
            <Line 
              type="monotone" 
              dataKey="goal" 
              name="Meta"
              stroke="var(--chart-purple)"
              strokeWidth={3}
              dot={{ fill: 'var(--chart-purple)' }}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
