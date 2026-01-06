import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Wallet, Target } from 'lucide-react';

export default function TransactionsChart({ transactions, period, withdrawalRequests = [] }) {
  const [goalAmount, setGoalAmount] = useState(1000);
  
  // Calcular totais para o cartão de resumo
  const depositsInPeriod = transactions.filter(t => t.type === 'deposit');
  const totalDepositGross = depositsInPeriod.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalDepositFees = depositsInPeriod.reduce((sum, t) => sum + (t.fee || 0), 0);
  
  const withdrawalsInPeriod = withdrawalRequests.filter(w => {
    if (w.status !== 'approved' && w.status !== 'completed') return false;
    const date = new Date(w.approved_at || w.created_date);
    return date >= period.start && date <= period.end;
  });
  
  const totalWithdrawalGross = withdrawalsInPeriod.reduce((sum, w) => sum + (w.amount || 0), 0);
  const totalWithdrawalFees = withdrawalsInPeriod.reduce((sum, w) => sum + (w.fee || 0), 0);
  
  const totalRevenue = totalDepositFees + totalWithdrawalFees;
  
  // Agrupar transações por data e tipo
  const groupByDate = () => {
    const grouped = {};
    
    // Processar depósitos (valor bruto)
    depositsInPeriod.forEach(tx => {
      const date = new Date(tx.created_date);
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
      
      grouped[dateKey].deposits += (tx.amount || 0); // Valor bruto
      grouped[dateKey].revenue += (tx.fee || 0); // Taxa de 7%
    });
    
    // Processar saques aprovados (valor bruto) dos WithdrawalRequests no período
    withdrawalsInPeriod.forEach(w => {
      const date = new Date(w.approved_at || w.created_date);
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
      
      grouped[dateKey].withdrawals += (w.amount || 0); // Valor bruto
      grouped[dateKey].revenue += (w.fee || 0); // Taxa de 10%
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
            <Wallet className="w-5 h-5 text-blue-600" />
            Volume de Transações
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
        {/* Resumo de Totais */}
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
              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="deposits" 
              name="Depósitos"
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: '#10b981' }}
            />
            <Line 
              type="monotone" 
              dataKey="withdrawals" 
              name="Saques"
              stroke="#06b6d4" 
              strokeWidth={2}
              dot={{ fill: '#06b6d4' }}
            />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              name="Receita Total"
              stroke="#f59e0b" 
              strokeWidth={2}
              dot={{ fill: '#f59e0b' }}
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