"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export type ConfirmEmailStatus = "loading" | "success" | "error";

export type ConfirmEmailResultProps = {
  status: ConfirmEmailStatus;
  error?: string | null;
  sec?: number;
};

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

export function ConfirmEmailResult({ status, error, sec = 10 }: ConfirmEmailResultProps) {
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
              "radial-gradient(circle at 1px 1px, rgba(2,6,23,0.12) 1px, transparent 0)",
            backgroundSize: "26px 26px"
          }}
        />
        <div className="relative mx-auto max-w-xl w-full">
          <div className="overflow-hidden rounded-[24px] bg-white/90 backdrop-blur-xl shadow-[0_18px_60px_-30px_rgba(2,6,23,0.22)] border border-slate-200/60">
            <div className="p-8 text-center">
              {status === "loading" && (
                <div className="flex flex-col items-center gap-3 text-slate-700">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                  <p className="text-base font-semibold text-slate-900">Confirmando seu email...</p>
                  <p className="text-sm text-slate-600">
                    Voce sera redirecionado assim que concluirmos a confirmacao.
                  </p>
                </div>
              )}

              {status === "success" && (
                <>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h1 className="mt-4 text-2xl font-bold text-slate-900">Email confirmado</h1>
                  <p className="mt-2 text-sm text-slate-600">Sua conta esta pronta. Você pode agora acessar sua conta.</p>

                  <div className="mt-2 flex flex-col items-center text-center">
                    <div className="mt-1 flex justify-center">
                      <div>
                        <CountdownCircle value={Math.max(0, sec)} total={10} />
                      </div>
                    </div>

                    <div className="mt-5">
                      <Link href="/sign-in">
                        <Button className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-base">
                          Ir para login
                        </Button>
                      </Link>
                    </div>
                  </div>
                </>
              )}

              {status === "error" && (
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
      </main>
      <Footer />
    </div>
  );
}

export default ConfirmEmailResult;
