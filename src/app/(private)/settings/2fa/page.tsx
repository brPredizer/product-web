'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { authClient } from '@/app/api/auth';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, ShieldCheck } from 'lucide-react';

export default function TwoFactorSettingsPage(): JSX.Element {
  const { isAuthenticated, isLoadingAuth, user } = useAuth();
  const [pendingEnabled, setPendingEnabled] = useState<boolean>(false);
  const [code, setCode] = useState<string>('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      const enabled = Boolean((user as any).twoFactorEnabled ?? (user as any).is2faEnabled);
      setPendingEnabled(enabled);
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) return;
    authClient
      .getManageInfo()
      .then((info: any) => {
        if (!info) return;
        setPendingEnabled(Boolean(info.twoFactorEnabled ?? info.is2faEnabled));
      })
      .catch(() => {
        // Ignore manage info refresh failures.
      });
  }, [isAuthenticated]);

  const handleSave = async () => {
    setError(null);
    setStatus(null);
    setSaving(true);
    try {
      await authClient.update2fa({
        enabled: pendingEnabled,
        isEnabled: pendingEnabled,
        code: code.trim() || undefined,
      });
      setStatus(pendingEnabled ? '2FA ativado.' : '2FA desativado.');
      setCode('');
    } catch (err) {
      console.error('Update 2FA failed:', err);
      setError('Não foi possivel atualizar o 2FA.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm text-slate-500">
        Carregando...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-slate-600">Voce precisa estar logado para gerenciar 2FA.</p>
        <Link href="/sign-in">
          <Button className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700">Ir para login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-2xl border border-slate-200 bg-white/90 p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Autenticacao em duas etapas</h1>
            <p className="text-sm text-slate-600">Ative uma camada extra de seguranca.</p>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-slate-900">2FA</p>
            <p className="text-xs text-slate-500">Requer um codigo adicional no login.</p>
          </div>
          <Switch checked={pendingEnabled} onCheckedChange={setPendingEnabled} disabled={saving} />
        </div>

        <div className="mt-6 space-y-2">
          <label className="text-sm font-medium text-slate-700">Codigo do autenticador</label>
          <Input
            type="text"
            autoComplete="one-time-code"
            placeholder="Se necessario, informe o codigo"
            className="h-11 rounded-xl"
            value={code}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setCode(event.target.value)}
          />
          <p className="text-xs text-slate-500">Informe o codigo caso a API exija confirmacao para ativar/desativar.</p>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <p>{error}</p>
          </div>
        )}

        {status && <div className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{status}</div>}

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-base" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar alteracoes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
