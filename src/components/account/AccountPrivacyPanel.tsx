import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import AccountContracts from "./AccountContracts";
import { Bell, Mail, Smartphone } from "lucide-react";

type Props = {
  userId?: string | number;
};

export default function AccountPrivacyPanel({ userId }: Props) {
  const [prefs, setPrefs] = useState({
    email: true,
    sms: false,
    push: true,
  });
  const [saving, setSaving] = useState(false);

  const updatePref =
    (key: keyof typeof prefs) =>
    (checked: boolean) =>
      setPrefs((prev) => ({ ...prev, [key]: checked }));

  const handleSave = async () => {
    setSaving(true);
    // TODO: wire to backend when available
    setTimeout(() => {
      toast.success("Preferências salvas (sessão local).");
      setSaving(false);
    }, 400);
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle>Notificações</CardTitle>
          <p className="text-sm text-slate-500">
            Ajuste como queremos falar com você. Salvaremos no servidor quando a API estiver disponível.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <NotificationRow
              icon={<Mail className="w-4 h-4 text-emerald-600" />}
              title="E-mail"
              description="Alertas de segurança, login e confirmações."
              checked={prefs.email}
              onCheckedChange={updatePref("email")}
            />
            {/* <NotificationRow
              icon={<Smartphone className="w-4 h-4 text-emerald-600" />}
              title="SMS"
              description="Avisos rápidos e códigos em duas etapas."
              checked={prefs.sms}
              onCheckedChange={updatePref("sms")}
            /> */}
            <NotificationRow
              icon={<Bell className="w-4 h-4 text-emerald-600" />}
              title="Push"
              description="Notificações no app/web sobre atividades importantes."
              checked={prefs.push}
              onCheckedChange={updatePref("push")}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? "Salvando..." : "Salvar preferências"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AccountContracts userId={userId} />
    </div>
  );
}

type RowProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

function NotificationRow({ icon, title, description, checked, onCheckedChange }: RowProps) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="mt-1">{icon}</div>
        <div>
          <Label className="text-sm font-medium text-slate-900">{title}</Label>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
