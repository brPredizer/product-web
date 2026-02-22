import React from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type RawPoint = {
  timestamp?: string
  date?: string
  yesPrice?: number
  noPrice?: number
  yes_price?: number
  no_price?: number
  volume?: number
}

type Point = {
  date: string
  price: number
  volume: number
}

type PriceChartProps = {
  data?: RawPoint[]
  side?: 'yes' | 'no'
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
      volume: Math.floor(Math.random() * 10000) + 1000
    })
  }

  return points
}

const CustomTooltip = ({
  active,
  payload,
  label
}: {
  active?: boolean
  payload?: any[]
  label?: any
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl text-sm">
        <p className="font-semibold">{Number(payload[0].value || 0).toFixed(0)}%</p>
        <p className="text-slate-400 text-xs">
          {format(new Date(label), "d 'de' MMM, HH:mm", { locale: ptBR })}
        </p>
      </div>
    )
  }
  return null
}

export default function PriceChart({ data = [], side = 'yes' }: PriceChartProps) {
  const chartData: Point[] =
    data && data.length > 0
      ? data.map((p: RawPoint) => {
          const date = p.timestamp ?? p.date ?? new Date().toISOString()
          const priceDecimal =
            side === 'yes'
              ? Number(p.yesPrice ?? p.yes_price ?? 0)
              : Number(p.noPrice ?? p.no_price ?? 0)
          return {
            date,
            price: Math.round(priceDecimal * 100),
            volume: Number(p.volume ?? 0)
          } as Point
        })
      : generateSampleData()

  const currentProbability = chartData[chartData.length - 1]?.price ?? 50
  const startProbability = chartData[0]?.price ?? 50
  const pointsChange = currentProbability - startProbability
  const isPositive = pointsChange >= 0
  const changePercent = startProbability === 0 ? 0 : (pointsChange / startProbability) * 100

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-medium text-slate-500">
            Probabilidade {side === 'yes' ? 'SIM' : 'NÃO'}
          </h3>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-slate-900">
              {currentProbability.toFixed(0)}%
            </span>
            <span className={`text-sm font-semibold ${isPositive ? 'text-emerald-600' : 'text-rose-500'}`}>
              {isPositive ? '+' : ''}
              {pointsChange.toFixed(0)} p.p. ({changePercent.toFixed(1)}%)
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {['1D', '7D', '1M', 'ALL'].map((period) => (
            <button
              key={period}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
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
                <stop
                  offset="0%"
                  stopColor={side === 'yes' ? 'var(--chart-green)' : 'var(--chart-negative)'}
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor={side === 'yes' ? 'var(--chart-green)' : 'var(--chart-negative)'}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--chart-tick)', fontSize: 11 }}
              tickFormatter={(value: string) => format(new Date(value), 'd/M')}
            />
            <YAxis
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--chart-tick)', fontSize: 11 }}
              tickFormatter={(value: number) => `${value.toFixed(0)}%`}
              width={44}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke={side === 'yes' ? 'var(--chart-green)' : 'var(--chart-negative)'}
              strokeWidth={2}
              fill="url(#priceGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

