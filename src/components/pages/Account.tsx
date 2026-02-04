"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { authClient } from "@/app/api/auth";
import { paymentsClient } from "@/app/api/payments";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { User as UserIcon, Home as HomeIcon, Shield, CreditCard } from "lucide-react";
import AccountSidebar from "@/components/account/AccountSidebar";
import AccountPersonalForm from "@/components/account/AccountPersonalForm";
import AccountAddressForm from "@/components/account/AccountAddressForm";
import AccountSecurityForm from "@/components/account/AccountSecurityForm";
import AccountPaymentsForm from "@/components/account/AccountPaymentsForm";
import AccountPrivacyPanel from "@/components/account/AccountPrivacyPanel";
import { fetchViaCep } from "@/utils/viacep";

type User = any;

// Workarounds for untyped UI primitives
const CardC = (Card as unknown) as React.ComponentType<any>;
const CardHeaderC = (CardHeader as unknown) as React.ComponentType<any>;
const CardContentC = (CardContent as unknown) as React.ComponentType<any>;
const CardTitleC = (CardTitle as unknown) as React.ComponentType<any>;
const TabsC = (Tabs as unknown) as React.ComponentType<any>;
const TabsContentC = (TabsContent as unknown) as React.ComponentType<any>;
const TabsListC = (TabsList as unknown) as React.ComponentType<any>;
const TabsTriggerC = (TabsTrigger as unknown) as React.ComponentType<any>;
const InputC = (Input as unknown) as React.ComponentType<any>;
const ButtonC = (Button as unknown) as React.ComponentType<any>;
const authClientAny = authClient as any;
const paymentsClientAny = paymentsClient as any;
const AccountPersonalFormC = (AccountPersonalForm as unknown) as React.ComponentType<any>;
const AccountAddressFormC = (AccountAddressForm as unknown) as React.ComponentType<any>;
const AccountPrivacyPanelC = (AccountPrivacyPanel as unknown) as React.ComponentType<any>;

