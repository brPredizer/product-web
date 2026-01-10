import React from "react"
import { cn } from "@/lib/utils"

type IconType = React.ComponentType<any>

type StatsCardProps = {
  title: React.ReactNode
  value: React.ReactNode
  subtitle?: React.ReactNode
  icon?: IconType
  trend?: React.ReactNode
  trendUp?: boolean
  className?: string
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendUp,
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-300",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
          {trend && (
            <p
              className={cn(
                "text-sm font-medium mt-2",
                trendUp ? "text-emerald-600" : "text-rose-500"
              )}
            >
              {trendUp ? "+" : ""}
              {trend}
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-3 rounded-xl bg-slate-50">
            <Icon className="w-5 h-5 text-slate-600" />
          </div>
        )}
      </div>
    </div>
  )
}
