"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ConfirmEmailResult, { ConfirmEmailStatus } from "../ConfirmEmailResult";

export default function ConfirmEmailShortCodePage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const code = useMemo(() => {
    const value = (params as { code?: string | string[] })?.code;
    return Array.isArray(value) ? value[0] : value;
  }, [params]);

  const [status, setStatus] = useState<ConfirmEmailStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const redirectToError = (message?: string) => {
      if (message) {
        setError(message);
        setStatus("error");
      }
      router.push("/email-confirm-error");
    };

    if (!code) {
      redirectToError("Codigo invalido para confirmacao.");
      return () => controller.abort();
    }

    const confirm = async () => {
      try {
        const search = new URLSearchParams({ shortCode: code });
        // Prefer same-origin call to avoid backend redirects showing in the URL bar.
        const url = `/api/v1/auth/confirmEmail?${search.toString()}`;
        const response = await fetch(url, {
          method: "POST",
          credentials: "include",
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`Confirm email failed (${response.status})`);
        }

        router.push("/email-confirmed");
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("Confirm email by short code failed", err);
        redirectToError("Nao foi possivel confirmar o email.");
      }
    };

    confirm();

    return () => controller.abort();
  }, [code, router]);

  return <ConfirmEmailResult status={status} error={error} />;
}
