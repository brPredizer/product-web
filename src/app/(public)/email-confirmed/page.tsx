"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmEmailResult from "../confirm-email/ConfirmEmailResult";

export default function EmailConfirmedPage(): JSX.Element {
  const router = useRouter();
  const [sec, setSec] = useState<number>(10);

  useEffect(() => {
    const t = setInterval(() =>
      setSec((s) => {
        if (s <= 1) {
          clearInterval(t);
          return 0;
        }
        return s - 1;
      }),
    1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (sec <= 0) {
      router.replace("/sign-in");
    }
  }, [sec, router]);

  return <ConfirmEmailResult status="success" sec={sec} />;
}
