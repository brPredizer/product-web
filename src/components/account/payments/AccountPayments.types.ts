export type PixMeta = { type: string; label: string; display: string; value: string };

export type PaymentMethod = {
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

export type PaymentsSectionProps = {
  paymentMethods?: PaymentMethod[];
  createPaymentMethod: (payload: any, message?: string) => Promise<void>;
  removePaymentMethod: (id: string | number, message?: string) => Promise<void>;
  loading?: boolean;
};
