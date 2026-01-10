import React from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Point = {
  date: string
  price: number
  volume: number
}

type PriceChartProps = {
  data?: Point[]
}

const generateSampleData = (): Point[] => {
  const points: Point[] = []
  let price = 0.5
  const now = new Date()

  for (let i = 30; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    price = Math.max(0.05, Math.min(0.95, price + (Math.random() - 0.48) * 0.08))

    points.push({
      date: date.toISOString(),
      price: Math.round(price * 100),
      volume: Math.floor(Math.random() * 10000) + 1000,
    })
  }

  return points
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: any }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl text-sm">
        <p className="font-semibold">R$ {(payload[0].value / 100).toFixed(2)} SIM</p>
        <p className="text-slate-400 text-xs">
          {format(new Date(label), "d 'de' MMM, HH:mm", { locale: ptBR })}
        </p>
      </div>
    )
  }
  return null
}

export default function PriceChart({ data = [] }: PriceChartProps) {
  const chartData = data.length > 0 ? data : generateSampleData()

  const currentPrice = chartData[chartData.length - 1]?.price ?? 50
  const startPrice = chartData[0]?.price ?? 50
  const priceChange = currentPrice - startPrice
  const isPositive = priceChange >= 0

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-medium text-slate-500">Preço SIM</h3>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-slate-900">R$ {(currentPrice / 100).toFixed(2)}</span>
            <span className={`text-sm font-semibold ${isPositive ? 'text-emerald-600' : 'text-rose-500'}`}>
              {isPositive ? '+' : ''}R$ {(priceChange / 100).toFixed(2)} ({((priceChange / startPrice) * 100).toFixed(1)}%)
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {['1D', '7D', '1M', 'ALL'].map((period) => (
            <button key={period} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              {period}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isPositive ? 'var(--chart-green)' : 'var(--chart-negative)'} stopOpacity={0.3} />
                <stop offset="100%" stopColor={isPositive ? 'var(--chart-green)' : 'var(--chart-negative)'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-tick)', fontSize: 11 }} tickFormatter={(value: string) => format(new Date(value), 'd/M')} />
            <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-tick)', fontSize: 11 }} tickFormatter={(value: number) => `R$ ${(value / 100).toFixed(2)}`} width={50} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="price" stroke={isPositive ? 'var(--chart-green)' : 'var(--chart-negative)'} strokeWidth={2} fill="url(#priceGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
