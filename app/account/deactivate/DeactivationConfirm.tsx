"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DeactivationConfirm({ token }: { token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const confirm = async () => {
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/account/deactivate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) { setError(result.error || "Could not deactivate your account."); return; }
      await createClient().auth.signOut();
      router.replace("/account/deactivated");
      router.refresh();
    } catch { setError("Could not deactivate your account. Please try again."); }
    finally { setBusy(false); }
  };
  return <div>
    {error && <p role="alert" className="font-sans text-sm text-red mb-4">{error}</p>}
    <button type="button" disabled={busy} onClick={confirm} className="w-full bg-red text-white font-sans text-sm font-medium py-3 rounded-lg disabled:opacity-60 cursor-pointer">{busy ? "Deactivating…" : "Confirm deactivation"}</button>
  </div>;
}
