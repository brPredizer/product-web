import React, { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
import { CreditCard, KeyRound, Landmark, Trash2 } from "lucide-react";
import { toast } from "sonner";

const onlyDigits = (value) => String(value || "").replace(/\D/g, "");

const formatCpf = (digits) => {
  const d = digits.slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

const formatCnpj = (digits) => {
  const d = digits.slice(0, 14);
  return d
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
};

const formatPhone = (digits, withCountry) => {
  const d = digits.slice(0, 11);
  const area = d.slice(0, 2);
  const number = d.slice(2);
  const mid = number.length > 8 ? number.slice(0, 5) : number.slice(0, 4);
  const end = number.length > 8 ? number.slice(5, 9) : number.slice(4, 8);
  if (!area) return d;
  const formatted = `(${area}) ${mid}${end ? `-${end}` : ""}`;
  return withCountry ? `+55 ${formatted}` : formatted;
};

const normalizePixKey = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return { type: "unknown", label: "Chave", display: "", value: "" };
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw)) {
    return { type: "random", label: "Aleatoria", display: raw.toLowerCase(), value: raw.toLowerCase() };
  }
  if (raw.includes("@")) {
    return { type: "email", label: "Email", display: raw.toLowerCase(), value: raw.toLowerCase() };
  }

  const digits = onlyDigits(raw);
  if (!digits) return { type: "unknown", label: "Chave", display: raw, value: raw };

  if (digits.length >= 12 && digits.startsWith("55")) {
    const phoneDigits = digits.slice(2);
    if (phoneDigits.length >= 10) {
      return {
        type: "phone",
        label: "Telefone",
        display: formatPhone(phoneDigits, true),
        value: digits
      };
    }
  }

  if (digits.length === 10) {
    return { type: "phone", label: "Telefone", display: formatPhone(digits, false), value: digits };
  }

  if (digits.length === 11) {
    if (digits[2] === "9") {
      return { type: "phone", label: "Telefone", display: formatPhone(digits, false), value: digits };
    }
    return { type: "cpf", label: "CPF", display: formatCpf(digits), value: digits };
  }

  if (digits.length === 14) {
    return { type: "cnpj", label: "CNPJ", display: formatCnpj(digits), value: digits };
  }

  return { type: "unknown", label: "Chave", display: digits, value: digits };
};

