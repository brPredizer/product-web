"use client";

export const dynamic = 'force-dynamic';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { authClient } from '@/app/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Lock, Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordNewPage(): JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [email, setEmail] = useState<string>(searchParams.get('email') || '');
  const [code, setCode] = useState<string>(searchParams.get('code') || '');

  useEffect(() => {
    if ((email && code) || typeof window === 'undefined') return;
    try {
      const raw = sessionStorage.getItem('predictx_reset');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.email) setEmail(parsed.email || '');
      if (parsed?.code) setCode(parsed.code || '');
    } catch {
      // ignore
    }
  }, [email, code]);

  const [password, setPassword] = useState<string>('');
  const [confirm, setConfirm] = useState<string>('');

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const [submitted, setSubmitted] = useState<boolean>(false);
  const [sec, setSec] = useState<number>(10);

  useEffect(() => {
    if (!submitted) return;
    setSec(10);
    const t = setInterval(() => setSec((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [submitted]);

  useEffect(() => {
    if (submitted && sec <= 0) {
      router.replace('/sign-in');
    }
  }, [sec, submitted, router]);

  function CountdownCircle({ value, total = 10 }: { value: number; total?: number }) {
    const radius = 18;
    const stroke = 3;
    const normalizedRadius = radius - stroke / 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const progress = Math.max(0, Math.min(1, value / total));
    const offset = circumference * (1 - progress);

    return (
      <svg className="h-11 w-11" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-label={`Redirecionando em ${value} segundos`}>
          <g transform="translate(20,20)">
            <circle r={normalizedRadius} fill="none" stroke="var(--count-bg)" strokeWidth={stroke} />
            <circle
              r={normalizedRadius}
              fill="none"
              stroke="var(--count-progress)"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90)"
            />
            <text x="0" y="3" textAnchor="middle" fontSize="12" fontWeight={700} fill="var(--count-text)">
              {value}
            </text>
          </g>
      </svg>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !email.includes('@')) {
      setError('E-mail inválido.');
      return;
    }
    if (!code) {
      setError('Código de reset ausente. Volte e cole o código recebido.');
      return;
    }
    if (!password.trim() || password.length < 6) {
      setError('Use uma senha com pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas precisam ser iguais.');
      return;
    }

    setLoading(true);
    try {
      await authClient.resetPassword({
        email: email.trim(),
        code: code.trim(),
        resetCode: code.trim(),
        password,
        newPassword: password,
        confirmPassword: confirm,
      });

      setSubmitted(true);

      try {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('predictx_reset');
        }
      } catch {
        // ignore
      }
    } catch (err: any) {
      console.error('Reset password failed:', err);
      const payload = err?.payload || err?.response || null;
      const translateResetNewError = (payload: any, err: any) => {
        let raw =
          payload?.code ||
          payload?.title ||
          payload?.detail ||
          payload?.message ||
          (Array.isArray(payload?.errors) && (payload.errors[0]?.code || payload.errors[0]?.message)) ||
          err?.message ||
          'Erro inesperado.';

        if (typeof raw !== 'string') raw = String(raw);
        const key = raw.trim().toLowerCase();

        const map: Record<string, string> = {
          invalid_token: 'Token inválido.',
          reset_code_invalid: 'Código de reset inválido.',
          reset_code_expired: 'Código de reset expirado.',
          password_mismatch: 'A confirmação não coincide com a nova senha.',
          missing_current_password: 'Informe a senha atual.',
          external_account_cannot_change_password: 'Conta via Google — Sua conta foi criada com o Google. A senha só pode ser alterada nas configurações do Google.',
        };

        if (map[key]) return map[key];
        if (key.includes('reset') && key.includes('expired')) return map.reset_code_expired;
        if (key.includes('reset') && key.includes('invalid')) return map.reset_code_invalid;
        if (key.includes('one or more validation errors occurred')) return 'Ocorreram erros de validação. Verifique os campos.';
        return raw;
      };

      setError(translateResetNewError(payload, err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="absolute -top-24 -right-32 h-[360px] w-[360px] rounded-full bg-emerald-200/35 blur-3xl" />
      <div className="absolute -bottom-24 -left-32 h-[360px] w-[360px] rounded-full bg-emerald-100/45 blur-3xl" />

      <div className="relative mx-auto max-w-xl px-4 py-10 sm:py-12">
        <div className="overflow-hidden rounded-[24px] bg-white/90 backdrop-blur-xl shadow-[0_18px_60px_-30px_rgba(2,6,23,0.22)] border border-slate-200/60">
          <div className="p-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-900">Nova senha</h1>
              <p className="mt-2 text-sm text-slate-600">Defina sua nova senha para a conta <strong>{email}</strong>.</p>
            </div>

            {submitted ? (
              <div className="mt-7 flex flex-col items-center text-center">
                <p className="text-sm text-slate-700">Senha redefinida com sucesso. <br /> Redirecionando para o login em.</p>

                <div className="mt-4 flex justify-center">
                  <CountdownCircle value={sec} total={10} />
                </div>

                <div className="mt-5">
                  <Link href="/sign-in">
                    <Button className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-base">Ir para login</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Nova senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="••••••••" className="h-11 pl-10 rounded-xl" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Confirmar senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input type={showConfirm ? 'text' : 'password'} autoComplete="new-password" placeholder="••••••••" className="h-11 pl-10 rounded-xl" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                    <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800" aria-label={showConfirm ? 'Ocultar confirmação' : 'Mostrar confirmação'}>
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    <AlertCircle className="mt-0.5 h-4 w-4" />
                    <p>{error}</p>
                  </div>
                )}

                <Button type="submit" className="h-11 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-base" disabled={loading}>{loading ? 'Salvando...' : 'Salvar nova senha'}</Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
