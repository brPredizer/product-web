'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { authClient } from '@/app/api/auth';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

function CountdownCircle({ value, total = 10 }: { value: number; total?: number }) {
  const radius = 18;
  const stroke = 3;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const progress = Math.max(0, Math.min(1, value / total));
  const offset = circumference * (1 - progress);

  return (
    <svg
      className="h-11 w-11"
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`Redirecionando em ${value} segundos`}
    >
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

export default function ConfirmEmailPage(): JSX.Element {
  const params: any = useParams();
  const userId = Array.isArray(params?.userId) ? params.userId[0] : params?.userId;
  const code = Array.isArray(params?.code) ? params.code[0] : params?.code;
  const [status, setStatus] = useState<string>('loading');
  const [error, setError] = useState<string | null>(null);
  const [sec, setSec] = useState<number>(10);
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      if (!userId || !code) {
        setStatus('error');
        setError('Parametros invalidos para confirmacao.');
        return;
      }
      try {
        await authClient.confirmEmail({ userId, code });
        setStatus('success');
      } catch (err) {
        console.error('Confirm email failed:', err);
        setStatus('error');
        setError('Nao foi possivel confirmar o email.');
      }
    };
    run();
  }, [userId, code]);

  useEffect(() => {
    if (status !== 'success') return;
    setSec(10);
    const t = setInterval(() => setSec((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  useEffect(() => {
    if (status === 'success' && sec <= 0) {
      router.replace('/sign-in');
    }
  }, [sec, status, router]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="absolute -top-24 -right-32 h-[360px] w-[360px] rounded-full bg-emerald-200/35 blur-3xl" />
      <div className="absolute -bottom-24 -left-32 h-[360px] w-[360px] rounded-full bg-emerald-100/45 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(2,6,23,0.12) 1px, transparent 0)',
          backgroundSize: '26px 26px'
        }}
      />
      <div className="relative mx-auto max-w-xl px-4 py-10 sm:py-12">
        <div className="overflow-hidden rounded-[24px] bg-white/90 backdrop-blur-xl shadow-[0_18px_60px_-30px_rgba(2,6,23,0.22)] border border-slate-200/60">
          <div className="p-8 text-center">
            {status === 'loading' && (
              <p className="text-sm text-slate-600">Confirmando seu email...</p>
            )}

            {status === 'success' && (
              <>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h1 className="mt-4 text-2xl font-bold text-slate-900">Email confirmado</h1>
                <p className="mt-2 text-sm text-slate-600">
                  Sua conta esta pronta. Voce ja pode entrar.
                </p>

                <div className="mt-7 flex flex-col items-center text-center">
                  <p className="text-sm text-slate-700">
                    Conta confirmada com sucesso. <br /> Redirecionando para o login em.
                  </p>

                  <div className="mt-4 flex justify-center">
                    <CountdownCircle value={sec} total={10} />
                  </div>

                  <div className="mt-5">
                    <Link href="/sign-in">
                      <Button className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-base">
                        Ir para login
                      </Button>
                    </Link>
                  </div>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <h1 className="mt-4 text-2xl font-bold text-slate-900">Erro na confirmacao</h1>
                <p className="mt-2 text-sm text-slate-600">{error}</p>
                <div className="mt-6">
                  <Link href="/sign-in">
                    <Button className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-base">
                      Voltar para login
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
