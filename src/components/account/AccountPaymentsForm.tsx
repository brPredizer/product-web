import React, { ChangeEvent, FC, useEffect, useMemo, useState } from "react";
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
import {
  CreditCard,
  KeyRound,
  Landmark,
  Trash2,
  Plus,
  X,
  Info,
  Cpu,
} from "lucide-react";
import { toast } from "sonner";
import creditCardType from "credit-card-type";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

type PixMeta = { type: string; label: string; display: string; value: string };

type PaymentMethod = {
  id?: string | number;
  type?: string;
  pixKey?: string;
  isDefault?: boolean;

  bankCode?: string;
  bankName?: string;
  agency?: string;
  accountNumber?: string;
  accountDigit?: string;
  accountType?: string;

  cardBrand?: string;
  cardLast4?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  cardHolderName?: string;
  mpCustomerId?: string;
  mpCardId?: string;
  mpPaymentMethodId?: string;
};

interface AccountPaymentsFormProps {
  paymentMethods?: PaymentMethod[];
  createPaymentMethod: (payload: any, message?: string) => Promise<void>;
  removePaymentMethod: (id: string | number, message?: string) => Promise<void>;
  loading?: boolean;
}

const onlyDigits = (value: unknown) => String(value || "").replace(/\D/g, "");

const formatCpf = (digits: string) => {
  const d = digits.slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

const formatCnpj = (digits: string) => {
  const d = digits.slice(0, 14);
  return d
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
};

const formatDocument = (value: string) => {
  const digits = onlyDigits(value);
  if (!digits) return "";
  if (digits.length > 11) return formatCnpj(digits);
  return formatCpf(digits);
};

const formatPhone = (digits: string, withCountry?: boolean) => {
  const d = digits.slice(0, 11);
  const area = d.slice(0, 2);
  const number = d.slice(2);
  const mid = number.length > 8 ? number.slice(0, 5) : number.slice(0, 4);
  const end = number.length > 8 ? number.slice(5, 9) : number.slice(4, 8);
  if (!area) return d;
  const formatted = `(${area}) ${mid}${end ? `-${end}` : ""}`;
  return withCountry ? `+55 ${formatted}` : formatted;
};

const normalizePixKey = (value: unknown): PixMeta => {
  const raw = String(value || "").trim();
  if (!raw) return { type: "unknown", label: "Chave", display: "", value: "" };

  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      raw
    )
  ) {
    return {
      type: "random",
      label: "Aleatoria",
      display: raw.toLowerCase(),
      value: raw.toLowerCase(),
    };
  }
  if (raw.includes("@")) {
    return {
      type: "email",
      label: "Email",
      display: raw.toLowerCase(),
      value: raw.toLowerCase(),
    };
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
        value: digits,
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

const inferDocumentType = (digits: string) => (digits.length > 11 ? "CNPJ" : "CPF");

const formatExpiry = (value: string) => {
  const digits = onlyDigits(value).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

const formatCardNumber = (digits: string) => {
  const d = String(digits || '').replace(/\D/g, '').slice(0, 19);
  // group in 4s: 0000 0000 0000 0000 000 (support 19 digits just in case)
  return d.replace(/(.{4})/g, '$1 ').trim();
};

const mapBrandLabel = (type: string) => {
  switch (type) {
    case "visa":
      return "VISA";
    case "mastercard":
      return "MASTERCARD";
    case "american-express":
      return "AMEX";
    case "diners-club":
      return "DINERS";
    case "hipercard":
      return "HIPERCARD";
    case "elo":
      return "ELO";
    default:
      return type.toUpperCase();
  }
};

const detectBrand = (value: string) => {
  const digits = onlyDigits(value);
  if (!digits) return "";
  try {
    const matches = creditCardType(digits);
    if (matches && matches.length > 0 && matches[0].type) return mapBrandLabel(matches[0].type);
  } catch { }
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

const normalizePaymentMethodId = (value: string) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "";
  if (normalized === "mastercard") return "master";
  if (normalized === "american express") return "amex";
  return normalized;
};

const parseExpiry = (value: string) => {
  const digits = onlyDigits(value);
  if (digits.length < 4) return null;
  const month = Number(digits.slice(0, 2));
  const year = Number(digits.slice(2, 4));
  if (!month || month > 12) return null;
  return { month, year: 2000 + year };
};

const fieldFocusClass =
  "focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none";

const getMpDeviceId = () => {
  if (typeof window === "undefined") return "";
  return (window as any).MP_DEVICE_SESSION_ID || "";
};

const getMercadoPagoInstance = () => {
  if (typeof window === "undefined") return null;
  const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;
  const MercadoPago = (window as any).MercadoPago;
  if (!MercadoPago || !publicKey) return null;

  if (typeof MercadoPago === "function") {
    try {
      return new MercadoPago(publicKey, { locale: "pt-BR" });
    } catch {
      return MercadoPago(publicKey, { locale: "pt-BR" });
    }
  }
  return MercadoPago;
};

const ensureMercadoPagoInstance = async () => {
  const instance = getMercadoPagoInstance();
  if (instance) return instance;
  if (typeof window === "undefined") return null;

  const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;
  if (!publicKey) return null;

  if (!(window as any).MercadoPago) {
    const existing = document.querySelector('script[data-mp-sdk="true"]');
    if (!existing) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://sdk.mercadopago.com/js/v2";
        script.async = true;
        script.defer = true;
        script.setAttribute("data-mp-sdk", "true");
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("mp_sdk_load_failed"));
        document.head.appendChild(script);
      });
    }
  }

  return getMercadoPagoInstance();
};

