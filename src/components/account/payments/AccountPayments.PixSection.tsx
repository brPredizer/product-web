import React, { ChangeEvent, useMemo, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { PaymentsSectionProps } from "./AccountPayments.types";
import { normalizePixKey } from "./AccountPayments.utils";
import { EmptyState, SectionHeader, fieldFocusClass } from "./AccountPayments.ui";

const PixSection = ({
  paymentMethods,
  createPaymentMethod,
  removePaymentMethod,
  loading = false,
}: PaymentsSectionProps) => {
  const pixMethods = useMemo(
    () => (paymentMethods || []).filter((method) => method.type === "PIX"),
    [paymentMethods]
  );

  const [pixKey, setPixKey] = useState("");
  const [pixDefault, setPixDefault] = useState(false);
  const pixMeta = useMemo(() => normalizePixKey(pixKey), [pixKey]);

  const addPix = async () => {
    const value = pixMeta.value.trim();
    if (!value) return toast.error("Informe a chave PIX");
    await createPaymentMethod({ type: "PIX", pixKey: value, isDefault: pixDefault }, "Chave PIX adicionada");
    setPixKey("");
    setPixDefault(false);
  };

  const formatPixSaved = (pixKeyValue?: string) => normalizePixKey(pixKeyValue || "");

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <SectionHeader
          icon={<KeyRound className="h-4 w-4" />}
          title="Chaves PIX"
          subtitle="Cadastre uma chave para recebimentos e saques."
        />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border bg-slate-50/70 p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
            <div className="sm:col-span-8">
              <label className="text-sm text-slate-700">Nova chave</label>
              <div className="relative mt-1">
                <Input
                  value={pixMeta.display}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setPixKey(normalizePixKey(e.target.value).display)
                  }
                  className={`${pixMeta.label !== "Chave" && pixMeta.display ? "pr-24 " : ""}${fieldFocusClass}`}
                  placeholder="email, telefone, CPF/CNPJ ou chave aleatoria"
                />
                {pixMeta.label !== "Chave" && pixMeta.display ? (
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                    {pixMeta.label}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="sm:col-span-4 flex gap-3 sm:items-end sm:justify-end">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={pixDefault}
                  onChange={(e) => setPixDefault(e.target.checked)}
                  className={fieldFocusClass}
                />
                Preferencial
              </label>
              <Button
                type="button"
                className={`w-full bg-emerald-600 hover:bg-emerald-700 sm:w-auto ${fieldFocusClass}`}
                onClick={(e) => {
                  e.preventDefault();
                  addPix();
                }}
                disabled={loading}
              >
                Adicionar
              </Button>
            </div>
          </div>
        </div>

        {pixMethods.length > 0 ? (
          <div className="space-y-2">
            {pixMethods.map((method) => (
              <div
                key={method.id}
                className="flex flex-col gap-3 rounded-xl border bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="break-all text-sm font-medium text-slate-800">
                    {formatPixSaved(method.pixKey).display || method.pixKey}
                  </div>
                  <div className="text-xs text-slate-500">{formatPixSaved(method.pixKey).label}</div>
                </div>
                <div className="flex items-center gap-2">
                  {(method.isDefault || pixMethods.length === 1) && <Badge variant="secondary">Preferencial</Badge>}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removePaymentMethod(method.id || "", "Chave PIX removida")}
                    disabled={loading}
                    className={fieldFocusClass}
                  >
                    Remover
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={<KeyRound className="h-4 w-4" />} text="Nenhuma chave PIX cadastrada." />
        )}
      </CardContent>
    </Card>
  );
};

export default PixSection;
