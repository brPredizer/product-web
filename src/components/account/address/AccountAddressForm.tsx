import React, { ChangeEvent, FC, MutableRefObject } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Address {
  zip: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  complement?: string;
  city?: string;
  state?: string;
}

interface AccountAddressFormProps {
  address: Address;
  setAddress: (updater: (prev: Address) => Address) => void;
  formatCep: (value: string) => string;
  onlyDigits: (value: unknown) => string;
  lookupCep: (digits: string) => void;
  saveAddress: () => void;
  loading?: boolean;
  cepDebounceRef: MutableRefObject<number | null>;
}

const AccountAddressForm: FC<AccountAddressFormProps> = ({
  address,
  setAddress,
  formatCep,
  onlyDigits,
  lookupCep,
  saveAddress,
  loading,
  cepDebounceRef,
}) => {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Endereço</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-700">CEP</label>
            <Input
              value={address.zip}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const formatted = formatCep(e.target.value);
                setAddress((p) => ({ ...p, zip: formatted }));
                const digits = onlyDigits(formatted);
                if (digits.length === 8) {
                  if (cepDebounceRef.current) window.clearTimeout(cepDebounceRef.current);
                  // setTimeout returns number in browser environment
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  cepDebounceRef.current = window.setTimeout(() => lookupCep(digits), 450);
                }
              }}
              onBlur={() => {
                const digits = onlyDigits(address.zip);
                if (digits.length === 8) lookupCep(digits);
              }}
              inputMode="numeric"
              placeholder="00000-000"
              className="mt-1"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-700">Rua</label>
            <Input value={address.street} onChange={(e: ChangeEvent<HTMLInputElement>) => setAddress((p) => ({ ...p, street: e.target.value }))} className="mt-1" placeholder="Rua / Avenida" />
          </div>
          <div>
            <label className="text-sm text-slate-700">Número</label>
            <Input value={address.number} onChange={(e: ChangeEvent<HTMLInputElement>) => setAddress((p) => ({ ...p, number: e.target.value }))} className="mt-1" placeholder="Numero" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-700">Bairro</label>
            <Input value={address.neighborhood} onChange={(e: ChangeEvent<HTMLInputElement>) => setAddress((p) => ({ ...p, neighborhood: e.target.value }))} className="mt-1" placeholder="Bairro" />
          </div>
          <div>
            <label className="text-sm text-slate-700">Complemento</label>
            <Input value={address.complement} onChange={(e: ChangeEvent<HTMLInputElement>) => setAddress((p) => ({ ...p, complement: e.target.value }))} className="mt-1" placeholder="Apto, bloco, sala..." />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="text-sm text-slate-700">Cidade</label>
            <Input value={address.city} onChange={(e: ChangeEvent<HTMLInputElement>) => setAddress((p) => ({ ...p, city: e.target.value }))} className="mt-1" />
          </div>
          <div>
            <label className="text-sm text-slate-700">Estado (UF)</label>
            <Input value={address.state} onChange={(e: ChangeEvent<HTMLInputElement>) => setAddress((p) => ({ ...p, state: e.target.value.toUpperCase().slice(0, 2) }))} className="mt-1" placeholder="SP" />
          </div>
        </div>
        <div className="flex justify-end">
          <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={loading} onClick={saveAddress}>
            Salvar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountAddressForm;
