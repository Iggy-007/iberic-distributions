"use client";

import { useState } from "react";
import { btnSecondary } from "@/lib/ui-classes";

export function CopyTrackingButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" onClick={copy} className={btnSecondary}>
      {copied ? "Enlace copiado" : "Copiar enlace"}
    </button>
  );
}
