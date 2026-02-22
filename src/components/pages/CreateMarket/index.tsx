"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { mockApi } from '@/app/api/mockClient';
import { apiRequest, createIdempotencyKey } from '@/app/api/api';
import { isAdminL2 } from '@/app/api/api';
import { createPageUrl } from '@/routes';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import InitialPricingBlock from "./InitialPricingBlock";
import { categories } from "./constants";
import {
  clampNumber,
  clampProbability,
  formatBRDateTime,
  toIsoStringOrNull,
  toLocalInputOrEmpty,
  toLocalInputValue,
} from "./utils";

type User = any;

// Workarounds: some UI primitives are untyped JS; treat them as loosely-typed React components
const LabelC = (Label as unknown) as React.ComponentType<any>;
const TextareaC = (Textarea as unknown) as React.ComponentType<any>;
const CheckboxC = (Checkbox as unknown) as React.ComponentType<any>;
const CardC = (Card as unknown) as React.ComponentType<any>;
const BadgeC = (Badge as unknown) as React.ComponentType<any>;
const InputC = (Input as unknown) as React.ComponentType<any>;
const SelectC = (Select as unknown) as React.ComponentType<any>;
const SelectContentC = (SelectContent as unknown) as React.ComponentType<any>;
const SelectItemC = (SelectItem as unknown) as React.ComponentType<any>;
const SelectTriggerC = (SelectTrigger as unknown) as React.ComponentType<any>;
const SelectValueC = (SelectValue as unknown) as React.ComponentType<any>;


interface Props {
  user?: User;
}

