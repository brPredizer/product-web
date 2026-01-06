import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { mockApi } from '@/api/mockClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from 'sonner';
import { Shield, Sparkles, BarChart3, CalendarDays } from 'lucide-react';

const categories = [
  { id: 'trending', name: 'Em Alta' },
  { id: 'new', name: 'Novidades' },
  { id: 'politics', name: 'Política' },
  { id: 'sports', name: 'Esportes' },
  { id: 'culture', name: 'Cultura' },
  { id: 'crypto', name: 'Criptomoedas' },
  { id: 'weather', name: 'Clima' },
  { id: 'economy', name: 'Economia' },
  { id: 'mentions', name: 'Menções' },
  { id: 'companies', name: 'Empresas' },
  { id: 'finance', name: 'Finanças' },
  { id: 'technology', name: 'Tecnologia e Ciência' },
  { id: 'health', name: 'Saúde' },
  { id: 'world', name: 'Mundo' },
];

const toLocalInputValue = (date) => {
  const offsetMs = date.getTimezoneOffset() * 60000;
  const local = new Date(date.getTime() - offsetMs);
  return local.toISOString().slice(0, 16);
};

const toIsoStringOrNull = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const clampProbability = (value) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return 50;
  return Math.min(99, Math.max(1, numeric));
};

const clampNumber = (n, min, max) => {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
};

const formatBRDateTime = (value) => {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const InitialPricingBlock = ({ yesPercent, setYesPercent, categoryLabel = '—', closingDate }) => {
  const yesInt = clampNumber(parseInt(String(yesPercent ?? 50), 10), 0, 100);
  const noInt = 100 - yesInt;

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold text-slate-700">
        Probabilidade inicial (SIM) (%)
      </Label>
      <Input
        type="number"
        inputMode="numeric"
        min={0}
        max={100}
        step={1}
        value={yesInt}
        onChange={(e) => {
          const v = clampNumber(parseInt(e.target.value || '0', 10), 0, 100);
          setYesPercent(v);
        }}
        className={cn(
          "h-10 w-full tabular-nums",
          yesInt <= 0 || yesInt >= 100 ? "border-amber-300 focus-visible:ring-amber-200" : ""
        )}
      />
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">
          SIM: {yesInt}%
        </Badge>
        <Badge className="bg-rose-50 text-rose-700 border border-rose-200">
          NÃO: {noInt}%
        </Badge>
      </div>
      <p className="text-xs text-slate-500">
        Mercado binário: o <b>NÃO</b> é calculado automaticamente como <b>100% − SIM</b>.
      </p>
      {(yesInt <= 0 || yesInt >= 100) && (
        <p className="text-xs text-amber-700">
          Dica: valores 0% ou 100% travam o preço; em produção use algo entre 5–95% para liquidez.
        </p>
      )}
    </div>
  );
};