const SectionHeader: FC<{ icon: React.ReactNode; title: string; subtitle: string }> = ({
  icon,
  title,
  subtitle,
}) => (
  <div className="flex items-start justify-between gap-4">
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
        {icon}
      </div>
      <div>
        <div className="text-base font-semibold text-slate-900">{title}</div>
        <div className="mt-0.5 text-sm text-slate-500">{subtitle}</div>
      </div>
    </div>
  </div>
);

const EmptyState: FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
  <div className="flex items-center justify-center">
    <div className="flex w-full items-center justify-center gap-3 rounded-xl border border-dashed bg-white px-4 py-3">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
        {icon}
      </div>
      <p className="text-sm text-slate-600">{text}</p>
    </div>
  </div>
);

/** helpers p/ deixar o card mais “premium” */
const format2 = (v?: string | number | null) => {
  if (v === null || v === undefined) return "--";
  const s = String(v).trim();
  if (!s) return "--";
  return s.padStart(2, "0").slice(-2);
};

const formatYY = (v?: string | number | null) => {
  if (v === null || v === undefined) return "--";
  const s = String(v).trim();
  if (!s) return "--";
  return s.length === 4 ? s.slice(-2) : s.padStart(2, "0").slice(-2);
};

const brandAccent = (brandLabel: string) => {
  const b = brandLabel.toLowerCase();
  if (b.includes("visa")) return "from-indigo-500/20 via-slate-50 to-slate-50";
  if (b.includes("master")) return "from-amber-500/20 via-slate-50 to-slate-50";
  if (b.includes("elo")) return "from-emerald-500/20 via-slate-50 to-slate-50";
  if (b.includes("amex")) return "from-cyan-500/20 via-slate-50 to-slate-50";
  return "from-emerald-500/18 via-slate-50 to-slate-50";
};

const SavedCardItem: FC<{
  method: PaymentMethod;
  isOnlyOne: boolean;
  onRemove: () => void;
  loading?: boolean;
}> = ({ method, isOnlyOne, onRemove, loading }) => {
  const expYY = formatYY(method.cardExpYear ?? null);
  const expMM = format2(method.cardExpMonth ?? null);
  const isDefault = Boolean(method.isDefault || isOnlyOne);

  const brandLabel = String(method.cardBrand || method.mpPaymentMethodId || "CARD").toUpperCase();
  const holder = String(method.cardHolderName || "-").toUpperCase();

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border shadow-sm",
        "hover:-translate-y-[1px] hover:shadow-md",
        "bg-gradient-to-br",
        brandAccent(brandLabel)
      )}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500/70" />

      <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(16,185,129,0.10),transparent_40%),radial-gradient(circle_at_90%_30%,rgba(2,132,199,0.08),transparent_35%)]" />

      <div className="relative p-4">
        {/* topo */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full bg-white/70">
              {brandLabel}
            </Badge>

            {isDefault ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50/80 px-2 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-500/10">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Preferencial
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onRemove}
            disabled={loading}
            className={cn(
              "absolute right-3 top-3 z-20", // dentro do card
              "grid h-9 w-9 place-items-center rounded-full", // bolinha
              "bg-white/70 text-slate-600 ring-1 ring-black/10 shadow-sm",
              "hover:bg-white hover:text-rose-600",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/30",
              loading && "opacity-60 pointer-events-none"
            )}
            title="Remover cartao"
            aria-label="Remover cartao"
          >
            <Trash2 className="h-4 w-4" />
          </button>

        </div>

        {/* conteúdo */}
        <div className="mt-3 text-left">
          {/* titular */}
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Titular</div>
          <div className="mt-0.5 truncate text-sm font-medium text-slate-900" title={holder}>
            {holder}
          </div>

          {/* número + validade (alinhados e compactos) */}
          <div className="mt-3">
            <div className="flex items-end justify-between gap-3">
              {/* Número */}
              <div className="min-w-0 flex-1">
                <div className="text-[11px] uppercase tracking-wide text-slate-500">Numero</div>

                <div className="mt-0.5 flex items-baseline gap-2">
                  {/* máscara + last4 na MESMA linha e baseline */}
                  <div className="font-mono text-[16px] font-semibold tracking-[0.16em] leading-none text-slate-900">
                    •••• •••• ••••
                  </div>
                  <div className="font-mono text-[16px] font-semibold tracking-[0.16em] leading-none text-slate-900">
                    {method.cardLast4 || "----"}
                  </div>
                </div>
              </div>

              {/* Validade */}
              <div className="shrink-0 text-right">
                <div className="text-[11px] uppercase tracking-wide text-slate-500">Validade</div>
                <div className="mt-0.5 font-mono text-[16px] font-semibold leading-none text-slate-900">
                  {expMM}/{expYY}
                </div>
              </div>
            </div>
          </div>


          {/* se quiser colocar mais infos depois, mantém aqui */}
        </div>
      </div>
    </div>
  );
};


