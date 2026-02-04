import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from 'lucide-react';

type Market = {
  category?: string;
  volume_total?: number | null;
};

// Colors moved to CSS variables in `src/index.css` and exposed via Tailwind

const LABELS: Record<string, string> = {
  "EM-ALTA": "Em Alta",
  "NOVIDADES": "Novidades",
  "TODAS": "Todas",
  "POLITICA": "Política",
  "ESPORTES": "Esportes",
  "CULTURA": "Cultura",
  "CRIPTOMOEDAS": "Criptomoedas",
  "CLIMA": "Clima",
  "ECONOMIA": "Economia",
  "MENCOES": "Menções",
  "EMPRESAS": "Empresas",
  "FINANCAS": "Finanças",
  "TECNOLOGIA-E-CIENCIA": "Tecnologia e Ciência",
  "SAUDE": "Saúde",
  "MUNDO": "Mundo"
};

type CategoryEntry = {
  name: string;
  value: number;
  count: number;
  category: string;
};

export default function MarketDistributionChart({ markets }: { markets?: Market[] }) {
  const groupByCategory = (): CategoryEntry[] => {
    const grouped: Record<string, { name: string; value: number; count: number }> = {};

    (markets || []).forEach(market => {
      const category = market?.category || 'OTHER';
      if (!grouped[category]) {
        grouped[category] = {
          name: LABELS[category] || category,
          value: 0,
          count: 0
        };
      }
      grouped[category].value += Number(market?.volume_total || 0);
      grouped[category].count += 1;
    });

    return Object.keys(grouped).map(key => ({ ...grouped[key], category: key }));
  };

  const data = groupByCategory();

  const CustomTooltip: React.FC<any> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as CategoryEntry;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
          <p className="text-sm font-medium text-slate-900 mb-1">{item.name}</p>
          <p className="text-sm text-slate-600">Volume: R$ {item.value.toFixed(2)}</p>
          <p className="text-sm text-slate-600">Mercados: {item.count}</p>
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
              label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
              outerRadius={80}
              fill="var(--chart-default)"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`var(--color-${entry.category}, var(--color-status-default))`}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