export default function CreateMarket({ user }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const defaultClosing = toLocalInputValue(new Date(Date.now() + 1000 * 60 * 60 * 24 * 14));
  const defaultResolution = toLocalInputValue(new Date(Date.now() + 1000 * 60 * 60 * 24 * 21));

  const [formData, setFormData] = useState({
    title: '',
    category: 'economy',
    description: '',
    resolutionSource: '',
    closingDate: defaultClosing,
    resolutionDate: defaultResolution,
    probability: 55,
    featured: false,
  });
  const yesPercent = formData.probability;
  const setYesPercent = (value) => setFormData((prev) => ({ ...prev, probability: value }));
  const categoryLabel = categories.find((c) => c.id === formData.category)?.name || '—';
  const yesInt = clampNumber(parseInt(String(yesPercent ?? 50), 10), 0, 100);
  const noInt = 100 - yesInt;
  const yesPrice = (yesInt / 100).toFixed(2);
  const noPrice = (noInt / 100).toFixed(2);

  const createMutation = useMutation({
    mutationFn: async (payload) => mockApi.entities.Market.create(payload),
    onSuccess: async (market) => {
      toast.success('Mercado criado com sucesso');
      await Promise.all([
        queryClient.invalidateQueries(['admin-markets']),
        queryClient.invalidateQueries(['markets', 'explore']),
      ]);
      router.push(`/Market?id=${market.id}`);
    },
    onError: () => {
      toast.error('Erro ao criar mercado');
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!user || user.role !== 'admin') {
      toast.error('Apenas administradores podem criar mercados por enquanto.');
      return;
    }

    if (!formData.title.trim() || !formData.description.trim() || !formData.resolutionSource.trim()) {
      toast.error('Preencha título, descrição e fonte de resolução.');
      return;
    }

    const closingIso = toIsoStringOrNull(formData.closingDate);
    const resolutionIso = toIsoStringOrNull(formData.resolutionDate);

    if (!closingIso || !resolutionIso) {
      toast.error('Escolha datas válidas de encerramento e resolução.');
      return;
    }

    const yes = Number(yesPrice);
    const no = Number(noPrice);

    createMutation.mutate({
      title: formData.title.trim(),
      category: formData.category,
      status: 'open',
      yes_price: yes,
      no_price: no,
      yes_contracts: 0,
      no_contracts: 0,
      volume_total: 0,
      volume_24h: 0,
      volume_7d_avg: 0,
      volatility_24h: 0,
      closing_date: closingIso,
      resolution_date: resolutionIso,
      resolution_source: formData.resolutionSource.trim(),
      description: formData.description.trim(),
      featured: formData.featured,
      created_by: user.id,
      creator_email: user.email,
    });
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md text-center shadow-sm">
          <Shield className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Apenas administradores</h2>
          <p className="text-slate-500">
            A criação de novos mercados está limitada a administradores. Em breve poderemos liberar para usuários selecionados.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Button onClick={() => router.push('/Explore')} variant="outline" className="border-slate-200">
              Explorar mercados
            </Button>
            <Button onClick={() => router.push('/Login')} className="bg-emerald-600 hover:bg-emerald-700">
              Entrar como admin
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  <Badge variant="outline" className="border-emerald-200 text-emerald-700">Admin</Badge>
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Criar novo mercado</h1>
                <p className="text-slate-500">Defina título, probabilidade inicial e critérios de resolução.</p>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push('/Admin')}
                className="border-slate-200 hover:bg-slate-100"
              >
                Voltar para Admin
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Esta página já está preparada para liberar criação por usuários no futuro.
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
          <Card className="p-6 border border-slate-200 shadow-sm">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  placeholder="Ex: Selic ficará acima de 10% em 2025?"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent position="popper" side="bottom" align="start" avoidCollisions={false}>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">Escolha o tema principal do mercado.</p>
                </div>

                <InitialPricingBlock
                  yesPercent={yesPercent}
                  setYesPercent={setYesPercent}
                  categoryLabel={categoryLabel}
                  closingDate={formData.closingDate}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="closingDate">Data de encerramento</Label>
                  <Input
                    id="closingDate"
                    type="datetime-local"
                    value={formData.closingDate}
                    onChange={(e) => setFormData({ ...formData, closingDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resolutionDate">Data de resolução</Label>
                  <Input
                    id="resolutionDate"
                    type="datetime-local"
                    value={formData.resolutionDate}
                    onChange={(e) => setFormData({ ...formData, resolutionDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resolutionSource">Fonte de resolução</Label>
                <Input
                  id="resolutionSource"
                  placeholder="Ex: Banco Central do Brasil, TSE, fonte oficial"
                  value={formData.resolutionSource}
                  onChange={(e) => setFormData({ ...formData, resolutionSource: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  rows={6}
                  placeholder="Explique o evento, contexto e critérios de resolução."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <Checkbox
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, featured: Boolean(checked) })}
                />
                <div className="space-y-0.5">
                  <Label htmlFor="featured" className="cursor-pointer">Destacar na home</Label>
                  <p className="text-xs text-slate-500">Coloca o mercado na seção de destaque.</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-500">Status inicial: aberto para negociação.</p>
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={createMutation.isLoading}
                >
                  {createMutation.isLoading ? 'Criando...' : 'Criar mercado'}
                </Button>
              </div>
            </form>
          </Card>

          <div className="space-y-4">
            <Card className="p-5 border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-slate-500" />
                <p className="text-sm font-semibold text-slate-900">Resumo do mercado</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Preço SIM</span>
                  <span className="text-sm font-semibold text-emerald-700 tabular-nums">{yesPrice}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Preço NÃO</span>
                  <span className="text-sm font-semibold text-rose-700 tabular-nums">{noPrice}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CalendarDays className="w-4 h-4 text-slate-500" />
                  <span>Encerramento em {formatBRDateTime(formData.closingDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <BarChart3 className="w-4 h-4 text-slate-500" />
                  <span>Categoria: {categoryLabel}</span>
                </div>
                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-emerald-700">SIM</span>
                    <span className="text-rose-700">NÃO</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden flex">
                    <div className="bg-emerald-600" style={{ width: `${yesInt}%` }} />
                    <div className="bg-rose-600" style={{ width: `${noInt}%` }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs font-semibold">
                    <span className="text-emerald-700">{yesInt}%</span>
                    <span className="text-rose-700">{noInt}%</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-5 border border-slate-200 bg-white shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Regras rápidas</h3>
              <ul className="space-y-2 text-sm text-slate-600 list-disc list-inside">
                <li>Preços iniciais são baseados na probabilidade informada.</li>
                <li>Use fontes oficiais para resolução e datas realistas.</li>
                <li>Mercados começam abertos; você pode fechá-los pelo Admin Hub.</li>
                <li>Preparado para liberar criação por usuários (mantido como admin-only).</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
