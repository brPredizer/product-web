'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authClient } from '@/app/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { AlertCircle, Mail } from 'lucide-react';

export default function ForgotPasswordPage(): JSX.Element {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Informe um e-mail valido.');
      return;
    }

    setLoading(true);
    try {
      await authClient.forgotPassword(email.trim());
      const params = new URLSearchParams({ email: email.trim() });
      router.push(`/reset-password?${params.toString()}`);
    } catch (err: any) {
      console.error('Forgot password failed:', err);
      const payload = err?.payload || err?.response || null;
      const translateForgotError = (payload: any, err: any) => {
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
          user_not_found: 'Não encontramos uma conta com esse e-mail.',
          too_many_requests: 'Muitas tentativas. Aguarde um pouco e tente novamente.',
          invalid_email: 'E-mail inválido.',
          external_account_cannot_change_password: 'Conta via Google — Sua conta foi criada com o Google. A senha só pode ser alterada nas configurações do Google.',
        };

        if (map[key]) return map[key];
        if (key.includes('not found')) return map.user_not_found;
        return raw;
      };

      setError(translateForgotError(payload, err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="relative flex-1 w-full overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center px-4 py-20 md:py-28">
        <div className="absolute -top-24 -right-32 h-[360px] w-[360px] rounded-full bg-emerald-200/35 blur-3xl" />
        <div className="absolute -bottom-24 -left-32 h-[360px] w-[360px] rounded-full bg-emerald-100/45 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.22]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(2,6,23,0.12) 1px, transparent 0)',
            backgroundSize: '26px 26px',
          }}
        />
        <div className="relative mx-auto max-w-xl w-full">
          <div className="overflow-hidden rounded-[24px] bg-white/90 backdrop-blur-xl shadow-[0_18px_60px_-30px_rgba(2,6,23,0.22)] border border-slate-200/60">
            <div className="p-8">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-900">Redefinir senha</h1>
                <p className="mt-2 text-sm text-slate-600">Informe seu e-mail para receber o código.</p>
              </div>

              {submitted ? (
                <div className="mt-6 text-center text-sm text-slate-700">Se o e-mail existir, enviamos um código por e-mail.</div>
              ) : (
                <form className="mt-6" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">E-mail</label>

                    <div className="mt-2 flex gap-3 items-center">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input type="email" autoComplete="email" placeholder="voce@exemplo.com" className="h-11 pl-10 rounded-xl" value={email} onChange={(e) => setEmail(e.target.value)} />
                      </div>

                      <div className="w-44">
                        <Button type="submit" className="h-11 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-base" disabled={loading || !email}>
                          {loading ? 'Enviando...' : 'Enviar código'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="mt-4 flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
                      <AlertCircle className="mt-0.5 h-4 w-4" />
                      <p>{error}</p>
                    </div>
                  )}
                </form>
              )}

              <div className="mt-6 text-center text-sm text-slate-600">
                <Link href="/sign-in" className="font-semibold text-emerald-700 hover:text-emerald-800">Voltar para login</Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
