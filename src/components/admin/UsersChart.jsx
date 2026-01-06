import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Users, Target } from 'lucide-react';

export default function UsersChart({ users, period, allTransactions = [] }) {
  const [userGoal, setUserGoal] = useState(200);
  
  // Calcular usuários inativos (sem apostas nos últimos 5 dias)
  const calculateInactiveUsers = (dateKey) => {
    const targetDate = new Date(dateKey);
    const fiveDaysAgo = new Date(targetDate);
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    
    let inactiveCount = 0;
    
    users.forEach(user => {
      const userCreated = new Date(user.created_date);
      if (userCreated > targetDate) return; // Usuário ainda não existia
      
      // Verificar última transação de buy do usuário
      const userTransactions = allTransactions.filter(
        tx => tx.user_id === user.id && tx.type === 'buy'
      );
      
      if (userTransactions.length === 0) {
        // Nunca apostou
        if (userCreated <= fiveDaysAgo) {
          inactiveCount++;
        }
      } else {
        // Verificar última aposta
        const lastTransaction = userTransactions.sort((a, b) => 
          new Date(b.created_date) - new Date(a.created_date)
        )[0];
        
        const lastBetDate = new Date(lastTransaction.created_date);
        if (lastBetDate <= fiveDaysAgo) {
          inactiveCount++;
        }
      }
    });
    
    return inactiveCount;
  };
  
  // Agrupar usuários por data de criação
  const groupByDate = () => {
    const grouped = {};
    let cumulative = 0;
    
    users.forEach(user => {
      const date = new Date(user.created_date);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: dateKey,
          newUsers: 0,
          totalUsers: 0,
          goal: userGoal
        };
      }
      
      grouped[dateKey].newUsers += 1;
    });
    
    const sorted = Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
    
    sorted.forEach(item => {
      cumulative += item.newUsers;
      item.totalUsers = cumulative;
      item.goal = userGoal;
      item.inactiveUsers = calculateInactiveUsers(item.date);
    });
    
    return sorted;
  };

  const data = groupByDate();
  
  // Calcular valores atuais (último ponto do gráfico)
  const latestData = data.length > 0 ? data[data.length - 1] : null;
  const totalUsers = latestData?.totalUsers || 0;
  const newUsers = latestData?.newUsers || 0;
  const inactiveUsers = latestData?.inactiveUsers || 0;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
          <p className="text-sm font-medium text-slate-900 mb-2">
            {new Date(label).toLocaleDateString('pt-BR')}
          </p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
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
            <span className="text-[10px] text-slate-500">Total de Usuários</span>
            <span className="text-xs font-semibold text-emerald-600">{totalUsers}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-cyan-500" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500">Novos Usuários</span>
            <span className="text-xs font-semibold text-cyan-600">{newUsers}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-rose-500" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500">Usuários Inativos</span>
            <span className="text-xs font-semibold text-rose-600">{inactiveUsers}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-purple-500" style={{ opacity: 0.6 }} />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500">Meta</span>
            <span className="text-xs font-semibold text-purple-600">{userGoal}</span>
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
            <Users className="w-5 h-5 text-emerald-600" />
            Crescimento de Usuários
          </CardTitle>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-600" />
            <span className="text-xs text-slate-600">Meta:</span>
            <Input
              type="number"
              value={userGoal}
              onChange={(e) => setUserGoal(parseFloat(e.target.value) || 0)}
              className="w-20 h-7 text-xs"
              placeholder="Meta"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
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
              dataKey="totalUsers" 
              name="Total de Usuários"
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 3 }}
            />
            <Line 
              type="monotone" 
              dataKey="newUsers" 
              name="Novos Usuários"
              stroke="#06b6d4" 
              strokeWidth={2}
              dot={{ fill: '#06b6d4', r: 3 }}
            />
            <Line 
              type="monotone" 
              dataKey="inactiveUsers" 
              name="Usuários Inativos"
              stroke="#ef4444" 
              strokeWidth={2}
              dot={{ fill: '#ef4444', r: 3 }}
            />
            <Line 
              type="monotone" 
              dataKey="goal" 
              name="Meta"
              stroke="#8b5cf6" 
              strokeWidth={3}
              dot={{ fill: '#8b5cf6', r: 3 }}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
        <CustomLegend />
      </CardContent>
    </Card>
  );
}