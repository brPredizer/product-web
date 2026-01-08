import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User as UserIcon, Home, Shield, CreditCard } from "lucide-react";

export default function AccountSidebar() {
  return (
    <aside className="hidden md:block sticky top-[76px] self-start">
      <div className="rounded-2xl border bg-white shadow-sm p-2">
        <div className="px-3 pt-3 pb-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Configurações
          </p>
        </div>
        <TabsList className="flex h-auto w-full flex-col items-stretch justify-start bg-transparent p-1 gap-1">
          <TabsTrigger value="personal" className="w-full justify-start rounded-xl px-3 py-2.5 hover:bg-slate-50 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:hover:bg-slate-900">
            <span className="flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              Dados
            </span>
          </TabsTrigger>
          <TabsTrigger value="address" className="w-full justify-start rounded-xl px-3 py-2.5 hover:bg-slate-50 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:hover:bg-slate-900">
            <span className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Endereço
            </span>
          </TabsTrigger>
          <TabsTrigger value="security" className="w-full justify-start rounded-xl px-3 py-2.5 hover:bg-slate-50 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:hover:bg-slate-900">
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Segurança
            </span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="w-full justify-start rounded-xl px-3 py-2.5 hover:bg-slate-50 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:hover:bg-slate-900">
            <span className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Pagamentos
            </span>
          </TabsTrigger>
        </TabsList>
      </div>
    </aside>
  );
}
