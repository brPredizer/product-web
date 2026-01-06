import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DollarSign, Target } from 'lucide-react';

export default function RevenueFeesChart({ allTransactions = [], withdrawalRequests = [], period }) {
  const [revenueGoal, setRevenueGoal] = useState(500);
  
  // Agrupar taxas por data
  const groupByDate = () => {
    const grouped = {};
    
    // Processar taxas de depósito
    allTransactions
      .filter(t => t.type === 'deposit')
      .forEach(tx => {
        const date = new Date(tx.created_date);
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
    
    // Processar taxas de saque (apenas aprovados/completados)
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
            totalRevenue: 0,
            goal: revenueGoal
          };
        }
        
        grouped[dateKey].withdrawalFees += (w.fee || 0);
      });
    
    // Calcular receita total
    const sorted = Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
    
    sorted.forEach(item => {
      item.totalRevenue = item.depositFees + item.withdrawalFees;
      item.goal = revenueGoal;
    });
    
    return sorted;
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

  // Calcular totais
  const totalDepositFees = data.reduce((sum, d) => sum + d.depositFees, 0);
  const totalWithdrawalFees = data.reduce((sum, d) => sum + d.withdrawalFees, 0);
  const totalRevenue = totalDepositFees + totalWithdrawalFees;

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
              onChange={(e) => setRevenueGoal(parseFloat(e.target.value) || 0)}
              className="w-20 h-7 text-xs"
              placeholder="Meta"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Resumo */}
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
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              stroke="#94a3b8"
              fontSize={11}
              tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            />
            <YAxis stroke="#94a3b8" fontSize={11} />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="depositFees" 
              name="Taxa Depósito"
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 3 }}
              connectNulls={true}
            />
            <Line 
              type="monotone" 
              dataKey="withdrawalFees" 
              name="Taxa Saque"
              stroke="#06b6d4" 
              strokeWidth={2}
              dot={{ fill: '#06b6d4', r: 3 }}
              connectNulls={true}
            />
            <Line 
              type="monotone" 
              dataKey="totalRevenue" 
              name="Receita Total"
              stroke="#f59e0b" 
              strokeWidth={3}
              dot={{ fill: '#f59e0b', r: 3 }}
              connectNulls={true}
            />
            <Line 
              type="monotone" 
              dataKey="goal" 
              name="Meta"
              stroke="#8b5cf6" 
              strokeWidth={3}
              dot={{ fill: '#8b5cf6', r: 3 }}
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