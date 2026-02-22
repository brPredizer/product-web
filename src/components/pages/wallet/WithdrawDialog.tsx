import React, { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { clampMoneyInput, formatCurrencyValue, toNumberSafe, WITHDRAWAL_FEE } from "./helpers";
import { walletClient } from "@/app/api/wallet";

interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  refreshUser?: () => void;
  userId?: string;
}

function WithdrawDialog({ open, onOpenChange, refreshUser, userId }: WithdrawDialogProps) {
  const queryClient = useQueryClient();
  const [withdrawAmountStr, setWithdrawAmountStr] = useState("");

  const withdrawAmount = useMemo(() => toNumberSafe(withdrawAmountStr), [withdrawAmountStr]);
  const withdrawFee = useMemo(() => withdrawAmount * WITHDRAWAL_FEE, [withdrawAmount]);
  const withdrawNet = useMemo(
    () => Math.max(0, withdrawAmount - withdrawFee),
    [withdrawAmount, withdrawFee]
  );

  const withdrawMutation = useMutation({
    mutationFn: async (amount: number) => {
      await (walletClient as any).createWithdrawal?.({ amount });
    },
    onSuccess: () => {
      toast.success("Saque solicitado! Aguarde aprovação do administrador.");
      queryClient.invalidateQueries({ queryKey: ["wallet-balances", userId] });
      queryClient.invalidateQueries({ queryKey: ["wallet-summary", userId] });
      queryClient.invalidateQueries({ queryKey: ["wallet-ledger", userId] });
      queryClient.invalidateQueries({ queryKey: ["wallet-receipts", userId] });
      refreshUser?.();
      onOpenChange(false);
      setWithdrawAmountStr("");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Falha ao solicitar saque.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Saque</DialogTitle>
          <DialogDescription>Informe o valor do saque.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            value={withdrawAmountStr}
            onChange={(e) => setWithdrawAmountStr(clampMoneyInput(e.target.value))}
            placeholder="Ex: 100.00"
          />
          <p className="text-xs text-slate-500">
            Taxa: {formatCurrencyValue(withdrawFee, "BRL")} • Líquido: {formatCurrencyValue(withdrawNet, "BRL")}
          </p>

          <Button
            className="w-full"
            disabled={withdrawMutation.isPending}
            onClick={() => withdrawMutation.mutate(withdrawAmount)}
          >
            {withdrawMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Solicitando...
              </>
            ) : (
              "Solicitar saque"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default WithdrawDialog;

