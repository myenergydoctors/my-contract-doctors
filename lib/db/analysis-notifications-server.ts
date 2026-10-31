import "server-only";
import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

// Call only after the caller has verified ownership and saved the analysis state.
// A repeat delivery must not duplicate the event or reset a customer's read state.
export async function saveAnalysisNotification(userId: string, kind: "invoice" | "agreement", analysisId: string, status: "ready" | "failed") {
  const digest = createHash("sha256").update(`${userId}:${kind}:${analysisId}:${status}`).digest("hex");
  const id = `${digest.slice(0, 8)}-${digest.slice(8, 12)}-8${digest.slice(13, 16)}-a${digest.slice(17, 20)}-${digest.slice(20, 32)}`;
  try {
    const { error } = await createAdminClient().rpc("record_notification_event", { p_event: {
      id, user_id: userId, type: "analysis",
      title: `${kind === "invoice" ? "Invoice" : "Agreement"} ${status === "ready" ? "ready for review" : "analysis needs another attempt"}`,
      body: status === "ready" ? "The extracted details are saved. Review and confirm them before using the findings." : "We could not safely finish the analysis. Open your saved documents to review its status and retry.",
      href: kind === "invoice" ? "/dashboard/invoices" : "/dashboard/agreements",
      action_label: "View saved documents", unread: true,
    }, p_category: "analysis", p_context: { kind, analysisId, status } });
    if (error) throw error;
    return true;
  } catch (error) {
    // Notification delivery never changes whether the document itself was saved.
    console.error("Analysis notification could not be saved:", error);
    return false;
  }
}
