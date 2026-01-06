import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function KPIDetailModal({ open, onClose, kpiType, data }) {
  if (!kpiType || !data) return null;

  const renderDetails = () => {
    switch (kpiType) {
      case 'totalDepositedGross':
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-slate-200">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                <p className="font-semibold text-slate-900">Últimos Depósitos</p>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Data</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Usuário</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Valor Bruto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.transactions?.slice(0, 50).map((tx, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-2 text-xs text-slate-600">
                          {format(new Date(tx.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </td>
                        <td className="px-4 py-2 text-xs text-slate-900">
                          {data.users?.find(u => u.id === tx.user_id)?.email || 'N/A'}
                        </td>
                        <td className="px-4 py-2 text-xs text-right font-semibold text-slate-900">
                          R$ {(tx.amount || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              <p className="text-sm font-semibold text-emerald-900">Total: R$ {data.total?.toFixed(2)}</p>
              <p className="text-xs text-emerald-700 mt-1">{data.count} depósitos processados</p>
            </div>
          </div>
        );

      case 'totalDepositedNet':
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-slate-200">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                <p className="font-semibold text-slate-900">Últimos Depósitos</p>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Data</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Usuário</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Bruto</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Taxa 7%</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Líquido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.transactions?.slice(0, 50).map((tx, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-2 text-xs text-slate-600">
                          {format(new Date(tx.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </td>
                        <td className="px-4 py-2 text-xs text-slate-900">
                          {data.users?.find(u => u.id === tx.user_id)?.email || 'N/A'}
                        </td>
                        <td className="px-4 py-2 text-xs text-right text-slate-600">
                          R$ {(tx.amount || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-xs text-right text-rose-600">
                          -R$ {(tx.fee || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-xs text-right font-semibold text-emerald-600">
                          R$ {(tx.net_amount || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              <p className="text-sm font-semibold text-emerald-900">Total Líquido: R$ {data.total?.toFixed(2)}</p>
              <p className="text-xs text-emerald-700 mt-1">{data.count} depósitos creditados</p>
            </div>
          </div>
        );

      case 'totalWithdrawnGross':
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-slate-200">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                <p className="font-semibold text-slate-900">Solicitações de Saque</p>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Data</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Usuário</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-slate-500">Status</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Valor Bruto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.withdrawals?.slice(0, 50).map((w, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-2 text-xs text-slate-600">
                          {format(new Date(w.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </td>
                        <td className="px-4 py-2 text-xs text-slate-900">
                          {w.user_email}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <Badge variant="outline" className="text-xs">
                            {w.status === 'pending' ? 'Pendente' :
                             w.status === 'approved' ? 'Aprovado' :
                             w.status === 'rejected' ? 'Rejeitado' : 'Completo'}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-xs text-right font-semibold text-slate-900">
                          R$ {(w.amount || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              <p className="text-sm font-semibold text-emerald-900">Total: R$ {data.total?.toFixed(2)}</p>
              <p className="text-xs text-emerald-700 mt-1">{data.count} solicitações de saque</p>
            </div>
          </div>
        );

      case 'totalWithdrawnNet':
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-slate-200">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                <p className="font-semibold text-slate-900">Saques Aprovados</p>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Data</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Usuário</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Bruto</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Taxa 10%</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Líquido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.withdrawals?.slice(0, 50).map((w, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-2 text-xs text-slate-600">
                          {format(new Date(w.approved_at || w.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </td>
                        <td className="px-4 py-2 text-xs text-slate-900">
                          {w.user_email}
                        </td>
                        <td className="px-4 py-2 text-xs text-right text-slate-600">
                          R$ {(w.amount || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-xs text-right text-rose-600">
                          -R$ {(w.fee || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-xs text-right font-semibold text-emerald-600">
                          R$ {(w.net_amount || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              <p className="text-sm font-semibold text-emerald-900">Total Líquido: R$ {data.total?.toFixed(2)}</p>
              <p className="text-xs text-emerald-700 mt-1">{data.count} saques pagos</p>
            </div>
          </div>
        );

      case 'totalCustody':
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-slate-200">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                <p className="font-semibold text-slate-900">Saldos dos Usuários</p>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Usuário</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.users?.filter(u => (u.balance || 0) > 0).slice(0, 50).map((u, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-2 text-xs text-slate-900">
                          {u.email}
                        </td>
                        <td className="px-4 py-2 text-xs text-right font-semibold text-slate-900">
                          R$ {(u.balance || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              <p className="text-sm font-semibold text-emerald-900">Total em Custódia: R$ {data.total?.toFixed(2)}</p>
              <p className="text-xs text-emerald-700 mt-1">{data.count} usuários com saldo</p>
            </div>
          </div>
        );

      case 'depositFees':
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-slate-200">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                <p className="font-semibold text-slate-900">Taxas de Depósito</p>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Data</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Usuário</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Valor Depósito</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Taxa (7%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.transactions?.slice(0, 50).map((tx, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-2 text-xs text-slate-600">
                          {format(new Date(tx.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </td>
                        <td className="px-4 py-2 text-xs text-slate-900">
                          {data.users?.find(u => u.id === tx.user_id)?.email || 'N/A'}
                        </td>
                        <td className="px-4 py-2 text-xs text-right text-slate-600">
                          R$ {(tx.amount || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-xs text-right font-semibold text-emerald-600">
                          R$ {(tx.fee || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              <p className="text-sm font-semibold text-emerald-900">Total de Taxas: R$ {data.total?.toFixed(2)}</p>
              <p className="text-xs text-emerald-700 mt-1">{data.count} depósitos processados</p>
            </div>
          </div>
        );

      case 'withdrawalFees':
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-slate-200">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                <p className="font-semibold text-slate-900">Taxas de Saque</p>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Data</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Usuário</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Valor Saque</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Taxa (10%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.withdrawals?.slice(0, 50).map((w, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-2 text-xs text-slate-600">
                          {format(new Date(w.approved_at || w.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </td>
                        <td className="px-4 py-2 text-xs text-slate-900">
                          {w.user_email}
                        </td>
                        <td className="px-4 py-2 text-xs text-right text-slate-600">
                          R$ {(w.amount || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-xs text-right font-semibold text-emerald-600">
                          R$ {(w.fee || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              <p className="text-sm font-semibold text-emerald-900">Total de Taxas: R$ {data.total?.toFixed(2)}</p>
              <p className="text-xs text-emerald-700 mt-1">{data.count} saques aprovados</p>
            </div>
          </div>
        );

      default:
        return <p className="text-slate-500">Nenhum detalhe disponível</p>;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Origem dos Dados</SheetTitle>
          <SheetDescription>
            Detalhamento completo da origem e cálculo deste KPI
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          {renderDetails()}
        </div>
      </SheetContent>
    </Sheet>
  );
}