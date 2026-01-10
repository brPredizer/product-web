import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TrendingUp, Target } from 'lucide-react';

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

interface Period {
  start: Date;
  end: Date;
}

interface Props {
  transactions: Transaction[];
  period: Period;
  withdrawalRequests?: WithdrawalRequest[];
}

export default function RevenueChart({ transactions, period, withdrawalRequests = [] }: Props) {
  const [goalAmount, setGoalAmount] = useState<number>(100);
  
  const groupByDate = () => {
    const grouped: Record<string, any> = {};
    
    (transactions || []).forEach(tx => {
      const date = new Date(tx.created_date || 0);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: dateKey,
          depositFees: 0,
          withdrawalFees: 0,
          goal: goalAmount
        };
      }
      
      if (tx.type === 'deposit' && tx.fee) {
        grouped[dateKey].depositFees += tx.fee;
      }
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
            goal: goalAmount
          };
        }
        
        grouped[dateKey].withdrawalFees += (w.fee || 0);
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
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Receita ao Longo do Tempo
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
              tickFormatter={(value: number) => `R$ ${value.toFixed(0)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="depositFees" 
              name="Taxa Depósito"
              stroke="var(--chart-green)"
              strokeWidth={2}
              dot={{ fill: 'var(--chart-green)' }}
            />
            <Line 
              type="monotone" 
              dataKey="withdrawalFees" 
              name="Taxa Saque"
              stroke="var(--chart-cyan)"
              strokeWidth={2}
              dot={{ fill: 'var(--chart-cyan)' }}
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
