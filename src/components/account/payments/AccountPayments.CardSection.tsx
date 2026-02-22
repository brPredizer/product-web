import React, { ChangeEvent, useMemo, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CreditCard, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { PaymentsSectionProps } from "./AccountPayments.types";
import {
  detectBrand,
  ensureMercadoPagoInstance,
  formatCardNumber,
  formatDocument,
  formatExpiry,
  getMpDeviceId,
  inferDocumentType,
  normalizePaymentMethodId,
  onlyDigits,
  parseExpiry,
} from "./AccountPayments.utils";
import { EmptyState, SavedCardItem, SectionHeader, fieldFocusClass } from "./AccountPayments.ui";

const CardSection = ({
  paymentMethods,
  createPaymentMethod,
  removePaymentMethod,
  loading = false,
}: PaymentsSectionProps) => {
  const { user } = useAuth() as { user?: any };

  const cardMethods = useMemo(
    () =>
      (paymentMethods || []).filter((method) => {
        const type = String(method.type || "").toUpperCase();
        return type === "CARD" || Boolean(method.cardLast4 || method.mpCardId || method.mpPaymentMethodId);
      }),
    [paymentMethods]
  );

  const [cardForm, setCardForm] = useState({ holder: "", number: "", expiry: "", cvv: "" });
  const [cardDefault, setCardDefault] = useState(false);
  const cardBrand = useMemo(() => detectBrand(cardForm.number), [cardForm.number]);
  const [payerDocument, setPayerDocument] = useState("");

  const [showCardForm, setShowCardForm] = useState(false);

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
      return toast.error("SDK do Mercado Pago nÃo carregado ou chave publica ausente");
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
      } catch {}
    }
    if (!paymentMethodIdResolved) paymentMethodIdResolved = normalizePaymentMethodId(cardBrand || "");
    if (!paymentMethodIdResolved) return toast.error("Não foi possivel identificar a bandeira do cartao");

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
                    const withoutAccents = raw.normalize
                      ? raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                      : raw;
                    // Keep only letters A-Z and spaces, remove numbers and special chars
                    const lettersOnly = withoutAccents.replace(/[^A-Za-z ]+/g, "");
                    // Collapse multiple spaces and trim ends
                    const cleaned = lettersOnly.replace(/\s+/g, " ").trimStart();
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
                  value={formatCardNumber(String(cardForm.number || ""))}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    // keep only digits in state, but show formatted value with spaces
                    const digits = String(e.target.value || "").replace(/\D/g, "").slice(0, 19);
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
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setCardForm((p) => ({ ...p, expiry: formatExpiry(e.target.value) }))
                  }
                  inputMode="numeric"
                  className={`mt-1 ${fieldFocusClass}`}
                  placeholder="MM/AA"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="text-sm text-slate-700">CVV</label>
                <Input
                  value={cardForm.cvv}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setCardForm((p) => ({ ...p, cvv: onlyDigits(e.target.value).slice(0, 4) }))
                  }
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
  );
};

export default CardSection;
