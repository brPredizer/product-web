import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet } from 'lucide-react';

const COLORS = {
  pending: '#f59e0b',
  approved: '#10b981',
  rejected: '#ef4444',
  completed: '#6366f1',
  withdrawal_fees: '#8b5cf6',
  deposit_fees: '#06b6d4'
};

const LABELS = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  completed: 'Completo',
  withdrawal_fees: 'Taxas de Saque',
  deposit_fees: 'Taxas de Depósito'
};

export default function WithdrawalStatusChart({ withdrawals, transactions = [] }) {
  // Agrupar saques por status e calcular taxas
  const groupByStatus = () => {
    // Inicializar com todos os status possíveis
    const grouped = {
      pending: { name: LABELS.pending, value: 0, count: 0, status: 'pending' },
      approved: { name: LABELS.approved, value: 0, count: 0, status: 'approved' },
      rejected: { name: LABELS.rejected, value: 0, count: 0, status: 'rejected' },
      completed: { name: LABELS.completed, value: 0, count: 0, status: 'completed' }
    };
    
    let totalWithdrawalFees = 0;
    
    withdrawals.forEach(withdrawal => {
      const status = withdrawal.status || 'pending';
      if (grouped[status]) {
        // Usar valor líquido em vez do bruto
        grouped[status].value += (withdrawal.net_amount || 0);
        grouped[status].count += 1;
      }
      
      // Acumular taxas de saque
      if (withdrawal.status === 'approved' || withdrawal.status === 'completed') {
        totalWithdrawalFees += (withdrawal.fee || 0);
      }
    });
    
    // Calcular taxas de depósito
    const depositFees = transactions
      .filter(t => t.type === 'deposit')
      .reduce((sum, t) => sum + (t.fee || 0), 0);
    
    // Filtrar apenas status com contagem > 0
    const result = Object.values(grouped).filter(item => item.count > 0);
    
    // Adicionar fatias de taxas (receitas da plataforma)
    if (totalWithdrawalFees > 0) {
      result.push({
        name: LABELS.withdrawal_fees,
        value: totalWithdrawalFees,
        count: withdrawals.filter(w => w.status === 'approved' || w.status === 'completed').length,
        status: 'withdrawal_fees'
      });
    }
    
    if (depositFees > 0) {
      result.push({
        name: LABELS.deposit_fees,
        value: depositFees,
        count: transactions.filter(t => t.type === 'deposit').length,
        status: 'deposit_fees'
      });
    }
    
    return result;
  };

  const data = groupByStatus();

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const total = data.reduce((sum, d) => sum + d.value, 0);
      const percent = ((item.value / total) * 100).toFixed(1);
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
          <p className="text-sm font-medium text-slate-900 mb-1">
            {item.name}
          </p>
          <p className="text-sm text-slate-600">
            Valor: R$ {item.value.toFixed(2)} ({percent}%)
          </p>
          {item.status !== 'withdrawal_fees' && item.status !== 'deposit_fees' && (
            <p className="text-sm text-slate-600">
              Solicitações: {item.count}
            </p>
          )}
          {(item.status === 'withdrawal_fees' || item.status === 'deposit_fees') && (
            <p className="text-sm text-emerald-600 font-medium">
              Receita da Plataforma
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-blue-600" />
          Status de Saques
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent, value }) => `${name} (${(percent * 100).toFixed(0)}%) - R$ ${value.toFixed(0)}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.status] || '#94a3b8'} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}