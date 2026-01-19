"use client";

import React, { useState } from "react";

export default function BoletoCheckoutPage() {
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function gerarBoleto() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE }/api/payments/mercadopago/boleto`, {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 29.9, description: "Boleto - Teste", orderId: `ORDER_${Date.now()}`, buyerEmail: "buyer@test.com" }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResp(data);
    } catch (e: any) {
      setError(e?.message ?? "Erro ao gerar boleto");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 520 }}>
      <h2>Boleto (Mercado Pago)</h2>
      <button onClick={gerarBoleto} disabled={loading}>{loading ? "Gerando..." : "Gerar Boleto"}</button>
      {error && <pre style={{ color: "crimson" }}>{error}</pre>}
      {resp && (
        <div>
          <pre>{JSON.stringify(resp, null, 2)}</pre>
          {resp?.pdf && (
            <div>
              <a href={resp.pdf} target="_blank" rel="noreferrer">Abrir PDF do boleto</a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
