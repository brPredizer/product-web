import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import * as auth from '@/api/auth';
import { apiRequest } from '@/api/api';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function AccountSecurityForm(): JSX.Element {
  const { user } = useAuth() as { user?: any };
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [providers, setProviders] = useState<any[]>([]);
  const [hasExternalLogin, setHasExternalLogin] = useState(false);
  const [checkingExternal, setCheckingExternal] = useState(true);

  const mismatch = useMemo(() => {
    if (!newPassword || !confirmPassword) return false;
    return newPassword !== confirmPassword;
  }, [newPassword, confirmPassword]);

  const isOauthUser = useMemo(() => {
    if (!user) return false;
    try {
      if (Array.isArray(user.providers) && user.providers.length > 0) {
        const lower = user.providers.map((p: any) => String(p).toLowerCase());
        if (!lower.includes('password')) return true;
      }

      if (typeof user.has_password === 'boolean' && user.has_password === false) return true;
      if (typeof user.hasPassword === 'boolean' && user.hasPassword === false) return true;

      const providerFields = ['provider', 'authProvider', 'oauth_provider', 'signInProvider', 'sign_in_provider'];
      for (const k of providerFields) {
        const v = user[k];
        if (v && String(v).toLowerCase().includes('google')) {
          if (typeof user.hasPassword === 'boolean' && user.hasPassword) break;
          if (typeof user.has_password === 'boolean' && user.has_password) break;
          return true;
        }
      }

      if (user.googleId || user.google_id || user.google_uid) {
        if (typeof user.hasPassword === 'boolean' && user.hasPassword) return false;
        if (typeof user.has_password === 'boolean' && user.has_password) return false;
        return true;
      }
    } catch (e) {
      // ignore and treat as non-oauth
    }
    return false;
  }, [user]);

  const effectiveOauth = useMemo(() => {
    if (hasExternalLogin) return true;
    return isOauthUser;
  }, [hasExternalLogin, isOauthUser]);

  const isGoogleLinked = hasExternalLogin && providers.some((p) => String(p || '').toLowerCase().includes('google'));

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data: any = await apiRequest('/auth/manage/external-login');
        if (!mounted) return;
        if (data) {
          setHasExternalLogin(Boolean(data.hasExternalLogin));
          const p = Array.isArray(data.providers) ? data.providers : (data.providers ? [data.providers] : []);
          setProviders(p);
        }
      } catch (e) {
        // ignore and keep heuristic
      } finally {
        if (mounted) setCheckingExternal(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error('Preencha a nova senha e confirmação.');
      return;
    }
    if (mismatch) {
      toast.error('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      await (auth as any).changePassword({ oldPassword, newPassword, confirmPassword });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Senha alterada com sucesso.');
    } catch (error: any) {
      toast.error(error?.message || 'Falha ao alterar a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle>Senha e Segurança</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {hasExternalLogin && providers.some((p) => String(p || '').toLowerCase().includes('google')) && (
          <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-800 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-yellow-900">Conta via Google</h4>
                <p className="mt-1 text-sm text-yellow-800">
                  Sua conta foi criada com o Google. A senha só pode ser alterada nas configurações do Google.
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-5">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-700" htmlFor="oldPassword">
                    Senha atual
                  </label>

                  <div className="relative">
                    <Input
                      id="oldPassword"
                      type={showOld ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={oldPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOldPassword(e.target.value)}
                      className="mt-1 pr-10"
                      disabled={hasExternalLogin && providers.some((p) => String(p || '').toLowerCase().includes('google'))}
                    />
                    {isGoogleLinked ? (
                      <button
                        type="button"
                        onClick={() => setShowOld((v) => !v)}
                        disabled={true}
                        aria-disabled="true"
                        tabIndex={-1}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 cursor-not-allowed`}
                        aria-label={showOld ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowOld((v) => !v)}
                        disabled={false}
                        aria-disabled="false"
                        tabIndex={0}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800`}
                        aria-label={showOld ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                </div>

                <div />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-700" htmlFor="newPassword">
                    Nova senha
                  </label>

                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNew ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                      className="mt-1 pr-10"
                      disabled={hasExternalLogin && providers.some((p) => String(p || '').toLowerCase().includes('google'))}
                    />
                    {isGoogleLinked ? (
                      <button
                        type="button"
                        onClick={() => setShowNew((v) => !v)}
                        disabled={true}
                        aria-disabled="true"
                        tabIndex={-1}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 cursor-not-allowed`}
                        aria-label={showNew ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowNew((v) => !v)}
                        disabled={false}
                        aria-disabled="false"
                        tabIndex={0}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800`}
                        aria-label={showNew ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-slate-700" htmlFor="confirmPassword">
                    Confirmar senha
                  </label>

                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                      className={[
                        'mt-1 pr-10',
                        mismatch ? 'border-red-400 focus-visible:ring-red-300' : '',
                      ].join(' ')}
                      disabled={hasExternalLogin && providers.some((p) => String(p || '').toLowerCase().includes('google'))}
                    />
                    {isGoogleLinked ? (
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        disabled={true}
                        aria-disabled="true"
                        tabIndex={-1}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 cursor-not-allowed`}
                        aria-label={showConfirm ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        disabled={false}
                        aria-disabled="false"
                        tabIndex={0}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800`}
                        aria-label={showConfirm ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    )}
                  </div>

                  {mismatch && (
                    <p className="mt-2 text-sm text-red-600">
                      A confirmação precisa ser igual à nova senha.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={loading || (hasExternalLogin && providers.some((p) => String(p || '').toLowerCase().includes('google')))}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? 'Alterando...' : 'Alterar senha'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
