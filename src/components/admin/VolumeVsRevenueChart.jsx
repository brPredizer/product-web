import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TrendingUp, Target } from 'lucide-react';

export default function VolumeVsRevenueChart({ transactions, period, withdrawalRequests = [] }) {
  const [goalAmount, setGoalAmount] = useState(1000);
  
  // Calcular totais de TODAS as transações no período (mesma fonte dos cards superiores)
  const allDepositsInPeriod = transactions.filter(t => t.type === 'deposit');
  const totalDepositFees = allDepositsInPeriod.reduce((sum, t) => sum + (t.fee || 0), 0);
  
  // Taxa de saque: pegar de withdrawalRequests aprovados
  const approvedWithdrawalsInPeriod = withdrawalRequests.filter(w => {
    if (w.status !== 'approved' && w.status !== 'completed') return false;
    const date = new Date(w.approved_at || w.created_date);
    return date >= period.start && date <= period.end;
  });
  const totalWithdrawalFees = approvedWithdrawalsInPeriod.reduce((sum, w) => sum + (w.fee || 0), 0);
  
  const totalRevenue = totalDepositFees + totalWithdrawalFees;
  
  console.log('=== VolumeVsRevenueChart Debug ===');
  console.log('Depósitos no período:', allDepositsInPeriod.length);
  console.log('Taxa de depósito (7%):', totalDepositFees.toFixed(2));
  console.log('Saques aprovados no período:', approvedWithdrawalsInPeriod.length);
  console.log('Taxa de saque (10%):', totalWithdrawalFees.toFixed(2));
  console.log('Receita total:', totalRevenue.toFixed(2));
  
  // Agrupar transações por data USANDO OS MESMOS DADOS
  const groupByDate = () => {
    const grouped = {};
    
    // Processar depósitos - taxa de 7%
    allDepositsInPeriod.forEach(tx => {
      const date = new Date(tx.created_date);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: dateKey,
          volume: 0,
          depositFees: 0,
          withdrawalFees: 0,
          totalRevenue: 0,
          goal: goalAmount
        };
      }
      
      grouped[dateKey].volume += (tx.amount || 0);
      grouped[dateKey].depositFees += (tx.fee || 0);
    });
    
    // Processar saques - volume apenas
    transactions
      .filter(tx => tx.type === 'withdrawal')
      .forEach(tx => {
        const date = new Date(tx.created_date);
        const dateKey = date.toISOString().split('T')[0];
        
        if (!grouped[dateKey]) {
          grouped[dateKey] = {
            date: dateKey,
            volume: 0,
            depositFees: 0,
            withdrawalFees: 0,
            totalRevenue: 0,
            goal: goalAmount
          };
        }
        
        grouped[dateKey].volume += (tx.amount || 0);
      });
    
    // Adicionar taxas de saque (10%) - MESMOS DADOS DOS CARDS
    approvedWithdrawalsInPeriod.forEach(w => {
      const date = new Date(w.approved_at || w.created_date);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: dateKey,
          volume: 0,
          depositFees: 0,
          withdrawalFees: 0,
          totalRevenue: 0,
          goal: goalAmount
        };
      }
      
      grouped[dateKey].withdrawalFees += (w.fee || 0);
    });
    
    // Calcular receita total (7% depósitos + 10% saques)
    Object.values(grouped).forEach(item => {
      item.totalRevenue = item.depositFees + item.withdrawalFees;
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
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Volume vs Receita de Taxas
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
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
            <p className="text-xs text-emerald-700 mb-1">Taxa Depósito (7%)</p>
            <p className="text-lg font-bold text-emerald-700">R$ {totalDepositFees.toFixed(2)}</p>
          </div>
          <div className="bg-cyan-50 rounded-lg p-3 border border-cyan-200">
            <p className="text-xs text-cyan-700 mb-1">Taxa Saque (10%)</p>
            <p className="text-lg font-bold text-cyan-700">R$ {totalWithdrawalFees.toFixed(2)}</p>
          </div>
          <div className="bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-lg p-3 text-white">
            <p className="text-xs text-emerald-100 mb-1">Receita Total</p>
            <p className="text-lg font-bold">R$ {totalRevenue.toFixed(2)}</p>
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
              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="volume" 
              name="Volume de Transações"
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: '#10b981' }}
            />
            <Line 
              type="monotone" 
              dataKey="totalRevenue" 
              name="Receita de Taxas (7% + 10%)"
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