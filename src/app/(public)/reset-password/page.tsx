"use client";

export const dynamic = 'force-dynamic';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Mail } from 'lucide-react';
import { authClient } from '@/app/api/auth';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

function translateResetError(payload: any, err: any) {
  let raw =
    payload?.code ??
    payload?.title ??
    payload?.detail ??
    payload?.message ??
    (Array.isArray(payload?.errors) && (payload.errors[0]?.code || payload.errors[0]?.message)) ??
    err?.message ??
    'Erro inesperado.';

  if (typeof raw !== 'string') raw = String(raw);

  const key = raw.trim().toLowerCase();

  const map: Record<string, string> = {
    invalid_reset_token: 'Código inválido ou expirado. Solicite um novo código por e-mail.',
    expired_reset_token: 'Esse código expirou. Solicite um novo por e-mail.',
    user_not_found: 'Não encontramos uma conta com esse e-mail.',
    too_many_requests: 'Muitas tentativas. Aguarde um pouco e tente novamente.',
    external_account_cannot_change_password: 'Conta via Google — Sua conta foi criada com o Google. A senha só pode ser alterada nas configurações do Google.',
  };

  if (map[key]) return map[key];
  if (key.includes('invalid_reset_token')) return map.invalid_reset_token;
  if (key.includes('one or more validation errors occurred')) return 'Ocorreram erros de validação. Verifique os campos e tente novamente.';

  return raw;
}

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

