"use client";

import Script from "next/script";
import React from "react";

export function MercadoPagoSecurityScripts() {
    return (
        <>
            {/* Mercado Pago JS SDK (se já carregar em outro lugar, pode remover) */}
            <Script src="https://sdk.mercadopago.com/js/v2" strategy="afterInteractive" />

            {/* Device fingerprint script: prescrição do Mercado Pago exige data-view */}
            <Script
                src="https://www.mercadopago.com/v2/security.js"
                strategy="afterInteractive"
                data-view="checkout"
            />
        </>
    );
}

export default MercadoPagoSecurityScripts;
