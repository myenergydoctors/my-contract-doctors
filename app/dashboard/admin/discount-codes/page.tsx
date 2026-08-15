import { redirect } from "next/navigation";
import { createClient as createServerClient } from "@/lib/supabase/server";
import DiscountCodesAdmin from "./DiscountCodesAdmin";

export const metadata = {
  title: "Discount codes | My Contract Doctors",
};

export default async function DiscountCodesAdminPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/dashboard");

  return <DiscountCodesAdmin />;
}