export default function ResetPasswordCodePage(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialEmail = searchParams.get('email') || '';
  const [email, setEmail] = useState<string>(initialEmail);

  // step: "email" -> "code"
  const [step, setStep] = useState<string>(initialEmail ? 'code' : 'email');

  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [sent, setSent] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [resendLoading, setResendLoading] = useState<boolean>(false);

  const MAX_CHARS = 6;
  const [segments, setSegments] = useState<string[]>(() => Array(MAX_CHARS).fill(''));
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const combinedCode = segments.join('').trim();

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setEmail(initialEmail || '');
  }, [initialEmail]);

  const focusFirstCode = () => setTimeout(() => inputsRef.current?.[0]?.focus?.(), 50);

  const openConfirm = () => {
    setError(null);
    if (!email || !email.includes('@')) {
      setError('Informe um e-mail válido para receber o código.');
      return;
    }
    setShowConfirmModal(true);
  };

  const sendCode = async () => {
    setError(null);

    if (!email || !email.includes('@')) {
      setError('Informe um e-mail válido para receber o código.');
      setShowConfirmModal(false);
      return;
    }

    try {
      setSending(true);
      await authClient.forgotPassword(email.trim());

      setSent(true);
      setShowConfirmModal(false);

      // só agora mostra a "telinha" do código
      setStep('code');
      setSegments(Array(MAX_CHARS).fill(''));
      focusFirstCode();
    } catch (err) {
      console.error('Failed to send reset code:', err);
      const payload = (err as any)?.payload || (err as any)?.response || null;
      setError(translateResetError(payload, err));
      setShowConfirmModal(false);
    } finally {
      setSending(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    try {
      setResendLoading(true);
      await authClient.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      console.error('Failed to resend reset code:', err);
      const payload = (err as any)?.payload || (err as any)?.response || null;
      setError(translateResetError(payload, err));
    } finally {
      setResendLoading(false);
    }
  };

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('E-mail ausente.');
      return;
    }

    const finalCode = combinedCode;
    if (!finalCode || finalCode.length < MAX_CHARS) {
      setError('Informe o código completo recebido por e-mail.');
      return;
    }

    setLoading(true);
    try {
      await authClient.verifyResetCode({ email, code: String(finalCode).trim() });

      try {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('predictx_reset', JSON.stringify({ email, code: String(finalCode).trim() }));
        }
      } catch {
        // ignore
      }

      router.replace('/reset-password/new');
    } catch (err: any) {
      console.error('Falha ao verificar código de reset:', err);
      const payload = err?.payload || err?.response || null;
      setError(translateResetError(payload, err));
    } finally {
      setLoading(false);
    }
  };

  const CodeInputs = () => (
    <div className="flex justify-center">
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: MAX_CHARS }).map((_, idx) => (
          <input
            key={idx}
            id={`reset-code-${idx}`}
            ref={(el) => {
              if (el) inputsRef.current[idx] = el;
            }}
            inputMode="numeric"
            autoComplete="one-time-code"
            title={`Dígito ${idx + 1} de ${MAX_CHARS}`}
            placeholder={`•`}
            aria-label={`Dígito ${idx + 1} de ${MAX_CHARS}`}
            className="w-12 h-11 text-center rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
            value={segments[idx]}
            onChange={(e) => {
              const raw = e.target.value || '';
              const ch = raw.slice(-1).replace(/\D/g, '');

              const next = [...segments];
              next[idx] = ch;
              setSegments(next);

              if (ch && idx < MAX_CHARS - 1) {
                inputsRef.current[idx + 1]?.focus?.();
              }
            }}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Backspace' && !segments[idx] && idx > 0) {
                inputsRef.current[idx - 1]?.focus?.();
              }
              if (e.key === 'ArrowLeft' && idx > 0) {
                inputsRef.current[idx - 1]?.focus?.();
              }
              if (e.key === 'ArrowRight' && idx < MAX_CHARS - 1) {
                inputsRef.current[idx + 1]?.focus?.();
              }
            }}
            onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => {
              e.preventDefault();
              const pasted = e.clipboardData.getData('text') || '';
              const chars = pasted.replace(/\D/g, '').split('').slice(0, MAX_CHARS);

              if (!chars.length) return;

              const next = Array(MAX_CHARS).fill('');
              for (let i = 0; i < chars.length; i++) next[i] = chars[i];
              setSegments(next);

              const focusIndex = Math.min(chars.length, MAX_CHARS - 1);
              inputsRef.current[focusIndex]?.focus?.();
            }}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="relative flex-1 w-full overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center px-4 py-20 md:py-28">
        <div className="absolute -top-24 -right-32 h-[360px] w-[360px] rounded-full bg-emerald-200/35 blur-3xl" />
        <div className="absolute -bottom-24 -left-32 h-[360px] w-[360px] rounded-full bg-emerald-100/45 blur-3xl" />

        <div className="relative mx-auto max-w-xl w-full">
          <div className="overflow-hidden rounded-[24px] bg-white/90 backdrop-blur-xl shadow-[0_18px_60px_-30px_rgba(2,6,23,0.22)] border border-slate-200/60">
            <div className="p-8">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-900">Redefinir senha</h1>
                <p className="mt-2 text-sm text-slate-600">
                  {step === 'email' ? 'Informe seu e-mail para receber o código.' : 'Informe o código que recebeu por e-mail para continuar.'}
                </p>
              </div>

              {/* EMAIL */}
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">E-mail</label>

                  {step === 'code' && (
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setStep('email');
                        setSegments(Array(MAX_CHARS).fill(''));
                      }}
                      className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      Trocar e-mail
                    </button>
                  )}
                </div>

                <div className="mt-2 flex gap-3 items-center">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="voce@exemplo.com"
                      className={`h-11 pl-10 rounded-xl ${step === 'code' ? 'bg-slate-50 text-slate-600' : ''}`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={step === 'code'}
                      readOnly={step === 'code'}
                    />
                  </div>

                  {step === 'email' && (
                    <div className="w-44">
                      <button
                        type="button"
                        onClick={openConfirm}
                        className="h-11 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-base text-white disabled:opacity-60 disabled:cursor-not-allowed"
                        disabled={sending || !email}
                      >
                        {sending ? 'Enviando...' : 'Enviar código'}
                      </button>
                    </div>
                  )}
                </div>

                {sent && step === 'code' && <p className="mt-2 text-sm text-emerald-700">Código enviado para <strong>{email}</strong>.</p>}
              </div>

              {/* CÓDIGO (só aparece depois do modal/confirmar envio) */}
              {step === 'code' && (
                <form className="mt-6 space-y-4" onSubmit={handleContinue}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-700">Código</label>

                      <button type="button" onClick={handleResend} className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed" disabled={resendLoading}>
                        {resendLoading ? 'Reenviando...' : 'Reenviar código'}
                      </button>
                    </div>

                    <CodeInputs />

                    {error && (
                      <div className="mt-3 flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
                        <AlertCircle className="mt-0.5 h-4 w-4" />
                        <p>{error}</p>
                      </div>
                    )}
                  </div>

                  <Button type="submit" className="h-11 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-base" disabled={loading}>
                    {loading ? 'Continuando...' : 'Continuar'}
                  </Button>
                </form>
              )}

              {step === 'email' && error && (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  <AlertCircle className="mt-0.5 h-4 w-4" />
                  <p>{error}</p>
                </div>
              )}

              <div className="mt-6 text-center text-sm text-slate-600">
                <Link href="/sign-in" className="font-semibold text-emerald-700 hover:text-emerald-800">Voltar para login</Link>
              </div>
            </div>
          </div>
        </div>

      </main>
      <Footer />

      {/* MODAL (aparece antes de liberar os campos de código) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowConfirmModal(false)} />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900">Confirmar e-mail</h3>
              <p className="mt-2 text-sm text-slate-600">Deseja enviar o código para o e-mail abaixo?</p>

              <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900">{email}</div>

              <div className="mt-5 flex justify-end gap-3">
                <button className="h-10 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700" onClick={() => setShowConfirmModal(false)} type="button" disabled={sending}>Cancelar</button>

                <button className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white" onClick={sendCode} type="button" disabled={sending}>{sending ? 'Enviando...' : 'Confirmar e enviar'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