export default function CreateMarket({ user }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const marketId = searchParams.get('id');
  const queryClient = useQueryClient();
  const defaultClosing = toLocalInputValue(new Date(Date.now() + 1000 * 60 * 60 * 24 * 14));
  const defaultResolution = toLocalInputValue(new Date(Date.now() + 1000 * 60 * 60 * 24 * 21));

  const [formData, setFormData] = useState({
    title: '',
    category: 'ECONOMIA',
    description: '',
    resolutionSource: '',
    closingDate: defaultClosing,
    resolutionDate: defaultResolution,
    probability: 55,
    featured: false,
  });
  const [didHydrateEdit, setDidHydrateEdit] = useState(false);
  useEffect(() => {
    setDidHydrateEdit(false);
  }, [marketId]);
  const yesPercent = formData.probability;
  const setYesPercent = (value: number) => setFormData((prev) => ({ ...prev, probability: value }));
  const categoryLabel = categories.find((c) => c.id === formData.category)?.name || '—';
  const yesInt = clampNumber(parseInt(String(yesPercent ?? 50), 10), 0, 100);
  const noInt = 100 - yesInt;
  const yesPrice = (yesInt / 100).toFixed(2);
  const noPrice = (noInt / 100).toFixed(2);

  const { data: marketToEdit } = useQuery<any>({
    queryKey: ['market', 'edit', marketId],
    queryFn: async () => {
      if (!marketId) return null;
      const res = await apiRequest<any>(`/markets/${marketId}`);
      const raw = res?.data ?? (res?.items && Array.isArray(res.items) ? res.items[0] : res);
      if (!raw) return null;
      const { normalizeMarket } = await import("@/lib/normalizeMarket");
      return normalizeMarket(raw);
    },
    enabled: !!marketId,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!marketToEdit || didHydrateEdit) return;
    setFormData({
      title: marketToEdit.title ?? '',
      category: marketToEdit.category ?? 'economia',
      description: marketToEdit.description ?? '',
      resolutionSource: marketToEdit.resolutionSource ?? marketToEdit.resolution_source ?? '',
      closingDate: toLocalInputOrEmpty(marketToEdit.closing_date ?? marketToEdit.closingDate) || defaultClosing,
      resolutionDate: toLocalInputOrEmpty(marketToEdit.resolution_date ?? marketToEdit.resolutionDate) || defaultResolution,
      probability: clampProbability(marketToEdit.probability_yes ?? marketToEdit.probabilityYes ?? 50),
      featured: Boolean(marketToEdit.featured ?? false),
    });
    setDidHydrateEdit(true);
  }, [marketToEdit, defaultClosing, defaultResolution, didHydrateEdit]);

  const createOrUpdateMutation = useMutation<any, any, any>({
    mutationFn: async (payload) => {
      const body = {
        title: payload.title,
        description: payload.description,
        category: payload.category,
        tags: payload.tags ?? [],
        probability: payload.probability,
        closingDate: payload.closing_date ?? payload.closingDate,
        resolutionDate: payload.resolution_date ?? payload.resolutionDate,
        resolutionSource: payload.resolution_source ?? payload.resolutionSource,
        featured: payload.featured ?? false,
      };
      if (marketId) {
        return apiRequest<any>(`/markets/${marketId}`, { method: 'PUT', body });
      }
      const headers: Record<string, string> = {
        'Idempotency-Key': createIdempotencyKey(),
      };
      return apiRequest<any>('/markets/create-market', { method: 'POST', body, headers });
    },
    onSuccess: async (market) => {
      toast.success(marketId ? 'Mercado atualizado com sucesso' : 'Mercado criado com sucesso');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-markets'] } as any),
        queryClient.invalidateQueries({ queryKey: ['markets', 'explore'] } as any),
      ]);
      const targetId = marketId ?? market?.id ?? market?.data?.id;
      if (targetId) {
        router.push(createPageUrl(`Market?id=${targetId}`));
      } else {
        router.push(createPageUrl('Explore'));
      }
    },
    onError: (err: any) => {
      const message = err?.message ?? (marketId ? 'Erro ao atualizar mercado' : 'Erro ao criar mercado');
      toast.error(message);
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!user || !isAdminL2(user)) {
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

    createOrUpdateMutation.mutate({
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category,
      tags: [],
      probability: yesInt,
      closingDate: closingIso,
      resolutionDate: resolutionIso,
      resolutionSource: formData.resolutionSource.trim(),
      featured: formData.featured,
    });
  };

  if (!user || !isAdminL2(user)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md text-center shadow-sm">
          <Shield className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Apenas administradores</h2>
          <p className="text-slate-500">
            A criação de novos mercados está limitada a administradores. Em breve poderemos liberar para usuários selecionados.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Button onClick={() => router.push(createPageUrl('Explore'))} variant="outline" className="border-slate-200">
              Explorar mercados
            </Button>
            <Button onClick={() => router.push('/sign-in')} className="bg-emerald-600 hover:bg-emerald-700">
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
                  <BadgeC variant="outline" className="border-emerald-200 text-emerald-700">Admin</BadgeC>
                </div>
                <h1 className="text-2xl font-bold text-slate-900">{marketId ? "Editar mercado" : "Criar novo mercado"}</h1>
                <p className="text-slate-500">{marketId ? "Atualize título, probabilidade inicial e critérios de resolução." : "Defina título, probabilidade inicial e critérios de resolução."}</p>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push(createPageUrl('Admin'))}
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
          <CardC className="p-6 border border-slate-200 shadow-sm">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-0.5">
                <LabelC htmlFor="title">Título</LabelC>
                <InputC
                  id="title"
                  placeholder="Ex: Selic ficará acima de 10% em 2025?"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <LabelC>Categoria</LabelC>
                  <SelectC
                    value={formData.category}
                    onValueChange={(value: string) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTriggerC className="h-10">
                      <SelectValueC placeholder="Selecione" />
                    </SelectTriggerC>
                    <SelectContentC position="popper" side="bottom" align="start" avoidCollisions={false}>
                      {categories.map((cat) => (
                        <SelectItemC key={cat.id} value={cat.id}>{cat.name}</SelectItemC>
                      ))}
                    </SelectContentC>
                  </SelectC>
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
                  <LabelC htmlFor="closingDate">Data de encerramento</LabelC>
                  <InputC
                    id="closingDate"
                    type="datetime-local"
                    value={formData.closingDate}
                    onChange={(e) => setFormData({ ...formData, closingDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <LabelC htmlFor="resolutionDate">Data de resolução</LabelC>
                  <InputC
                    id="resolutionDate"
                    type="datetime-local"
                    value={formData.resolutionDate}
                    onChange={(e) => setFormData({ ...formData, resolutionDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <LabelC htmlFor="resolutionSource">Fonte de resolução</LabelC>
                <InputC
                  id="resolutionSource"
                  placeholder="Ex: Banco Central do Brasil, TSE, fonte oficial"
                  value={formData.resolutionSource}
                  onChange={(e) => setFormData({ ...formData, resolutionSource: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <LabelC htmlFor="description">Descrição</LabelC>
                <TextareaC
                  id="description"
                  rows={6}
                  placeholder="Explique o evento, contexto e critérios de resolução."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <CheckboxC
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, featured: checked === true }))
                  }
                />
                <div className="space-y-0.5">
                  <LabelC htmlFor="featured" className="cursor-pointer">Destacar na home</LabelC>
                  <p className="text-xs text-slate-500">Coloca o mercado na seção de destaque.</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-500">Status inicial: aberto para negociação.</p>
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={(createOrUpdateMutation as any).isLoading}
                >
                  {(createOrUpdateMutation as any).isLoading
                    ? (marketId ? 'Salvando...' : 'Criando...')
                    : (marketId ? 'Salvar alteracoes' : 'Criar mercado')}
                </Button>
              </div>
            </form>
          </CardC>

          <div className="space-y-4">
            <CardC className="p-5 border border-slate-200 bg-white shadow-sm">
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
            </CardC>

            <CardC className="p-5 border border-slate-200 bg-white shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Regras rápidas</h3>
              <ul className="space-y-2 text-sm text-slate-600 list-disc list-inside">
                <li>Preços iniciais são baseados na probabilidade informada.</li>
                <li>Use fontes oficiais para resolução e datas realistas.</li>
                <li>Mercados começam abertos; você pode fechá-los pelo Admin Hub.</li>
                <li>Preparado para liberar criação por usuários (mantido como admin-only).</li>
              </ul>
            </CardC>
          </div>
        </div>
      </div>
    </div>
  );
}



