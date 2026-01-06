import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from 'lucide-react';

const COLORS = {
  trending: '#f59e0b',
  new: '#10b981',
  all: '#64748b',
  politics: '#8b5cf6',
  sports: '#ef4444',
  culture: '#ec4899',
  crypto: '#f97316',
  weather: '#06b6d4',
  economy: '#10b981',
  mentions: '#a855f7',
  companies: '#6366f1',
  finance: '#14b8a6',
  technology: '#3b82f6',
  health: '#22c55e',
  world: '#84cc16'
};

const LABELS = {
  trending: 'Em Alta',
  new: 'Novidades',
  all: 'Todas',
  politics: 'Política',
  sports: 'Esportes',
  culture: 'Cultura',
  crypto: 'Criptomoedas',
  weather: 'Clima',
  economy: 'Economia',
  mentions: 'Menções',
  companies: 'Empresas',
  finance: 'Finanças',
  technology: 'Tecnologia e Ciência',
  health: 'Saúde',
  world: 'Mundo'
};

export default function MarketDistributionChart({ markets }) {
  // Agrupar mercados por categoria
  const groupByCategory = () => {
    const grouped = {};
    
    markets.forEach(market => {
      const category = market.category || 'other';
      if (!grouped[category]) {
        grouped[category] = {
          name: LABELS[category] || category,
          value: 0,
          count: 0
        };
      }
      grouped[category].value += (market.volume_total || 0);
      grouped[category].count += 1;
    });
    
    return Object.keys(grouped).map(key => ({
      ...grouped[key],
      category: key
    }));
  };

  const data = groupByCategory();

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
          <p className="text-sm font-medium text-slate-900 mb-1">
            {item.name}
          </p>
          <p className="text-sm text-slate-600">
            Volume: R$ {item.value.toFixed(2)}
          </p>
          <p className="text-sm text-slate-600">
            Mercados: {item.count}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-600" />
          Distribuição por Categoria
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
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.category] || '#94a3b8'} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}