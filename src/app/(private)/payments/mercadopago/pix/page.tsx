"use client";

import React, { useState } from "react";

type PixResp = {
  paymentId?: number | string;
  qrCodeBase64?: string;
  qrCode?: string;
  expiresAt?: string;
  status?: string;
  orderId?: string;
};

export default function PixCheckoutPage() {
  const [loading, setLoading] = useState(false);
  const [pix, setPix] = useState<PixResp | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function gerarPix() {
    setLoading(true);
    setError(null);
    setPix(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/payments/mercadopago/pix`, {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 29.9,
          description: "Plano - Mensal",
          orderId: `ORDER_${Date.now()}`,
          buyerEmail: "buyer@test.com",
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as PixResp;
      setPix(data);
    } catch (e: any) {
      setError(e?.message ?? "Erro ao gerar Pix");
    } finally {
      setLoading(false);
    }
  }

  async function copiar() {
    if (!pix?.qrCode) return;
    await navigator.clipboard.writeText(pix.qrCode);
  }

  async function checkOrder() {
    if (!pix?.orderId) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/orders/${pix.orderId}`, { credentials: 'include' });
      const data = await res.json();
      setPix((p) => ({ ...(p || {}), status: data?.status || p?.status }));
    } catch (e) {
      // ignore
    }
  }

  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 520 }}>
      <h2>Pagamento via Pix (Mercado Pago)</h2>
      <button onClick={gerarPix} disabled={loading}>{loading ? "Gerando..." : "Gerar Pix"}</button>
      {error && <pre style={{ color: "crimson" }}>{error}</pre>}

      {pix?.qrCodeBase64 && (
        <div>
          <img alt="QR Code Pix" src={`data:image/png;base64,${pix.qrCodeBase64}`} style={{ width: 280, height: 280 }} />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={copiar}>Copiar código Pix</button>
            <button onClick={checkOrder}>Verificar pedido</button>
          </div>
          {pix.expiresAt && <div>Expira em: {new Date(pix.expiresAt).toLocaleString()}</div>}
          <div>Status: {pix.status}</div>
          <div>orderId: {pix.orderId}</div>
        </div>
      )}
    </div>
  );
}
