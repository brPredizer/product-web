import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TrendingUp, Target } from 'lucide-react';

export default function RevenueChart({ transactions, period, withdrawalRequests = [] }) {
  const [goalAmount, setGoalAmount] = useState(100);
  // Agrupar transações por data
  const groupByDate = () => {
    const grouped = {};
    
    // Processar transações de depósito
    transactions.forEach(tx => {
      const date = new Date(tx.created_date);
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
    
    // Processar taxas de saque dos WithdrawalRequests aprovados
    withdrawalRequests
      .filter(w => w.status === 'approved' || w.status === 'completed')
      .forEach(w => {
        const date = new Date(w.approved_at || w.created_date);
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

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
          <p className="text-sm font-medium text-slate-900 mb-2">
            {new Date(label).toLocaleDateString('pt-BR')}
          </p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: R$ {entry.value.toFixed(2)}
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
              onChange={(e) => setGoalAmount(parseFloat(e.target.value) || 0)}
              className="w-24 h-8 text-sm"
              placeholder="Meta"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              stroke="#94a3b8"
              fontSize={12}
              tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            />
            <YAxis 
              stroke="#94a3b8"
              fontSize={12}
              tickFormatter={(value) => `R$ ${value.toFixed(0)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="depositFees" 
              name="Taxa Depósito"
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: '#10b981' }}
            />
            <Line 
              type="monotone" 
              dataKey="withdrawalFees" 
              name="Taxa Saque"
              stroke="#06b6d4" 
              strokeWidth={2}
              dot={{ fill: '#06b6d4' }}
            />
            <Line 
              type="monotone" 
              dataKey="goal" 
              name="Meta"
              stroke="#8b5cf6" 
              strokeWidth={3}
              dot={{ fill: '#8b5cf6' }}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}