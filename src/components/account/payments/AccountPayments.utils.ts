import creditCardType from "credit-card-type";
import { PixMeta } from "./AccountPayments.types";

export const onlyDigits = (value: unknown) => String(value || "").replace(/\D/g, "");

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

export const formatDocument = (value: string) => {
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

export const normalizePixKey = (value: unknown): PixMeta => {
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

export const inferDocumentType = (digits: string) => (digits.length > 11 ? "CNPJ" : "CPF");

export const formatExpiry = (value: string) => {
  const digits = onlyDigits(value).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

export const formatCardNumber = (digits: string) => {
  const d = String(digits || "").replace(/\D/g, "").slice(0, 19);
  // group in 4s: 0000 0000 0000 0000 000 (support 19 digits just in case)
  return d.replace(/(.{4})/g, "$1 ").trim();
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

export const detectBrand = (value: string) => {
  const digits = onlyDigits(value);
  if (!digits) return "";
  try {
    const matches = creditCardType(digits);
    if (matches && matches.length > 0 && matches[0].type) return mapBrandLabel(matches[0].type);
  } catch {}
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

export const normalizePaymentMethodId = (value: string) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "";
  if (normalized === "mastercard") return "master";
  if (normalized === "american express") return "amex";
  return normalized;
};

export const parseExpiry = (value: string) => {
  const digits = onlyDigits(value);
  if (digits.length < 4) return null;
  const month = Number(digits.slice(0, 2));
  const year = Number(digits.slice(2, 4));
  if (!month || month > 12) return null;
  return { month, year: 2000 + year };
};

export const getMpDeviceId = () => {
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

export const ensureMercadoPagoInstance = async () => {
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
