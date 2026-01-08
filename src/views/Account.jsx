import React, { useCallback, useEffect, useRef, useState } from "react";
import { authClient } from "@/api/auth";
import { paymentsClient } from "@/api/payments";
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
import { MapPin } from "lucide-react";
import AccountSidebar from "@/components/account/AccountSidebar";
import AccountPersonalForm from "@/components/account/AccountPersonalForm";
import AccountAddressForm from "@/components/account/AccountAddressForm";
import AccountSecurityForm from "@/components/account/AccountSecurityForm";
import AccountPaymentsForm from "@/components/account/AccountPaymentsForm";
import { fetchViaCep } from "@/utils/viacep";

export default function Account({ user, refreshUser }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [cepLoading, setCepLoading] = useState(false);

    // Avatar state
    const [avatarUrl, setAvatarUrl] = useState("");
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState("");

    // Local editable state
    const [fullName, setFullName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [paymentMethods, setPaymentMethods] = useState([]);
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

    // Refs para evitar spam de requisição no CEP
    const lastCepRef = useRef("");
    const cepDebounceRef = useRef(null);

    // ----------------------------
    // Helpers (format + parsing)
    // ----------------------------
    const onlyDigits = (v) => String(v || "").replace(/\D/g, "");
    const formatCep = (v) => {
        const d = onlyDigits(v).slice(0, 8);
        if (d.length <= 5) return d;
        return `${d.slice(0, 5)}-${d.slice(5)}`;
    };

    const fileToBase64 = (file) =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

    const loadPaymentMethods = useCallback(async () => {
        if (!user) return;
        setPaymentsLoading(true);
        try {
            const methods = await paymentsClient.getMethods();
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

    // ----------------------------
    // Load user
    // ----------------------------
    useEffect(() => {
        if (!user) return;

        setFullName(user.full_name || "");
        setUsername(user.username || "");
        setEmail(user.email || "");

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

    // Cleanup do preview URL quando usar URL.createObjectURL
    useEffect(() => {
        return () => {
            if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
        };
    }, [avatarPreview]);

    if (!user) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <Card className="max-w-md w-full shadow-sm">
                    <CardHeader>
                        <CardTitle>Minha Conta</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button
                            className="w-full bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => router.push("/Login")}
                        >
                            Entrar
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // ----------------------------
    // Actions
    // ----------------------------
    const savePersonal = async () => {
        setLoading(true);
        try {
            const payload = {
                full_name: fullName,
                username,
                email,
            };

            let avatar_payload;
            if (avatarFile) {
                const base64 = await fileToBase64(avatarFile);
                avatar_payload = base64;
            } else if (avatarUrl) {
                avatar_payload = avatarUrl;
            }

            if (avatar_payload !== undefined) {
                payload.avatar_url = avatar_payload;
            }

            await authClient.updateUser(payload);

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
    const createPaymentMethod = async (payload, successMessage) => {
        setLoading(true);
        try {
            await paymentsClient.createMethod(payload);
            await loadPaymentMethods();
            toast.success(successMessage || "Metodo adicionado");
        } catch (error) {
            toast.error(error?.message || "Falha ao adicionar metodo");
        } finally {
            setLoading(false);
        }
    };

    const removePaymentMethod = async (methodId, successMessage) => {
        setLoading(true);
        try {
            await paymentsClient.deleteMethod(methodId);
            await loadPaymentMethods();
            toast.success(successMessage || "Metodo removido");
        } catch (error) {
            toast.error(error?.message || "Falha ao remover metodo");
        } finally {
            setLoading(false);
        }
    };

    const saveAddress = async () => {
        setLoading(true);
        try {
            await authClient.updateUser({
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

    const lookupCep = async (cepRaw) => {
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
    // ----------------------------
    // UI
    // ----------------------------
    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-6 mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Minha Conta</h1>
                        <p className="text-slate-500">Gerencie seus dados, segurança e pagamentos.</p>
                    </div>
                </div>
                {/* Layout com menu lateral */}
                <Tabs defaultValue="personal">
                    <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6 items-start">
                        {/* Sidebar */}
                        <AccountSidebar />
                        {/* Content */}
                        <main className="min-w-0">
                            {/* DADOS */}
                            <TabsContent value="personal" className="space-y-4">
                                <AccountPersonalForm
                                    fullName={fullName}
                                    setFullName={setFullName}
                                    username={username}
                                    setUsername={setUsername}
                                    email={email}
                                    setEmail={setEmail}
                                    avatarPreview={avatarPreview}
                                    avatarFile={avatarFile}
                                    avatarUrl={avatarUrl}
                                    setAvatarFile={setAvatarFile}
                                    setAvatarPreview={setAvatarPreview}
                                    savePersonal={savePersonal}
                                    loading={loading}
                                />
                            </TabsContent>
                            {/* ENDEREÇO */}
                            <TabsContent value="address" className="space-y-4">
                                <AccountAddressForm
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
                            </TabsContent>
                            {/* SEGURANÇA */}
                            <TabsContent value="security" className="space-y-4">
                                <AccountSecurityForm />
                            </TabsContent>
                            {/* PAGAMENTOS */}
                            <TabsContent value="payments" className="space-y-6">
                                <AccountPaymentsForm
                                    paymentMethods={paymentMethods}
                                    createPaymentMethod={createPaymentMethod}
                                    removePaymentMethod={removePaymentMethod}
                                    loading={loading || paymentsLoading}
                                />
                            </TabsContent>
                        </main>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}



