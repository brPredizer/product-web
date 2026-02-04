"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function EmailConfirmErrorPage(): JSX.Element {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center px-4 py-10">
      <div className="absolute -top-24 -right-32 h-[360px] w-[360px] rounded-full bg-rose-200/35 blur-3xl" />
      <div className="absolute -bottom-24 -left-32 h-[360px] w-[360px] rounded-full bg-rose-100/45 blur-3xl" />
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
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-700">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-slate-900">Nao foi possivel confirmar</h1>
            <p className="mt-2 text-sm text-slate-600">
              O link pode ter expirado ou ja ter sido usado. Solicite um novo email de confirmacao ou tente fazer login.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/sign-in">
                <Button className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-base">
                  Ir para login
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button variant="secondary" className="h-8 rounded-lg text-base">
                  Criar conta
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
