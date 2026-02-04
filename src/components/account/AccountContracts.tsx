import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { riskTermsClient, type RiskAcceptance } from "@/app/api/terms/riskTermsClient";
import { DownloadCloud, FileText, Loader2, RefreshCcw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

type Props = {
  userId?: string | number;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleString("pt-BR");
};

const maskHash = (hash?: string | null) => {
  if (!hash) return null;
  if (hash.length <= 12) return hash;
  return `${hash.slice(0, 8)}…${hash.slice(-4)}`;
};

export default function AccountContracts({ userId }: Props) {
  const [items, setItems] = useState<RiskAcceptance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response: any = await riskTermsClient.getAcceptance();
      if (Array.isArray(response)) {
        setItems(response.filter(Boolean));
      } else if (response) {
        setItems([response]);
      } else {
        setItems([]);
      }
    } catch (err: any) {
      setError(err?.message || "Falha ao carregar contratos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleDownload = async (item: RiskAcceptance) => {
    const downloadKey = item.id || item.marketId || "default";
    setDownloadingId(downloadKey);
    try {
      const { blob, filename } = await riskTermsClient.downloadAcceptance({
        marketId: item.marketId ?? undefined,
        acceptedAt: item.acceptedAt ?? undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || "termo-risco.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      if (err?.status === 404) {
        toast.error("Nenhum comprovante disponível para este contrato.");
      } else {
        toast.error(err?.message || "Não foi possível baixar o comprovante.");
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const emptyState = (
    <div className="border border-dashed border-slate-200 rounded-xl p-6 text-center bg-slate-50">
      <p className="text-sm text-slate-600">
        Você ainda não possui nenhum termo aceito.
      </p>
      <p className="text-xs text-slate-500 mt-1">
        Os comprovantes dos contratos aparecerão aqui após o aceite.
      </p>
      <div className="mt-3 flex justify-center">
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCcw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>
    </div>
  );

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-700" />
          Contratos e Termos
        </CardTitle>
        <p className="text-sm text-slate-500">
          Consulte os termos que você já aceitou e baixe os comprovantes em PDF.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((item) => (
              <div key={item} className="animate-pulse border rounded-xl p-4 bg-slate-50">
                <div className="h-4 bg-slate-200 rounded w-48 mb-2" />
                <div className="h-3 bg-slate-200 rounded w-36 mb-1" />
                <div className="h-3 bg-slate-100 rounded w-60" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="border border-amber-200 bg-amber-50 text-amber-800 rounded-xl p-4 space-y-2">
            <p className="text-sm font-medium">Não foi possível carregar os contratos.</p>
            <p className="text-xs">{error}</p>
            <Button variant="outline" size="sm" onClick={load}>
              <RefreshCcw className="w-4 h-4 mr-2" />
              Tentar novamente
            </Button>
          </div>
        ) : items.length === 0 ? (
          emptyState
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const dateLabel = formatDateTime(item.acceptedAt);
              const hashLabel = maskHash(item.termHash);
              const downloadKey = item.id || item.marketId || "default";
              return (
                <div
                  key={downloadKey}
                  className="border rounded-xl p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-900 font-semibold">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Termo de Risco
                    </div>
                    <div className="text-sm text-slate-600">
                      {dateLabel ? `Aceito em ${dateLabel}` : "Data de aceite indisponível"}
                    </div>
                    {hashLabel && (
                      <div className="text-xs text-slate-500">
                        Hash de integridade: {hashLabel}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(item)}
                      disabled={downloadingId === downloadKey}
                    >
                      {downloadingId === downloadKey ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <DownloadCloud className="w-4 h-4 mr-2" />
                      )}
                      Baixar PDF
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
