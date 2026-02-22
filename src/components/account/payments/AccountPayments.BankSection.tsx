import React, { ChangeEvent, useMemo, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Landmark } from "lucide-react";
import { toast } from "sonner";
import { PaymentsSectionProps } from "./AccountPayments.types";
import { EmptyState, SectionHeader, fieldFocusClass } from "./AccountPayments.ui";

const BankSection = ({
  paymentMethods,
  createPaymentMethod,
  removePaymentMethod,
  loading = false,
}: PaymentsSectionProps) => {
  const bankMethods = useMemo(
    () => (paymentMethods || []).filter((method) => method.type === "BANK_ACCOUNT"),
    [paymentMethods]
  );

  const [bankAccount, setBankAccount] = useState({
    bankCode: "",
    bankName: "",
    agency: "",
    accountNumber: "",
    accountDigit: "",
    accountType: "",
  });
  const [bankDefault, setBankDefault] = useState(false);

  const addBankAccount = async () => {
    const payload = {
      type: "BANK_ACCOUNT",
      bankCode: bankAccount.bankCode.trim(),
      bankName: bankAccount.bankName.trim(),
      agency: bankAccount.agency.trim(),
      accountNumber: bankAccount.accountNumber.trim(),
      accountDigit: bankAccount.accountDigit.trim(),
      accountType: bankAccount.accountType,
      isDefault: bankDefault,
    };

    const missing = Object.entries(payload).filter(
      ([key, value]) => key !== "isDefault" && !String(value || "").trim()
    );
    if (missing.length > 0) return toast.error("Preencha todos os dados bancarios");

    await createPaymentMethod(payload, "Conta bancaria adicionada");
    setBankAccount({ bankCode: "", bankName: "", agency: "", accountNumber: "", accountDigit: "", accountType: "" });
    setBankDefault(false);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <SectionHeader
          icon={<Landmark className="h-4 w-4" />}
          title="Contas bancarias"
          subtitle="Use para saques e preferencia de recebimento."
        />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border bg-slate-50/70 p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
            <div className="sm:col-span-3">
              <label className="text-sm text-slate-700">Codigo do banco</label>
              <Input
                value={bankAccount.bankCode}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setBankAccount((p) => ({ ...p, bankCode: e.target.value }))
                }
                className={`mt-1 ${fieldFocusClass}`}
                placeholder="Ex: 001"
                inputMode="numeric"
              />
            </div>
            <div className="sm:col-span-9">
              <label className="text-sm text-slate-700">Nome do banco</label>
              <Input
                value={bankAccount.bankName}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setBankAccount((p) => ({ ...p, bankName: e.target.value }))
                }
                className={`mt-1 ${fieldFocusClass}`}
                placeholder="Ex: Banco do Brasil"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="text-sm text-slate-700">Agencia</label>
              <Input
                value={bankAccount.agency}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setBankAccount((p) => ({ ...p, agency: e.target.value }))
                }
                className={`mt-1 ${fieldFocusClass}`}
                placeholder="Ex: 1234"
                inputMode="numeric"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="text-sm text-slate-700">Conta</label>
              <Input
                value={bankAccount.accountNumber}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setBankAccount((p) => ({ ...p, accountNumber: e.target.value }))
                }
                className={`mt-1 ${fieldFocusClass}`}
                placeholder="Ex: 123456"
                inputMode="numeric"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm text-slate-700">Digito</label>
              <Input
                value={bankAccount.accountDigit}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setBankAccount((p) => ({ ...p, accountDigit: e.target.value }))
                }
                className={`mt-1 ${fieldFocusClass}`}
                placeholder="Ex: 7"
                inputMode="numeric"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="text-sm text-slate-700">Tipo</label>
              <Select
                value={bankAccount.accountType}
                onValueChange={(value) => setBankAccount((p) => ({ ...p, accountType: value }))}
              >
                <SelectTrigger className={`mt-1 h-10 w-full ${fieldFocusClass}`}>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CHECKING">Conta corrente</SelectItem>
                  <SelectItem value="SAVINGS">Conta poupanca</SelectItem>
                  <SelectItem value="PAYMENT">Conta pagamento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-12 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={bankDefault}
                  onChange={(e) => setBankDefault(e.target.checked)}
                  className={fieldFocusClass}
                />
                Preferencial
              </label>
              <Button
                type="button"
                className={`w-full bg-emerald-600 hover:bg-emerald-700 sm:w-auto ${fieldFocusClass}`}
                onClick={(e) => {
                  e.preventDefault();
                  addBankAccount();
                }}
                disabled={loading}
              >
                Adicionar conta
              </Button>
            </div>
          </div>
        </div>

        {bankMethods.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {bankMethods.map((method) => (
              <div key={method.id} className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{method.bankCode || "-"}</Badge>
                      {(method.isDefault || bankMethods.length === 1) && <Badge variant="secondary">Preferencial</Badge>}
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {method.bankName || "Banco"} • {method.agency}/{method.accountNumber}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      Digito {method.accountDigit} • {method.accountType}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removePaymentMethod(method.id || "", "Conta bancaria removida")}
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
          <EmptyState icon={<Landmark className="h-4 w-4" />} text="Nenhuma conta bancaria cadastrada." />
        )}
      </CardContent>
    </Card>
  );
};

export default BankSection;
