"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Layout from "@/Layout";
import { mockApi } from "@/api/mockClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  TrendingUp,
  User,
  Wallet
} from "lucide-react";

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

function SignupPageContent() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const highlights = useMemo(
    () => [
      {
        icon: TrendingUp,
        title: "Onboarding guiado",
        description: "Missões rápidas para aprender a operar contratos SIM/NÃO em minutos."
      },
      {
        icon: Wallet,
        title: "Gestão de carteira",
        description: "Depósitos, retiradas e histórico em um painel único e transparente."
      },
      {
        icon: ShieldCheck,
        title: "Confiança e auditoria",
        description: "Arquitetura pronta para integrações críticas e trilha de auditoria."
      }
    ],
    []
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Informe seu nome completo.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Informe um e-mail válido.");
      return;
    }
    if (!password.trim() || password.length < 6) {
      setError("Use uma senha com pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas precisam ser iguais.");
      return;
    }

    setLoading(true);
    try {
      await mockApi.entities.User.create({
        full_name: name.trim(),
        email: email.trim(),
        role: "trader",
        balance: 0,
        total_deposited: 0,
        total_withdrawn: 0,
        total_wagered: 0,
        win_rate: 0,
        markets_participated: 0,
        status: "pending",
        kyc_status: "unverified",
        user_type: "Retail",
        pending_withdrawals: 0,
        created_date: new Date().toISOString()
      });
      router.push("/Login?created=1");
    } catch (err) {
      console.error("Falha no cadastro:", err);
      setError("Não foi possível criar sua conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="absolute -top-24 -right-32 h-[360px] w-[360px] rounded-full bg-emerald-200/35 blur-3xl" />
      <div className="absolute -bottom-24 -left-32 h-[360px] w-[360px] rounded-full bg-emerald-100/45 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(2,6,23,0.12) 1px, transparent 0)",
          backgroundSize: "26px 26px"
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:py-12">
        <div className="overflow-hidden rounded-[24px] bg-white/90 backdrop-blur-xl shadow-[0_18px_60px_-30px_rgba(2,6,23,0.22)] border border-slate-200/60">
          <div className="grid grid-cols-1 md:grid-cols-2 items-stretch">
            <div className="p-8 sm:p-10 md:border-r md:border-slate-200/60 order-2 md:order-1 bg-white">
              <div className="flex flex-col items-center text-center gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Criar conta</h2>
                  <p className="text-sm text-slate-600 mt-1">Preencha seus dados para começar.</p>
                </div>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Nome completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="text"
                      autoComplete="name"
                      placeholder="Seu nome"
                      className="h-11 pl-10 rounded-xl"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>

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
                      type={showPass ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      className="h-11 pl-10 pr-11 rounded-xl"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800"
                      aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Confirmar senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Repita a senha"
                      className="h-11 pl-10 pr-11 rounded-xl"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800"
                      aria-label={showConfirm ? "Ocultar confirmação" : "Mostrar confirmação"}
                    >
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

                <Button
                  type="submit"
                  className="h-11 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-base"
                  disabled={loading}
                >
                  {loading ? "Criando conta..." : "Criar conta"}
                </Button>

                <div className="text-center text-sm text-slate-600">
                  <span className="mr-2">Já tem conta?</span>
                  <Link href="/Login" className="font-semibold text-emerald-700 hover:text-emerald-800">
                    Entrar
                  </Link>
                </div>
              </form>
            </div>

            <div className="p-8 sm:p-10 bg-white/75 order-1 md:order-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold">
                  PX
                </div>
                <div className="leading-tight">
                  <p className="text-xs text-emerald-700 font-semibold">Conta gratuita</p>
                  <p className="text-base font-bold text-slate-900">Comece em minutos</p>
                </div>
              </div>

              <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900">
                Tudo o que você precisa para investir melhor.
              </h1>
              <p className="mt-3 text-slate-600 leading-relaxed">
                Cadastre-se para acessar mercados temáticos, alertas personalizados e carteira unificada com histórico completo.
              </p>

              <div className="mt-6 space-y-3">
                {highlights.map((f) => (
                  <FeatureItem key={f.title} icon={f.icon} title={f.title} description={f.description} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Layout currentPageName="Signup">
      <SignupPageContent />
    </Layout>
  );
}
