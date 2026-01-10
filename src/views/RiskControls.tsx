"use client";

import React, { useState } from 'react';
import { mockApi } from '@/api/mockClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, TrendingDown, Clock, Ban, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { addDays, addMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RiskControlsProps {
  user?: any;
}

export default function RiskControlsPage({ user }: RiskControlsProps) {
  const queryClient = useQueryClient();

  const { data: limits } = useQuery({
    queryKey: ['risk-limits', user?.id],
    queryFn: async () => {
      const result = await (mockApi as any).entities.UserRiskLimits.filter({ user_id: user.id });
      return result[0] || null;
    },
    enabled: !!user
  });

  const updateLimitsMutation = useMutation({
    mutationFn: async (data: any) => {
      if (limits?.id) {
        return (mockApi as any).entities.UserRiskLimits.update(limits.id, data);
      } else {
        return (mockApi as any).entities.UserRiskLimits.create({ ...data, user_id: user.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risk-limits', user?.id] });
      toast.success('Limites atualizados com sucesso');
    }
  });

  const [formData, setFormData] = useState<any>({
    daily_deposit_limit: '',
    weekly_deposit_limit: '',
    monthly_deposit_limit: '',
    daily_loss_limit: '',
    weekly_loss_limit: '',
    monthly_loss_limit: '',
    funding_cap: ''
  });

  React.useEffect(() => {
    if (limits) {
      setFormData({
        daily_deposit_limit: limits.daily_deposit_limit || '',
        weekly_deposit_limit: limits.weekly_deposit_limit || '',
        monthly_deposit_limit: limits.monthly_deposit_limit || '',
        daily_loss_limit: limits.daily_loss_limit || '',
        weekly_loss_limit: limits.weekly_loss_limit || '',
        monthly_loss_limit: limits.monthly_loss_limit || '',
        funding_cap: limits.funding_cap || ''
      });
    }
  }, [limits]);

  const handleSaveLimits = () => {
    const cleanData: any = {};
    Object.keys(formData).forEach((key) => {
      const value = parseFloat(formData[key]);
      if (!isNaN(value) && value > 0) {
        cleanData[key] = value;
      }
    });
    updateLimitsMutation.mutate(cleanData);
  };

  const handleTradingBreak = (days: number) => {
    const breakUntil = addDays(new Date(), days).toISOString();
    updateLimitsMutation.mutate({ trading_break_until: breakUntil });
  };

  const handleSelfExclusion = (months: number) => {
    if (!confirm(`Tem certeza? Você ficará excluído por ${months} meses.`)) return;
    const excludeUntil = addMonths(new Date(), months).toISOString();
    updateLimitsMutation.mutate({ self_excluded_until: excludeUntil });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-slate-500">Faça login para acessar controles de risco</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOnBreak = limits?.trading_break_until && new Date(limits.trading_break_until) > new Date();
  const isExcluded = limits?.self_excluded_until && new Date(limits.self_excluded_until) > new Date();

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-emerald-600" />
            <h1 className="text-3xl font-bold text-slate-900">Controles de Risco</h1>
          </div>
          <p className="text-slate-500">
            Defina limites para proteger seu bem-estar financeiro e emocional
          </p>
        </div>

        {/* Status Alerts */}
        {isExcluded && (
          <Card className="mb-6 border-rose-200 bg-rose-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Ban className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-rose-900 mb-1">Autoexclusão Ativa</p>
                  <p className="text-sm text-rose-700">
                    Você está autoexcluído até {format(new Date(limits.self_excluded_until), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isOnBreak && !isExcluded && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900 mb-1">Pausa Ativa</p>
                  <p className="text-sm text-amber-700">
                    Você está em pausa até {format(new Date(limits.trading_break_until), "d 'de' MMMM, HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {/* Deposit Limits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-blue-600" />
                Limites de Depósito
              </CardTitle>
              <CardDescription>
                Defina quanto você pode depositar por período
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Limite Diário (R$)
                </label>
                <Input
                  type="number"
                  placeholder="Ex: 100.00"
                  value={formData.daily_deposit_limit}
                  onChange={(e: any) => setFormData((prev: any) => ({ ...prev, daily_deposit_limit: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Limite Semanal (R$)
                </label>
                <Input
                  type="number"
                  placeholder="Ex: 500.00"
                  value={formData.weekly_deposit_limit}
                  onChange={(e: any) => setFormData((prev: any) => ({ ...prev, weekly_deposit_limit: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Limite Mensal (R$)
                </label>
                <Input
                  type="number"
                  placeholder="Ex: 2000.00"
                  value={formData.monthly_deposit_limit}
                  onChange={(e: any) => setFormData((prev: any) => ({ ...prev, monthly_deposit_limit: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Loss Limits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                Limites de Perda
              </CardTitle>
              <CardDescription>
                Defina quanto você pode perder por período
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Perda Máxima Diária (R$)
                </label>
                <Input
                  type="number"
                  placeholder="Ex: 50.00"
                  value={formData.daily_loss_limit}
                  onChange={(e: any) => setFormData((prev: any) => ({ ...prev, daily_loss_limit: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Perda Máxima Semanal (R$)
                </label>
                <Input
                  type="number"
                  placeholder="Ex: 200.00"
                  value={formData.weekly_loss_limit}
                  onChange={(e: any) => setFormData((prev: any) => ({ ...prev, weekly_loss_limit: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Perda Máxima Mensal (R$)
                </label>
                <Input
                  type="number"
                  placeholder="Ex: 800.00"
                  value={formData.monthly_loss_limit}
                  onChange={(e: any) => setFormData((prev: any) => ({ ...prev, monthly_loss_limit: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Funding Cap */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                Teto de Aporte Total
              </CardTitle>
              <CardDescription>
                Limite máximo que você pode ter depositado na plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                type="number"
                placeholder="Ex: 5000.00"
                value={formData.funding_cap}
                onChange={(e: any) => setFormData((prev: any) => ({ ...prev, funding_cap: e.target.value }))}
              />
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            onClick={handleSaveLimits}
            className="w-full bg-emerald-600 hover:bg-emerald-700 h-12"
            disabled={updateLimitsMutation.isPending}
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Salvar Limites
          </Button>

          {/* Trading Break */}
          <Card className="border-amber-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                Pausa Temporária
              </CardTitle>
              <CardDescription>
                Faça uma pausa nas apostas por um período determinado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleTradingBreak(1)}
                  disabled={isOnBreak || isExcluded}
                >
                  1 dia
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleTradingBreak(7)}
                  disabled={isOnBreak || isExcluded}
                >
                  7 dias
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleTradingBreak(30)}
                  disabled={isOnBreak || isExcluded}
                >
                  30 dias
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Self Exclusion */}
          <Card className="border-rose-200 bg-rose-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-rose-900">
                <Ban className="w-5 h-5 text-rose-600" />
                Autoexclusão
              </CardTitle>
              <CardDescription className="text-rose-700">
                <strong>Ação irreversível:</strong> Você será impedido de apostar pelo período escolhido
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="border-rose-300 text-rose-700 hover:bg-rose-100"
                  onClick={() => handleSelfExclusion(6)}
                  disabled={isExcluded}
                >
                  6 meses
                </Button>
                <Button
                  variant="outline"
                  className="border-rose-300 text-rose-700 hover:bg-rose-100"
                  onClick={() => handleSelfExclusion(12)}
                  disabled={isExcluded}
                >
                  1 ano
                </Button>
                <Button
                  variant="outline"
                  className="border-rose-300 text-rose-700 hover:bg-rose-100"
                  onClick={() => handleSelfExclusion(60)}
                  disabled={isExcluded}
                >
                  5 anos
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Help Resources */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Shield className="w-5 h-5 text-blue-600" />
                Precisa de Ajuda?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-800 space-y-2">
              <p>
                <strong>CVV:</strong> 188 (24h, gratuito)
              </p>
              <p>
                <strong>CAPS:</strong> Centro de Atenção Psicossocial (SUS/RAPS)
              </p>
              <p>
                Se você perceber sinais de perda de controle ou sofrimento relacionado a apostas, 
                busque ajuda profissional. O PredictX apoia o jogo responsável.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