export default function Account({ user, refreshUser }: { user?: User; refreshUser?: () => void }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [cepLoading, setCepLoading] = useState(false);

    const [avatarUrl, setAvatarUrl] = useState("");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState("");

    const [fullName, setFullName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [cpf, setCpf] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [paymentsLoading, setPaymentsLoading] = useState(false);
    const [address, setAddress] = useState({
        zip: "",
        street: "",
        neighborhood: "",
        number: "",
        complement: "",
        city: "",
        state: "",
    });

    const lastCepRef = useRef("");
    const cepDebounceRef = useRef<any>(null);

    const onlyDigits = (v: any) => String(v || "").replace(/\D/g, "");
    const formatCep = (v: any) => {
        const d = onlyDigits(v).slice(0, 8);
        if (d.length <= 5) return d;
        return `${d.slice(0, 5)}-${d.slice(5)}`;
    };
    const formatCpf = (v: any) => {
        const d = onlyDigits(v).slice(0, 11);
        if (d.length <= 3) return d;
        if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
        if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
        return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
    };
    const formatPhone = (v: any) => {
        const d = onlyDigits(v).slice(0, 11);
        if (d.length <= 2) return d;
        if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
        if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
        return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    };

    const fileToBase64 = (file: File) =>
        new Promise<string | ArrayBuffer | null>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

    const loadPaymentMethods = useCallback(async () => {
        if (!user) return;
        setPaymentsLoading(true);
        try {
            const methods =
                (await paymentsClientAny.getPaymentMethods?.()) ??
                (await paymentsClientAny.getMethods?.());
            setPaymentMethods(Array.isArray(methods) ? methods : []);
        } catch {
            toast.error("Falha ao carregar pagamentos");
        } finally {
            setPaymentsLoading(false);
        }
    }, [user]);
    useEffect(() => {
        loadPaymentMethods();
    }, [loadPaymentMethods]);

    useEffect(() => {
        if (!user) return;

        setFullName(user.full_name || "");
        setUsername(user.username || "");
        setEmail(user.email || "");
        setCpf(user.cpf ? formatCpf(user.cpf) : "");
        const resolvedPhone = user.phone_number || user.phoneNumber || "";
        setPhoneNumber(resolvedPhone ? formatPhone(resolvedPhone) : "");

        setAddress({
            zip: user.address_zip ? formatCep(user.address_zip) : "",
            street: user.address_street || "",
            neighborhood: user.address_neighborhood || user.address?.neighborhood || "",
            number: user.address_number || "",
            complement: user.address_complement || user.address?.complement || "",
            city: user.address_city || "",
            state: user.address_state || "",
        });

        setAvatarUrl(user.avatar_url || "");
        setAvatarPreview(user.avatar_url || "");
        setAvatarFile(null);
    }, [user]);

    useEffect(() => {
        return () => {
            if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
        };
    }, [avatarPreview]);

    if (!user) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <CardC className="max-w-md w-full shadow-sm">
                    <CardHeaderC>
                        <CardTitleC>Minha Conta</CardTitleC>
                    </CardHeaderC>
                    <CardContentC>
                        <ButtonC
                            className="w-full bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => router.push('/sign-in')}
                        >
                            Entrar
                        </ButtonC>
                    </CardContentC>
                </CardC>
            </div>
        );
    }

    const savePersonal = async () => {
        setLoading(true);
        try {
            const payload: any = {
                full_name: fullName,
                username,
                email,
            };
            const cpfDigits = onlyDigits(cpf);
            const phoneDigits = onlyDigits(phoneNumber);
            if (cpfDigits) payload.cpf = cpfDigits;
            if (phoneDigits) payload.phoneNumber = phoneDigits;

            let avatar_payload: any;
            if (avatarFile) {
                const base64 = await fileToBase64(avatarFile as File);
                avatar_payload = base64;
            } else if (avatarUrl) {
                avatar_payload = avatarUrl;
            }

            if (avatar_payload !== undefined) {
                payload.avatar_url = avatar_payload;
            }

            await authClientAny.updateUser(payload);

            toast.success("Dados pessoais atualizados");
            if (avatar_payload !== undefined) {
                setAvatarUrl(avatar_payload);
            }
            setAvatarFile(null);
            refreshUser?.();
        } finally {
            setLoading(false);
        }
    };
    const createPaymentMethod = async (payload: any, successMessage?: string) => {
        setLoading(true);
        try {
            if (payload?.token && paymentsClientAny.saveMercadoPagoCard) {
                await paymentsClientAny.saveMercadoPagoCard(payload);
            } else {
                await paymentsClientAny.createMethod(payload);
            }
            await loadPaymentMethods();
            toast.success(successMessage || "Metodo adicionado");
        } catch (error: any) {
            toast.error(error?.message || "Falha ao adicionar metodo");
        } finally {
            setLoading(false);
        }
    };

    const removePaymentMethod = async (methodId: any, successMessage?: string) => {
        setLoading(true);
        try {
            if (paymentsClientAny.deletePaymentMethod) {
                await paymentsClientAny.deletePaymentMethod(methodId);
            } else {
                await paymentsClientAny.deleteMethod(methodId);
            }
            await loadPaymentMethods();
            toast.success(successMessage || "Metodo removido");
        } catch (error: any) {
            toast.error(error?.message || "Falha ao remover metodo");
        } finally {
            setLoading(false);
        }
    };

    const saveAddress = async () => {
        setLoading(true);
        try {
            await authClientAny.updateUser({
                address_zip: onlyDigits(address.zip),
                address_street: address.street,
                address_neighborhood: address.neighborhood,
                address_number: address.number,
                address_complement: address.complement,
                address_city: address.city,
                address_state: address.state,
            });
            toast.success("Endereco atualizado");
            refreshUser?.();
        } finally {
            setLoading(false);
        }
    };

    const lookupCep = async (cepRaw?: string) => {
        const cep = onlyDigits(cepRaw ?? address.zip);
        if (cep.length !== 8) return;

        if (lastCepRef.current === cep) return;
        lastCepRef.current = cep;

        setCepLoading(true);
        try {
            const data = await fetchViaCep(cep);
            if (!data) {
                toast.error("CEP nao encontrado");
                return;
            }

            setAddress((prev) => ({
                ...prev,
                zip: formatCep(data.zipCode || cep),
                city: data.city || prev.city,
                state: data.state || prev.state,
                street: data.street || prev.street,
                neighborhood: data.neighborhood || prev.neighborhood,
                number: prev.number,
                complement: data.complement || prev.complement
            }));

            toast.success("Endereco preenchido pelo CEP");
        } catch {
            toast.error("Falha ao consultar CEP");
        } finally {
            setCepLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-24 md:pb-10">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                <div className="flex items-start justify-between gap-6 mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Minha Conta</h1>
                        <p className="text-slate-500">Gerencie seus dados, segurança e pagamentos.</p>
                    </div>
                </div>
                <TabsC defaultValue="personal">
                    <div className="md:hidden fixed inset-x-0 bottom-0 z-30 bg-white border-t border-slate-200">
                        <TabsListC className="grid grid-cols-4 h-16 w-full bg-white px-2">
                            <TabsTriggerC
                                value="personal"
                                className="flex flex-col items-center justify-center gap-0.5 text-xs text-slate-500 transition-all rounded-md py-2 bg-transparent shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:text-emerald-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                            >
                                <UserIcon className="w-5 h-5 transition-transform duration-150 data-[state=active]:-translate-y-0.5 data-[state=active]:text-emerald-600" />
                                <span className="text-[11px] leading-3 font-medium transition-all duration-150 data-[state=active]:opacity-100 data-[state=inactive]:opacity-60">
                                    Dados
                                </span>
                            </TabsTriggerC>
                            <TabsTriggerC
                                value="address"
                                className="flex flex-col items-center justify-center gap-0.5 text-xs text-slate-500 transition-all rounded-md py-2 bg-transparent shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:text-emerald-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                            >
                                <HomeIcon className="w-5 h-5 transition-transform duration-150 data-[state=active]:-translate-y-0.5 data-[state=active]:text-emerald-600" />
                                <span className="text-[11px] leading-3 font-medium transition-all duration-150 data-[state=active]:opacity-100 data-[state=inactive]:opacity-60">
                                    Endereço
                                </span>
                            </TabsTriggerC>
                            <TabsTriggerC
                                value="security"
                                className="flex flex-col items-center justify-center gap-0.5 text-xs text-slate-500 transition-all rounded-md py-2 bg-transparent shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:text-emerald-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                            >
                                <Shield className="w-5 h-5 transition-transform duration-150 data-[state=active]:-translate-y-0.5 data-[state=active]:text-emerald-600" />
                                <span className="text-[11px] leading-3 font-medium transition-all duration-150 data-[state=active]:opacity-100 data-[state=inactive]:opacity-60">
                                   Priv. e Seg.
                                </span>
                            </TabsTriggerC>
                            <TabsTriggerC
                                value="payments"
                                className="flex flex-col items-center justify-center gap-0.5 text-xs text-slate-500 transition-all rounded-md py-2 bg-transparent shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:text-emerald-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                            >
                                <CreditCard className="w-5 h-5 transition-transform duration-150 data-[state=active]:-translate-y-0.5 data-[state=active]:text-emerald-600" />
                                <span className="text-[11px] leading-3 font-medium transition-all duration-150 data-[state=active]:opacity-100 data-[state=inactive]:opacity-60">
                                    Pag.
                                </span>
                            </TabsTriggerC>
                        </TabsListC>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6 items-start">
                        <AccountSidebar />
                        <main className="min-w-0">
                            <TabsContentC value="personal" className="space-y-4">
                                <AccountPersonalFormC
                                    fullName={fullName}
                                    setFullName={setFullName}
                                    username={username}
                                    setUsername={setUsername}
                                    email={email}
                                    setEmail={setEmail}
                                    cpf={cpf}
                                    setCpf={(value: any) => setCpf(formatCpf(value))}
                                    phoneNumber={phoneNumber}
                                    setPhoneNumber={(value: any) => setPhoneNumber(formatPhone(value))}
                                    avatarPreview={avatarPreview}
                                    avatarFile={avatarFile}
                                    avatarUrl={avatarUrl}
                                    setAvatarFile={setAvatarFile}
                                    setAvatarPreview={setAvatarPreview}
                                    savePersonal={savePersonal}
                                    loading={loading}
                                />
                            </TabsContentC>
                            <TabsContentC value="address" className="space-y-4">
                                <AccountAddressFormC
                                    address={address}
                                    setAddress={setAddress}
                                    formatCep={formatCep}
                                    onlyDigits={onlyDigits}
                                    cepLoading={cepLoading}
                                    lookupCep={lookupCep}
                                    saveAddress={saveAddress}
                                    loading={loading}
                                    cepDebounceRef={cepDebounceRef}
                                />
                            </TabsContentC>
                            <TabsContentC value="security" className="space-y-4">
                                <AccountSecurityForm />
                                <AccountPrivacyPanelC userId={user?.id || user?.userId || user?.sub} />
                            </TabsContentC>
                            <TabsContentC value="payments" className="space-y-6">
                                <AccountPaymentsForm
                                    paymentMethods={paymentMethods}
                                    createPaymentMethod={createPaymentMethod}
                                    removePaymentMethod={removePaymentMethod}
                                    loading={loading || paymentsLoading}
                                />
                            </TabsContentC>
                        </main>
                    </div>
                </TabsC>
            </div>
        </div>
    );
}



