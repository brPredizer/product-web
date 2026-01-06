import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowUpCircle, Target } from 'lucide-react';

export default function WithdrawalsChart({ withdrawalRequests = [], period }) {
  const [withdrawalGoal, setWithdrawalGoal] = useState(500);
  
  // Agrupar saques aprovados por data
  const groupByDate = () => {
    const grouped = {};
    
    // Processar saques aprovados/completados
    withdrawalRequests
      .filter(w => w.status === 'approved' || w.status === 'completed')
      .forEach(w => {
        const date = new Date(w.approved_at || w.created_date);
        const dateKey = date.toISOString().split('T')[0];
        
        if (!grouped[dateKey]) {
          grouped[dateKey] = {
            date: dateKey,
            dailyWithdrawals: 0,
            totalWithdrawals: 0,
            goal: withdrawalGoal
          };
        }
        
        grouped[dateKey].dailyWithdrawals += (w.amount || 0);
      });
    
    // Calcular total acumulado
    const sorted = Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
    let cumulative = 0;
    
    sorted.forEach(item => {
      cumulative += item.dailyWithdrawals;
      item.totalWithdrawals = cumulative;
      item.goal = withdrawalGoal;
    });
    
    return sorted;
  };

  const data = groupByDate();
  
  // Calcular valores atuais
  const latestData = data.length > 0 ? data[data.length - 1] : null;
  const totalWithdrawals = latestData?.totalWithdrawals || 0;
  const dailyWithdrawals = latestData?.dailyWithdrawals || 0;
  const totalWithdrawalCount = withdrawalRequests.filter(w => w.status === 'approved' || w.status === 'completed').length;

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
          <div className="w-3 h-3 rounded-full bg-rose-500" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500">Saques Diários</span>
            <span className="text-xs font-semibold text-rose-600">R$ {dailyWithdrawals.toFixed(2)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-cyan-500" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500">Total Acumulado</span>
            <span className="text-xs font-semibold text-cyan-600">R$ {totalWithdrawals.toFixed(2)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-purple-500" style={{ opacity: 0.6 }} />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500">Meta</span>
            <span className="text-xs font-semibold text-purple-600">R$ {withdrawalGoal.toFixed(2)}</span>
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
            <ArrowUpCircle className="w-5 h-5 text-rose-600" />
            Saques Brutos
          </CardTitle>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-600" />
            <span className="text-xs text-slate-600">Meta:</span>
            <Input
              type="number"
              value={withdrawalGoal}
              onChange={(e) => setWithdrawalGoal(parseFloat(e.target.value) || 0)}
              className="w-20 h-7 text-xs"
              placeholder="Meta"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Resumo */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-rose-50 rounded-lg p-2 border border-rose-200">
            <p className="text-xs text-rose-700">Saques</p>
            <p className="text-sm font-bold text-rose-600">{totalWithdrawalCount}</p>
          </div>
          <div className="bg-cyan-50 rounded-lg p-2 border border-cyan-200">
            <p className="text-xs text-cyan-700">Total Bruto</p>
            <p className="text-sm font-bold text-cyan-600">R$ {totalWithdrawals.toFixed(2)}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-2 border border-purple-200">
            <p className="text-xs text-purple-700">Meta</p>
            <p className="text-sm font-bold text-purple-600">R$ {withdrawalGoal.toFixed(2)}</p>
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
              dataKey="dailyWithdrawals" 
              name="Saques Diários"
              stroke="#f43f5e" 
              strokeWidth={2}
              dot={{ fill: '#f43f5e', r: 3 }}
              connectNulls={true}
            />
            <Line 
              type="monotone" 
              dataKey="totalWithdrawals" 
              name="Total Acumulado"
              stroke="#06b6d4" 
              strokeWidth={3}
              dot={{ fill: '#06b6d4', r: 3 }}
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