const formatExpiry = (value) => {
  const digits = onlyDigits(value).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

const detectBrand = (value) => {
  const digits = onlyDigits(value);
  if (!digits) return "";
  if (/^4\d{12,18}$/.test(digits)) return "VISA";
  if (
    /^(5[1-5]\d{14}|2(2[2-9]\d{12}|2[3-9]\d{13}|[3-6]\d{14}|7([01]\d{13}|20\d{12})))$/.test(
      digits
    )
  )
    return "MASTERCARD";
  if (/^3[47]\d{13}$/.test(digits)) return "AMEX";
  return "";
};

const parseExpiry = (value) => {
  const digits = onlyDigits(value);
  if (digits.length < 4) return null;
  const month = Number(digits.slice(0, 2));
  const year = Number(digits.slice(2, 4));
  if (!month || month > 12) return null;
  return { month, year: 2000 + year };
};

const fieldFocusClass =
  "focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none";

const SavedCardItem = ({ method, isOnlyOne, onRemove, loading }) => {
  const expYY = String(method.cardExpYear || "").slice(-2);
  const expMM = String(method.cardExpMonth || "").padStart(2, "0");
  const isDefault = Boolean(method.isDefault || isOnlyOne);

  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md">
      <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500/70" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{method.cardBrand || "Bandeira"}</Badge>
            {isDefault ? (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                Preferencial
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onRemove}
            disabled={loading}
            className="h-9 w-9 rounded-xl text-slate-400 transition hover:text-rose-600 focus-visible:outline-none"
            title="Remover cartao"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4">
          <div className="text-xs text-slate-500">Numero</div>
          <div className="mt-1 font-mono text-lg font-semibold tracking-widest text-slate-900">
            **** **** **** {method.cardLast4}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-slate-500">Validade</div>
            <div className="mt-1 text-sm font-medium text-slate-900">
              {expMM}/{expYY || "--"}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">Titular</div>
            <div className="mt-1 truncate text-sm font-medium text-slate-900">
              {method.cardHolderName || "-"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AccountPaymentsForm({
  paymentMethods,
  createPaymentMethod,
  removePaymentMethod,
  loading,
}) {
  const pixMethods = useMemo(
    () => (paymentMethods || []).filter((method) => method.type === "PIX"),
    [paymentMethods]
  );
  const bankMethods = useMemo(
    () => (paymentMethods || []).filter((method) => method.type === "BANK_ACCOUNT"),
    [paymentMethods]
  );
  const cardMethods = useMemo(
    () => (paymentMethods || []).filter((method) => method.type === "CARD"),
    [paymentMethods]
  );

  const [pixKey, setPixKey] = useState("");
  const [pixDefault, setPixDefault] = useState(false);
  const pixMeta = useMemo(() => normalizePixKey(pixKey), [pixKey]);

  const [bankAccount, setBankAccount] = useState({
    bankCode: "",
    bankName: "",
    agency: "",
    accountNumber: "",
    accountDigit: "",
    accountType: "",
  });
  const [bankDefault, setBankDefault] = useState(false);

  const [cardForm, setCardForm] = useState({
    holder: "",
    number: "",
    expiry: "",
    cvv: "",
  });
  const [cardDefault, setCardDefault] = useState(false);
  const cardBrand = useMemo(() => detectBrand(cardForm.number), [cardForm.number]);

  const addPix = async () => {
    const value = pixMeta.value.trim();
    if (!value) {
      toast.error("Informe a chave PIX");
      return;
    }
    await createPaymentMethod(
      { type: "PIX", pixKey: value, isDefault: pixDefault },
      "Chave PIX adicionada"
    );
    setPixKey("");
    setPixDefault(false);
  };

  const formatPixSaved = (pixKeyValue) => normalizePixKey(pixKeyValue || "");

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
    if (missing.length > 0) {
      toast.error("Preencha todos os dados bancarios");
      return;
    }

    await createPaymentMethod(payload, "Conta bancaria adicionada");
    setBankAccount({
      bankCode: "",
      bankName: "",
      agency: "",
      accountNumber: "",
      accountDigit: "",
      accountType: "",
    });
    setBankDefault(false);
  };

  const addCard = async () => {
    const digits = onlyDigits(cardForm.number);
    const cvvDigits = onlyDigits(cardForm.cvv);
    if (!cardForm.holder.trim() || digits.length < 13 || !cardForm.expiry.trim()) {
      toast.error("Preencha titular, numero e validade");
      return;
    }
    if (cvvDigits.length < 3) {
      toast.error("CVV invalido");
      return;
    }

    const exp = parseExpiry(cardForm.expiry);
    if (!exp) {
      toast.error("Validade invalida");
      return;
    }

    await createPaymentMethod(
      {
        type: "CARD",
        cardBrand: cardBrand || "UNKNOWN",
        cardLast4: digits.slice(-4),
        cardExpMonth: exp.month,
        cardExpYear: exp.year,
        cardHolderName: cardForm.holder.trim(),
        isDefault: cardDefault,
      },
      "Cartao adicionado"
    );

    setCardForm({ holder: "", number: "", expiry: "", cvv: "" });
    setCardDefault(false);
  };

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="w-4 h-4" />
            Chaves PIX
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-8">
                <label className="text-sm text-slate-700">Nova chave</label>
                <div className="relative mt-1">
                  <Input
                    value={pixMeta.display}
                    onChange={(e) => setPixKey(normalizePixKey(e.target.value).display)}
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
            <div className="sm:col-span-4 flex flex-col sm:flex-row gap-3 sm:justify-end sm:items-end">
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
                className={`bg-emerald-600 hover:bg-emerald-700 ${fieldFocusClass}`}
                onClick={addPix}
                disabled={loading}
              >
                Adicionar
              </Button>
            </div>
          </div>

          {pixMethods.length > 0 ? (
            <div className="space-y-2">
              {pixMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border px-3 py-2"
                >
                  <div>
                    <div className="text-sm text-slate-700 break-all">
                      {formatPixSaved(method.pixKey).display || method.pixKey}
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatPixSaved(method.pixKey).label}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(method.isDefault || pixMethods.length === 1) && (
                      <Badge variant="secondary">Preferencial</Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removePaymentMethod(method.id, "Chave PIX removida")}
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
            <p className="text-sm text-slate-500">Nenhuma chave PIX cadastrada.</p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="w-4 h-4" />
            Contas bancarias
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-3">
              <label className="text-sm text-slate-700">Codigo do banco</label>
              <Input
                value={bankAccount.bankCode}
                onChange={(e) => setBankAccount((p) => ({ ...p, bankCode: e.target.value }))}
                className={`mt-1 ${fieldFocusClass}`}
                placeholder="Ex: 001"
                inputMode="numeric"
              />
            </div>
            <div className="sm:col-span-9">
              <label className="text-sm text-slate-700">Nome do banco</label>
              <Input
                value={bankAccount.bankName}
                onChange={(e) => setBankAccount((p) => ({ ...p, bankName: e.target.value }))}
                className={`mt-1 ${fieldFocusClass}`}
                placeholder="Ex: Banco do Brasil"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="text-sm text-slate-700">Agencia</label>
              <Input
                value={bankAccount.agency}
                onChange={(e) => setBankAccount((p) => ({ ...p, agency: e.target.value }))}
                className={`mt-1 ${fieldFocusClass}`}
                placeholder="Ex: 1234"
                inputMode="numeric"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="text-sm text-slate-700">Conta</label>
              <Input
                value={bankAccount.accountNumber}
                onChange={(e) => setBankAccount((p) => ({ ...p, accountNumber: e.target.value }))}
                className={`mt-1 ${fieldFocusClass}`}
                placeholder="Ex: 123456"
                inputMode="numeric"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm text-slate-700">Digito</label>
              <Input
                value={bankAccount.accountDigit}
                onChange={(e) => setBankAccount((p) => ({ ...p, accountDigit: e.target.value }))}
                className={`mt-1 ${fieldFocusClass}`}
                placeholder="Ex: 7"
                inputMode="numeric"
              />
            </div>
            <div className="sm:col-span-4">
              <label className="text-sm text-slate-700">Tipo</label>
              <Select
                value={bankAccount.accountType}
                onValueChange={(value) =>
                  setBankAccount((p) => ({ ...p, accountType: value }))
                }
              >
                <SelectTrigger className={`mt-1 h-10 w-full min-w-[170px] ${fieldFocusClass}`}>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CHECKING">Conta corrente</SelectItem>
                  <SelectItem value="SAVINGS">Conta poupanca</SelectItem>
                  <SelectItem value="PAYMENT">Conta pagamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-12 flex flex-col sm:flex-row gap-3 sm:justify-end sm:items-end">
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
                className={`bg-emerald-600 hover:bg-emerald-700 ${fieldFocusClass}`}
                onClick={addBankAccount}
                disabled={loading}
              >
                Adicionar conta
              </Button>
            </div>
          </div>

          {bankMethods.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {bankMethods.map((method) => (
                <div key={method.id} className="rounded-xl border bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{method.bankCode || "-"}</Badge>
                        {(method.isDefault || bankMethods.length === 1) && (
                          <Badge variant="secondary">Preferencial</Badge>
                        )}
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {method.bankName || "Banco"} - {method.agency}/{method.accountNumber}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        Digito {method.accountDigit} - {method.accountType}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removePaymentMethod(method.id, "Conta bancaria removida")}
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
            <p className="text-sm text-slate-500">Nenhuma conta bancaria cadastrada.</p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Cartoes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-xl bg-slate-50/70 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="text-sm font-medium text-slate-900">Adicionar cartao</div>
              <Badge variant="secondary">{cardBrand || "Bandeira"}</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-5">
                <label className="text-sm text-slate-700">Titular</label>
                <Input
                  value={cardForm.holder}
                  onChange={(e) => setCardForm((p) => ({ ...p, holder: e.target.value }))}
                  className={`mt-1 ${fieldFocusClass}`}
                  placeholder="Nome no cartao"
                />
              </div>
              <div className="sm:col-span-7">
                <label className="text-sm text-slate-700">Numero</label>
                <Input
                  value={cardForm.number}
                  onChange={(e) => setCardForm((p) => ({ ...p, number: e.target.value }))}
                  inputMode="numeric"
                  className={`mt-1 ${fieldFocusClass}`}
                  placeholder="0000 0000 0000 0000"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="text-sm text-slate-700">Validade</label>
                <Input
                  value={cardForm.expiry}
                  onChange={(e) => setCardForm((p) => ({ ...p, expiry: formatExpiry(e.target.value) }))}
                  inputMode="numeric"
                  className={`mt-1 ${fieldFocusClass}`}
                  placeholder="MM/AA"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="text-sm text-slate-700">CVV</label>
                <Input
                  value={cardForm.cvv}
                  onChange={(e) =>
                    setCardForm((p) => ({ ...p, cvv: onlyDigits(e.target.value).slice(0, 4) }))
                  }
                  inputMode="numeric"
                  className={`mt-1 ${fieldFocusClass}`}
                  placeholder="123"
                />
              </div>
              <div className="sm:col-span-6 flex flex-col sm:flex-row gap-3 sm:justify-end sm:items-end">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={cardDefault}
                    onChange={(e) => setCardDefault(e.target.checked)}
                    className={fieldFocusClass}
                  />
                  Preferencial
                </label>
                <Button
                  className={`bg-emerald-600 hover:bg-emerald-700 ${fieldFocusClass}`}
                  onClick={addCard}
                  disabled={loading}
                >
                  Adicionar cartao
                </Button>
              </div>
            </div>
          </div>

          {cardMethods.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {cardMethods.map((method) => (
                <SavedCardItem
                  key={method.id}
                  method={method}
                  isOnlyOne={cardMethods.length === 1}
                  loading={loading}
                  onRemove={() => removePaymentMethod(method.id, "Cartao removido")}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Nenhum cartao cadastrado.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
