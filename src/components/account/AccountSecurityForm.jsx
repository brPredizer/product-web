import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AccountSecurityForm() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Senha e Segurança</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-700">Nova senha</label>
            <Input type="password" placeholder="••••••••" className="mt-1" />
          </div>
          <div>
            <label className="text-sm text-slate-700">Confirmar senha</label>
            <Input type="password" placeholder="••••••••" className="mt-1" />
          </div>
        </div>
        <Button variant="outline" disabled>
          Alterar senha (demo)
        </Button>
      </CardContent>
    </Card>
  );
}