const AccountPaymentsForm: FC<AccountPaymentsFormProps> = ({
  paymentMethods,
  createPaymentMethod,
  removePaymentMethod,
  loading = false,
}) => {
  const { user } = useAuth() as { user?: any };

  const pixMethods = useMemo(
    () => (paymentMethods || []).filter((method) => method.type === "PIX"),
    [paymentMethods]
  );
  const bankMethods = useMemo(
    () => (paymentMethods || []).filter((method) => method.type === "BANK_ACCOUNT"),
    [paymentMethods]
  );
  const cardMethods = useMemo(
    () =>
      (paymentMethods || []).filter((method) => {
        const type = String(method.type || "").toUpperCase();
        return type === "CARD" || Boolean(method.cardLast4 || method.mpCardId || method.mpPaymentMethodId);
      }),
    [paymentMethods]
  );

  const [pixKey, setPixKey] = useState<string>("");
  const [pixDefault, setPixDefault] = useState<boolean>(false);
  const pixMeta = useMemo<PixMeta>(() => normalizePixKey(pixKey), [pixKey]);

  const [bankAccount, setBankAccount] = useState({
    bankCode: "",
    bankName: "",
    agency: "",
    accountNumber: "",
    accountDigit: "",
    accountType: "",
  });
  const [bankDefault, setBankDefault] = useState(false);

  const [cardForm, setCardForm] = useState({ holder: "", number: "", expiry: "", cvv: "" });
  const [cardDefault, setCardDefault] = useState(false);
  const cardBrand = useMemo(() => detectBrand(cardForm.number), [cardForm.number]);
  const [payerDocument, setPayerDocument] = useState("");

  const [showCardForm, setShowCardForm] = useState(false);

  const addPix = async () => {
    const value = pixMeta.value.trim();
    if (!value) return toast.error("Informe a chave PIX");
    await createPaymentMethod({ type: "PIX", pixKey: value, isDefault: pixDefault }, "Chave PIX adicionada");
    setPixKey("");
    setPixDefault(false);
  };

  const formatPixSaved = (pixKeyValue?: string) => normalizePixKey(pixKeyValue || "");

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

    const missing = Object.entries(payload).filter(([key, value]) => key !== "isDefault" && !String(value || "").trim());
    if (missing.length > 0) return toast.error("Preencha todos os dados bancarios");

    await createPaymentMethod(payload, "Conta bancaria adicionada");
    setBankAccount({ bankCode: "", bankName: "", agency: "", accountNumber: "", accountDigit: "", accountType: "" });
    setBankDefault(false);
  };

  const addCard = async () => {
    const digits = onlyDigits(cardForm.number);
    const cvvDigits = onlyDigits(cardForm.cvv);
    const email = String(user?.email || "").trim();

    if (!cardForm.holder.trim() || digits.length < 13 || !cardForm.expiry.trim()) {
      return toast.error("Preencha titular, numero e validade");
    }
    if (!email) return toast.error("Seu perfil está sem email");
    if (cvvDigits.length < 3) return toast.error("CVV invalido");

    const exp = parseExpiry(cardForm.expiry);
    if (!exp) return toast.error("Validade invalida");

    const mp = await ensureMercadoPagoInstance();
    if (!mp || typeof (mp as any).createCardToken !== "function") {
      return toast.error("SDK do Mercado Pago nao carregado ou chave publica ausente");
    }

    const documentDigits = onlyDigits(payerDocument);
    const documentType = inferDocumentType(documentDigits);

    const expMonthTwoDigits = String(exp.month).padStart(2, "0");
    const expYearFull = String(exp.year);
    const bin = digits.slice(0, 6);

    let paymentMethodIdResolved = "";
    if (bin.length >= 6 && typeof (mp as any).getPaymentMethods === "function") {
      try {
        const pmResp = await (mp as any).getPaymentMethods({ bin });
        const results =
          (Array.isArray(pmResp?.results) && pmResp.results) ||
          (Array.isArray(pmResp?.data) && pmResp.data) ||
          (Array.isArray(pmResp) && pmResp) ||
          [];
        paymentMethodIdResolved = results?.[0]?.id || "";
      } catch { }
    }
    if (!paymentMethodIdResolved) paymentMethodIdResolved = normalizePaymentMethodId(cardBrand || "");
    if (!paymentMethodIdResolved) return toast.error("Nao foi possivel identificar a bandeira do cartao");

    const cardData: any = {
      cardNumber: digits,
      card_number: digits,
      paymentMethodId: paymentMethodIdResolved,
      payment_method_id: paymentMethodIdResolved,
      cardExpirationMonth: expMonthTwoDigits,
      card_expiration_month: expMonthTwoDigits,
      expiration_month: expMonthTwoDigits,
      cardExpirationYear: expYearFull,
      card_expiration_year: expYearFull,
      expiration_year: expYearFull,
      securityCode: cvvDigits,
      security_code: cvvDigits,
      cardholderName: cardForm.holder.trim(),
      cardholder: { name: cardForm.holder.trim() },
    };

    if (documentDigits) {
      cardData.cardholder.identification = { type: documentType, number: documentDigits };
      cardData.identificationType = documentType;
      cardData.identificationNumber = documentDigits;
    }

    let resp: any;
    try {
      resp = await (mp as any).createCardToken(cardData);
    } catch (error: any) {
      const message =
        error?.message ||
        error?.error?.message ||
        error?.cause?.[0]?.description ||
        error?.cause?.[0]?.code ||
        "Falha ao tokenizar cartao";
      console.error("Mercado Pago token error:", error);
      return toast.error(message);
    }

    const tokenId = resp?.id || resp?.card?.id || resp?.token;
    const paymentMethodId =
      resp?.payment_method_id ||
      resp?.paymentMethodId ||
      paymentMethodIdResolved ||
      normalizePaymentMethodId(cardBrand || "");
    const issuerId = resp?.issuer_id || resp?.issuerId || resp?.issuer?.id;

    if (!tokenId) {
      const message =
        resp?.message ||
        resp?.error?.message ||
        resp?.cause?.[0]?.description ||
        resp?.cause?.[0]?.code ||
        "Falha ao tokenizar cartao";
      console.error("Mercado Pago token response:", resp);
      return toast.error(message);
    }

    const deviceId = getMpDeviceId();
      const payload: any = {
        type: "CARD",
        token: tokenId,
        deviceId,
        isDefault: cardDefault,
        cardBrand: cardBrand || paymentMethodIdResolved || "",
        paymentMethodId,
        issuerId,
        cardHolderName: cardForm.holder.trim(),
        holderIdentification: documentDigits
          ? { type: documentType, number: documentDigits }
          : undefined,
        payer: { email },
      };

    await createPaymentMethod(payload, "Cartao salvo");

    setCardForm({ holder: "", number: "", expiry: "", cvv: "" });
    setCardDefault(false);
    setPayerDocument("");
    setShowCardForm(false);
  };

  return (
    <div className="space-y-6">
      {/* PIX */}
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
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setPixKey(normalizePixKey(e.target.value).display)}
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

      {/* BANK */}
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
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setBankAccount((p) => ({ ...p, bankCode: e.target.value }))}
                  className={`mt-1 ${fieldFocusClass}`}
                  placeholder="Ex: 001"
                  inputMode="numeric"
                />
              </div>
              <div className="sm:col-span-9">
                <label className="text-sm text-slate-700">Nome do banco</label>
                <Input
                  value={bankAccount.bankName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setBankAccount((p) => ({ ...p, bankName: e.target.value }))}
                  className={`mt-1 ${fieldFocusClass}`}
                  placeholder="Ex: Banco do Brasil"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="text-sm text-slate-700">Agencia</label>
                <Input
                  value={bankAccount.agency}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setBankAccount((p) => ({ ...p, agency: e.target.value }))}
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
                <Select value={bankAccount.accountType} onValueChange={(value) => setBankAccount((p) => ({ ...p, accountType: value }))}>
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
                  <input type="checkbox" checked={bankDefault} onChange={(e) => setBankDefault(e.target.checked)} className={fieldFocusClass} />
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

      {/* CARDS */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <SectionHeader icon={<CreditCard className="h-4 w-4" />} title="Cartoes" subtitle="Salve um cartao para compras futuras." />
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="rounded-2xl border bg-slate-50/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center">
                <div className="text-sm font-semibold text-slate-900">Adicionar Cartão</div>
              </div>

              <Button
                type="button"
                variant={showCardForm ? "outline" : "default"}
                onClick={() => setShowCardForm((s) => !s)}
                className={`rounded-lg ${showCardForm
                  ? "h-9 w-9 p-0 flex items-center justify-center bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white"
                  : "h-9 bg-emerald-600 hover:bg-emerald-700"
                  } ${fieldFocusClass}`}
                aria-label={showCardForm ? "X" : "Novo"}
                title={showCardForm ? "X" : "Novo"}
              >
                {showCardForm ? (
                  <X className="h-4 w-4" />
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo
                  </>
                )}
              </Button>
            </div>

            {showCardForm ? (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-12">
                <div className="sm:col-span-5">
                  <label className="text-sm text-slate-700">Titular</label>
                  <Input
                    value={cardForm.holder}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      const raw = String(e.target.value || "");
                      // Remove diacritics (accents) using NFD normalization
                      const withoutAccents = raw.normalize ? raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : raw;
                      // Keep only letters A-Z and spaces, remove numbers and special chars
                      const lettersOnly = withoutAccents.replace(/[^A-Za-z ]+/g, '');
                      // Collapse multiple spaces and trim ends
                      const cleaned = lettersOnly.replace(/\s+/g, ' ').trimStart();
                      const upper = cleaned.toUpperCase();
                      setCardForm((p) => ({ ...p, holder: upper }));
                    }}
                    inputMode="text"
                    className={`mt-1 ${fieldFocusClass} uppercase`}
                    placeholder="Nome no cartao"
                  />
                </div>

                {/* EMAIL escondido: vem do perfil (user.email) */}
                <div className="sm:col-span-7">
                  <label className="text-sm text-slate-700">CPF/CNPJ do pagador</label>
                  <Input
                    value={payerDocument}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setPayerDocument(formatDocument(e.target.value))}
                    inputMode="numeric"
                    className={`mt-1 ${fieldFocusClass}`}
                    placeholder="CPF ou CNPJ"
                  />
                </div>

                {/* Número + Validade lado a lado */}
                <div className="sm:col-span-7">
                  <label className="text-sm text-slate-700">Numero</label>
                  <Input
                    value={formatCardNumber(String(cardForm.number || ''))}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      // keep only digits in state, but show formatted value with spaces
                      const digits = String(e.target.value || '').replace(/\D/g, '').slice(0, 19);
                      setCardForm((p) => ({ ...p, number: digits }));
                    }}
                    inputMode="numeric"
                    className={`mt-1 ${fieldFocusClass}`}
                    placeholder="0000 0000 0000 0000"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm text-slate-700">Validade</label>
                  <Input
                    value={cardForm.expiry}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setCardForm((p) => ({ ...p, expiry: formatExpiry(e.target.value) }))}
                    inputMode="numeric"
                    className={`mt-1 ${fieldFocusClass}`}
                    placeholder="MM/AA"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-sm text-slate-700">CVV</label>
                  <Input
                    value={cardForm.cvv}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setCardForm((p) => ({ ...p, cvv: onlyDigits(e.target.value).slice(0, 4) }))}
                    inputMode="numeric"
                    className={`mt-1 ${fieldFocusClass}`}
                    placeholder="123"
                  />
                </div>

                <div className="sm:col-span-12 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
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
                    type="button"
                    className={`w-full bg-emerald-600 hover:bg-emerald-700 sm:w-auto ${fieldFocusClass}`}
                    onClick={(e) => {
                      e.preventDefault();
                      addCard();
                    }}
                    disabled={loading || !String(user?.email || "").trim()}
                  >
                    Adicionar cartao
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          {cardMethods.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {cardMethods.map((method) => (
                <SavedCardItem
                  key={method.id}
                  method={method}
                  isOnlyOne={cardMethods.length === 1}
                  loading={loading}
                  onRemove={() => removePaymentMethod(method.id || "", "Cartao removido")}
                />
              ))}
            </div>
          ) : (
            <EmptyState icon={<CreditCard className="h-4 w-4" />} text="Nenhum cartao cadastrado." />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountPaymentsForm;
