import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet } from 'lucide-react'

type Withdrawal = {
  status?: string
  net_amount?: number
  fee?: number
}

type Transaction = {
  type?: string
  fee?: number
}

type Props = {
  withdrawals: Withdrawal[]
  transactions?: Transaction[]
}


const LABELS: Record<string, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  completed: 'Completo',
  withdrawal_fees: 'Taxas de Saque',
  deposit_fees: 'Taxas de Depósito',
}

export default function WithdrawalStatusChart({ withdrawals, transactions = [] }: Props) {
  const groupByStatus = () => {
    const grouped: Record<string, { name: string; value: number; count: number; status: string }> = {
      pending: { name: LABELS.pending, value: 0, count: 0, status: 'pending' },
      approved: { name: LABELS.approved, value: 0, count: 0, status: 'approved' },
      rejected: { name: LABELS.rejected, value: 0, count: 0, status: 'rejected' },
      completed: { name: LABELS.completed, value: 0, count: 0, status: 'completed' },
    }

    let totalWithdrawalFees = 0

    withdrawals.forEach((withdrawal) => {
      const status = withdrawal.status || 'pending'
      if (grouped[status]) {
        grouped[status].value += withdrawal.net_amount || 0
        grouped[status].count += 1
      }

      if (withdrawal.status === 'approved' || withdrawal.status === 'completed') {
        totalWithdrawalFees += withdrawal.fee || 0
      }
    })

    const depositFees = transactions.filter((t) => t.type === 'deposit').reduce((sum, t) => sum + (t.fee || 0), 0)

    const result = Object.values(grouped).filter((item) => item.count > 0)

    if (totalWithdrawalFees > 0) {
      result.push({ name: LABELS.withdrawal_fees, value: totalWithdrawalFees, count: withdrawals.filter((w) => w.status === 'approved' || w.status === 'completed').length, status: 'withdrawal_fees' })
    }

    if (depositFees > 0) {
      result.push({ name: LABELS.deposit_fees, value: depositFees, count: transactions.filter((t) => t.type === 'deposit').length, status: 'deposit_fees' })
    }

    return result
  }

  const data = groupByStatus()

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload
      const total = data.reduce((sum, d) => sum + d.value, 0)
      const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0'
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
          <p className="text-sm font-medium text-slate-900 mb-1">{item.name}</p>
          <p className="text-sm text-slate-600">Valor: R$ {Number(item.value).toFixed(2)} ({percent}%)</p>
          {item.status !== 'withdrawal_fees' && item.status !== 'deposit_fees' && (
            <p className="text-sm text-slate-600">Solicitações: {item.count}</p>
          )}
          {(item.status === 'withdrawal_fees' || item.status === 'deposit_fees') && (
            <p className="text-sm text-emerald-600 font-medium">Receita da Plataforma</p>
          )}
        </div>
      )
    }
    return null
  }

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
            <Pie data={data} cx="50%" cy="50%" labelLine={false} label={({ name, percent, value }: any) => `${name} (${(percent * 100).toFixed(0)}%) - R$ ${Number(value).toFixed(0)}`} outerRadius={80} fill="var(--chart-default)" dataKey="value">
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`var(--color-${(entry as any).status}, var(--color-status-default))`}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
