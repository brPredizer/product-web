"use client";

import React, { useState, useRef } from "react";
import Script from "next/script";

export default function CardCheckoutPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const cardForm = useRef({ number: "", exp_month: "", exp_year: "", security_code: "", cardholderName: "" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
    // @ts-ignore
    let mp = typeof window !== "undefined" ? (window as any).MercadoPago?.(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY) || (window as any).MercadoPago : null;

      if (!mp) {
        // try global constructor
        // @ts-ignore
        if (typeof window !== "undefined" && (window as any).MercadoPago) {
          // @ts-ignore
          mp = new (window as any).MercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY, { locale: "pt-BR" });
        }
      }

      // Fallback: try to call createCardToken directly if available
      // The exact API can vary; handle generically and send token to backend
      // Build card data
      const cardData: any = {
        card_number: cardForm.current.number,
        expiration_month: cardForm.current.exp_month,
        expiration_year: cardForm.current.exp_year,
        security_code: cardForm.current.security_code,
        cardholder: { name: cardForm.current.cardholderName },
      };

      let tokenId: string | undefined;

      // @ts-ignore
      if (mp && typeof mp.createCardToken === "function") {
        // @ts-ignore
        const resp = await mp.createCardToken(cardData);
        tokenId = resp?.id || resp?.card?.id || resp?.token;
      } else if (typeof (window as any).MercadoPago === "function") {
        // try constructor
        // @ts-ignore
        const instance = new (window as any).MercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY, { locale: "pt-BR" });
        if (typeof instance.createCardToken === "function") {
          const resp = await instance.createCardToken(cardData);
          tokenId = resp?.id || resp?.card?.id || resp?.token;
        }
      }

      if (!tokenId) throw new Error("Falha ao tokenizar cartão (verifique a chave pública e o SDK)");

      const backendRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/payments/mercadopago/card`, {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 29.9, description: "Plano - Mensal", orderId: `ORDER_${Date.now()}`, buyerEmail: "buyer@test.com", token: tokenId, installments: 1, paymentMethodId: "visa" }),
      });

      if (!backendRes.ok) throw new Error(await backendRes.text());
      const data = await backendRes.json();
      setResult(data);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 520 }}>
      <Script src="https://sdk.mercadopago.com/js/v2" strategy="afterInteractive" />
      <h2>Pagamento com Cartão (Mercado Pago)</h2>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8 }}>
        <input placeholder="Nome no cartão" onChange={(e) => (cardForm.current.cardholderName = e.target.value)} />
        <input placeholder="Número do cartão" onChange={(e) => (cardForm.current.number = e.target.value)} />
        <div style={{ display: "flex", gap: 8 }}>
          <input placeholder="MM" style={{ width: 80 }} onChange={(e) => (cardForm.current.exp_month = e.target.value)} />
          <input placeholder="YYYY" style={{ width: 100 }} onChange={(e) => (cardForm.current.exp_year = e.target.value)} />
          <input placeholder="CVC" style={{ width: 100 }} onChange={(e) => (cardForm.current.security_code = e.target.value)} />
        </div>

        <button type="submit" disabled={loading}>{loading ? "Processando..." : "Pagar com cartão"}</button>
      </form>

      {error && <pre style={{ color: "crimson" }}>{error}</pre>}
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
