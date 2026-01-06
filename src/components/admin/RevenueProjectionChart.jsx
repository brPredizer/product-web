import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TrendingUp, Target, DollarSign, Zap } from 'lucide-react';
import { Slider } from "@/components/ui/slider";

export default function RevenueProjectionChart({ allTransactions = [], withdrawalRequests = [] }) {
  const [volumeGoal, setVolumeGoal] = useState(10000);
  const [depositPercentage, setDepositPercentage] = useState(60); // % do volume que seria depósitos
  
  // Calcular valores atuais
  const currentDeposits = allTransactions
    .filter(t => t.type === 'deposit')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  
  const currentWithdrawals = withdrawalRequests
    .filter(w => w.status === 'approved' || w.status === 'completed')
    .reduce((sum, w) => sum + (w.amount || 0), 0);
  
  const currentVolume = currentDeposits + currentWithdrawals;
  
  const currentDepositFees = allTransactions
    .filter(t => t.type === 'deposit')
    .reduce((sum, t) => sum + (t.fee || 0), 0);
  
  const currentWithdrawalFees = withdrawalRequests
    .filter(w => w.status === 'approved' || w.status === 'completed')
    .reduce((sum, w) => sum + (w.fee || 0), 0);
  
  const currentRevenue = currentDepositFees + currentWithdrawalFees;
  
  // Projeção baseada na meta
  const projectedDeposits = volumeGoal * (depositPercentage / 100);
  const projectedWithdrawals = volumeGoal * ((100 - depositPercentage) / 100);
  
  // Taxas: 2.5% depósitos, 7.5% saques
  const projectedDepositFees = projectedDeposits * 0.025;
  const projectedWithdrawalFees = projectedWithdrawals * 0.075;
  const projectedRevenue = projectedDepositFees + projectedWithdrawalFees;
  
  // Diferença entre atual e projeção
  const revenueDifference = projectedRevenue - currentRevenue;
  const volumeDifference = volumeGoal - currentVolume;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="w-5 h-5 text-purple-600" />
          Simulador de Receita
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-6">
          {/* Coluna 1: Configurações */}
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700 mb-2 block">Meta de Volume Total</label>
                <Input
                  type="number"
                  value={volumeGoal}
                  onChange={(e) => setVolumeGoal(parseFloat(e.target.value) || 0)}
                  className="w-full h-8 text-sm"
                  placeholder="Meta"
                />
                <p className="text-xs text-slate-500 mt-1">Volume em depósitos + saques</p>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-700">
                    % Depósitos vs Saques
                  </label>
                  <span className="text-xs font-semibold text-emerald-600">
                    {depositPercentage}% / {100 - depositPercentage}%
                  </span>
                </div>
                <Slider
                  value={[depositPercentage]}
                  onValueChange={(value) => setDepositPercentage(value[0])}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Depósitos</span>
                  <span>Saques</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                Situação Atual
              </h3>
              <div className="space-y-2">
                <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                  <p className="text-xs text-blue-700">Volume Total</p>
                  <p className="text-sm font-bold text-blue-600">R$ {currentVolume.toFixed(2)}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-200">
                  <p className="text-xs text-emerald-700">Receita Atual</p>
                  <p className="text-sm font-bold text-emerald-600">R$ {currentRevenue.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna 2: Projeção */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                <Target className="w-3 h-3" />
                Projeção com Meta
              </h3>
              <div className="space-y-2">
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <p className="text-xs text-purple-700 mb-1">Volume Meta</p>
                  <p className="text-lg font-bold text-purple-600">R$ {volumeGoal.toFixed(2)}</p>
                  <p className="text-xs text-purple-600 mt-1">
                    +R$ {volumeDifference.toFixed(2)} vs atual
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                    <p className="text-xs text-slate-600 mb-1">Depósitos</p>
                    <p className="text-sm font-semibold text-slate-700">R$ {projectedDeposits.toFixed(2)}</p>
                    <p className="text-xs text-emerald-600 mt-1">Taxa: R$ {projectedDepositFees.toFixed(2)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                    <p className="text-xs text-slate-600 mb-1">Saques</p>
                    <p className="text-sm font-semibold text-slate-700">R$ {projectedWithdrawals.toFixed(2)}</p>
                    <p className="text-xs text-cyan-600 mt-1">Taxa: R$ {projectedWithdrawalFees.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <p className="text-xs font-medium text-slate-700 mb-2">Breakdown de Taxas</p>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">Taxa Depósitos (2,5%)</span>
                  <span className="font-semibold text-emerald-600">R$ {projectedDepositFees.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">Taxa Saques (7,5%)</span>
                  <span className="font-semibold text-cyan-600">R$ {projectedWithdrawalFees.toFixed(2)}</span>
                </div>
                <div className="pt-1.5 border-t border-slate-300 flex justify-between items-center text-xs">
                  <span className="font-medium text-slate-700">Total</span>
                  <span className="font-bold text-emerald-600">R$ {projectedRevenue.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna 3: Resultado */}
          <div>
            <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-lg p-6 text-white h-full flex flex-col justify-center">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm opacity-90">Receita Projetada Total</p>
                <TrendingUp className="w-6 h-6" />
              </div>
              <p className="text-3xl font-bold mb-4">R$ {projectedRevenue.toFixed(2)}</p>
              <div className="pt-3 border-t border-white/30">
                <p className="text-xs opacity-90 mb-1">Diferença vs atual:</p>
                <p className="text-xl font-semibold mb-2">
                  {revenueDifference >= 0 ? '+' : ''}R$ {revenueDifference.toFixed(2)}
                </p>
                <p className="text-xs opacity-75">
                  {currentRevenue > 0 ? `${((revenueDifference / currentRevenue) * 100).toFixed(1)}% de aumento` : 'Primeira receita'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}