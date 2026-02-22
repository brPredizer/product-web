import React, { FC } from "react";
import PixSection from "./AccountPayments.PixSection";
import BankSection from "./AccountPayments.BankSection";
import CardSection from "./AccountPayments.CardSection";
import { PaymentMethod } from "./AccountPayments.types";

interface AccountPaymentsFormProps {
  paymentMethods?: PaymentMethod[];
  createPaymentMethod: (payload: any, message?: string) => Promise<void>;
  removePaymentMethod: (id: string | number, message?: string) => Promise<void>;
  loading?: boolean;
}

const AccountPaymentsForm: FC<AccountPaymentsFormProps> = (props) => {
  return (
    <div className="space-y-6">
      <PixSection {...props} />
      <BankSection {...props} />
      <CardSection {...props} />
    </div>
  );
};

export default AccountPaymentsForm;
