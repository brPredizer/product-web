'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import Layout from '@/Layout';
import { authClient } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Eye, EyeOff, Lock, Mail, ShieldCheck, TrendingUp, Wallet } from 'lucide-react';

function FeatureItem({ icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-white/70 px-4 py-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-sm text-slate-600 leading-snug">{description}</p>
      </div>
    </div>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleScriptError, setGoogleScriptError] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const signupSuccess = searchParams.get('created') === '1';
  const googleButtonRef = useRef(null);
  const googleInitializedRef = useRef(false);
  const googleClientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    '398416516666-buge59kr35irh3mkia29hhotai611ol1.apps.googleusercontent.com';

  const features = useMemo(
    () => [
      {
        icon: TrendingUp,
        title: 'Mercados e desempenho',
        description: 'Explore categorias, use filtros e acompanhe preços e volume para decidir melhor.'
      },
      {
        icon: Wallet,
        title: 'Carteira e histórico',
        description: 'Gerencie saldo e acompanhe cada movimentação com registro detalhado.'
      },
      {
        icon: ShieldCheck,
        title: 'Base e segurança',
        description: 'Infra pronta para auditoria, consistência e integrações críticas.'
      }
    ],
    []
  );

  const handleGoogleCredential = useCallback(
    async (response) => {
      if (!response?.credential) {
        setError('Google credential missing.');
        return;
      }

      setGoogleLoading(true);
      setError(null);
      try {
        await authClient.loginWithGoogle(response.credential);
        router.push('/Home');
      } catch (err) {
        console.error('Google login failed:', err);
        setError(err?.message || 'Google login failed.');
      } finally {
        setGoogleLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    if (!googleReady || googleInitializedRef.current) return;
    if (!googleButtonRef.current || typeof window === 'undefined') return;
    if (!window.google?.accounts?.id) return;

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: handleGoogleCredential
    });

    const el = googleButtonRef.current;

    const render = () => {
      const buttonWidth = el.offsetWidth;
      const width = buttonWidth ? Math.floor(buttonWidth) : 360;

      el.innerHTML = ""; // garante re-render limpo se recalcular
      window.google.accounts.id.renderButton(el, {
        theme: 'filled_black',
        size: 'large',
        shape: 'pill',
        width,
        text: 'continue_with',
        logo_alignment: 'left',
      });
    };

    render();

    const ro = new ResizeObserver(() => render());
    ro.observe(el);

    googleInitializedRef.current = true;

    return () => ro.disconnect();
  }, [googleReady, googleClientId, handleGoogleCredential]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Informe um e-mail válido.');
      return;
    }
    if (!password.trim()) {
      setError('Informe sua senha.');
      return;
    }

    setLoading(true);
    try {
      await authClient.login({ email, password });
      router.push('/Home');
    } catch (err) {
      console.error('Falha no login:', err);
      setError('Não foi possível entrar. Verifique seus dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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

      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:py-12">
        <div className="overflow-hidden rounded-[24px] bg-white/90 backdrop-blur-xl shadow-[0_18px_60px_-30px_rgba(2,6,23,0.22)] border border-slate-200/60">
          <div className="grid grid-cols-1 md:grid-cols-2 items-stretch">
            {/* Lado esquerdo */}
            <div className="p-8 sm:p-10 bg-white/75">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold">
                  P
                </div>
                <div className="leading-tight">
                  <p className="text-xs text-slate-500">Bem-vindo ao</p>
                  <p className="text-base font-bold text-slate-900">
                    Predict<span className="text-emerald-600">X</span>
                  </p>
                </div>
              </div>

              <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900">
                Transforme opinião em posição.
              </h1>
              <p className="mt-3 text-slate-600 leading-relaxed">
                Negocie previsões em mercados SIM/NÃO, acompanhe sua carteira e veja desempenho em um painel simples e direto.
              </p>

              <div className="mt-6 space-y-3">
                {features.map((f) => (
                  <FeatureItem key={f.title} icon={f.icon} title={f.title} description={f.description} />
                ))}
              </div>
            </div>

            {/* Lado direito */}
            <div className="p-8 sm:p-10 md:border-l md:border-slate-200/60">
              <div className="flex flex-col items-center gap-3 text-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Entrar</h2>
                  <p className="text-sm text-slate-600 mt-1">Use suas credenciais para continuar.</p>
                </div>
              </div>

              {signupSuccess && (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  <AlertCircle className="mt-0.5 h-4 w-4" />
                  <p>Conta criada. Faça login para continuar.</p>
                </div>
              )}

              {/* Social */}
              <div className="mt-5 flex flex-col items-center">
                <div ref={googleButtonRef} className={(!googleReady || googleScriptError) ? "hidden" : ""} />
                {googleLoading && (
                  <p className="text-xs text-slate-500 text-center mt-2">Entrando com Google…</p>
                )}
                {googleScriptError && (
                  <p className="text-xs text-rose-600 text-center mt-2">Falha ao carregar o login do Google.</p>
                )}
              </div>

              <div className="my-5 flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs uppercase tracking-wide text-slate-400">ou</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="voce@exemplo.com"
                      className="h-11 pl-10 rounded-xl"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      type={showPass ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="h-11 pl-10 pr-11 rounded-xl"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800"
                      aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    <AlertCircle className="mt-0.5 h-4 w-4" />
                    <p>{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="h-11 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-base"
                  disabled={loading}
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </Button>

                <div className="text-center text-sm text-slate-600">
                  <span className="mr-2">Novo aqui?</span>
                  <Link href="/Signup" className="font-semibold text-emerald-700 hover:text-emerald-800">
                    Criar conta
                  </Link>
                </div>
              </form>

            </div>
          </div>
        </div>
      </div>
    </div>
    <Script
      src="https://accounts.google.com/gsi/client"
      async
      defer
      onLoad={() => setGoogleReady(true)}
      onError={() => setGoogleScriptError(true)}
    />
    </>
  );
}

export default function LoginPage() {
  return (
    <Layout currentPageName="Login">
      <LoginPageContent />
    </Layout>
  );
}

