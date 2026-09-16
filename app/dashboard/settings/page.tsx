"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getProfile, updateProfile } from "@/lib/db/profiles";
import { createClient } from "@/lib/supabase/client";
import { SITE } from "@/lib/site";

type ProfileForm = { firstName: string; lastName: string; businessName: string; industry: string };
const emptyProfile: ProfileForm = { firstName: "", lastName: "", businessName: "", industry: "" };

export default function SettingsPage() {
  const [profile, setProfile] = useState<ProfileForm>(emptyProfile);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [requestingDeactivation, setRequestingDeactivation] = useState(false);
  const [deactivationMessage, setDeactivationMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const supabase = createClient();
      const [{ data: { user } }, row] = await Promise.all([supabase.auth.getUser(), getProfile()]);
      if (!mounted) return;
      setEmail(user?.email ?? "");
      if (row) setProfile({ firstName: row.first_name ?? "", lastName: row.last_name ?? "", businessName: row.business_name ?? "", industry: row.industry ?? "" });
      else setProfileMessage("Your profile is unavailable. Please reload and try again.");
      setLoading(false);
    };
    void load();
    return () => { mounted = false; };
  }, []);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setProfileMessage("");
    const firstName = profile.firstName.trim();
    const lastName = profile.lastName.trim();
    const businessName = profile.businessName.trim();
    const industry = profile.industry.trim();
    if (!firstName || !lastName || !businessName || [firstName, lastName, businessName, industry].some(value => value.length > 100)) {
      setProfileMessage("Enter your name and business name (100 characters or fewer each).");
      return;
    }
    setSaving(true);
    const result = await updateProfile({ first_name: firstName, last_name: lastName, business_name: businessName, industry: industry || null });
    setSaving(false);
    if (!result.ok) { setProfileMessage(result.error || "Could not save your profile."); return; }
    setProfile({ firstName, lastName, businessName, industry });
    setProfileMessage("Profile saved.");
    window.dispatchEvent(new Event("mcd:profile-updated"));
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordMessage("");
    if (!email || !currentPassword) { setPasswordMessage("Enter your current password first."); return; }
    if (newPassword.length < 8 || newPassword !== confirmPassword) { setPasswordMessage("Use a new password of at least 8 characters and confirm it exactly."); return; }
    setChangingPassword(true);
    try {
      const response = await fetch("/api/account/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) { setPasswordMessage(result.error || "Could not update your password."); return; }
    } catch { setPasswordMessage("Could not update your password. Please try again."); return; }
    finally { setChangingPassword(false); }
    const { error: sessionError } = await createClient().auth.signOut({ scope: "others" });
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    setPasswordMessage(sessionError
      ? "Password updated. We could not sign out other sessions; please review your account security."
      : "Password updated. Other signed-in sessions have been signed out.");
  };

  const requestDeactivation = async () => {
    setDeactivationMessage("");
    setRequestingDeactivation(true);
    try {
      const response = await fetch("/api/account/deactivation-request", { method: "POST", headers: { "Content-Type": "application/json" } });
      const result = await response.json() as { error?: string };
      setDeactivationMessage(response.ok ? `Confirmation email sent to ${email}. Your account remains active until you confirm it.` : result.error || "Could not send the confirmation email.");
    } catch { setDeactivationMessage("Could not send the confirmation email. Please try again."); }
    finally { setRequestingDeactivation(false); }
  };

  const field = (label: string, value: string, key: keyof ProfileForm, required = false) => (
    <label className="block font-sans text-xs font-semibold text-gray-700">{label}
      <input value={value} maxLength={100} required={required} onChange={event => setProfile(current => ({ ...current, [key]: event.target.value }))}
        className="mt-1.5 w-full font-sans text-sm font-normal text-navy bg-white rounded-lg px-3.5 py-2.5 border border-gray-300 outline-none focus:border-blue" />
    </label>
  );

  return <div className="max-w-3xl flex flex-col gap-6">
    <section className="bg-white border border-gray-200 rounded-2xl p-6">
      <div className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-blue mb-1">Profile</div>
      <h2 className="font-serif text-navy text-xl mb-5">Your information</h2>
      {loading ? <p className="font-sans text-sm text-gray-500">Loading your profile…</p> : <form onSubmit={saveProfile} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field("First name", profile.firstName, "firstName", true)}
          {field("Last name", profile.lastName, "lastName", true)}
          {field("Business name", profile.businessName, "businessName", true)}
          {field("Industry (optional)", profile.industry, "industry")}
        </div>
        <label className="block font-sans text-xs font-semibold text-gray-700">Sign-in email
          <input type="email" value={email} readOnly className="mt-1.5 w-full font-sans text-sm font-normal text-gray-600 bg-gray-50 rounded-lg px-3.5 py-2.5 border border-gray-200" />
        </label>
        <p className="font-sans text-xs text-gray-500">Email changes are not available here yet. Contact <a href={`mailto:${SITE.email}`} className="text-blue">{SITE.email}</a> if your sign-in email needs to change.</p>
        <div className="flex items-center justify-between gap-4"><p role="status" className="font-sans text-sm text-gray-600">{profileMessage}</p>
          <button disabled={saving} className="font-sans text-sm font-medium bg-navy text-white px-5 py-2.5 rounded-lg disabled:opacity-60 cursor-pointer">{saving ? "Saving…" : "Save changes"}</button></div>
      </form>}
    </section>

    <section className="bg-white border border-gray-200 rounded-2xl p-6">
      <div className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-blue mb-1">Security</div>
      <h2 className="font-serif text-navy text-xl mb-3">Password</h2>
      <p className="font-sans text-sm text-gray-600 mb-5">Enter your current password to change it. If you use email links or cannot remember it, <Link href="/forgot-password" className="text-blue">send yourself a password reset link</Link>.</p>
      <form onSubmit={changePassword} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PasswordField label="Current password" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" />
          <div />
          <PasswordField label="New password" value={newPassword} onChange={setNewPassword} autoComplete="new-password" />
          <PasswordField label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
        </div>
        <div className="flex items-center justify-between gap-4"><p role="status" className="font-sans text-sm text-gray-600">{passwordMessage}</p>
          <button disabled={changingPassword} className="font-sans text-sm font-medium bg-navy text-white px-5 py-2.5 rounded-lg disabled:opacity-60 cursor-pointer">{changingPassword ? "Updating…" : "Update password"}</button></div>
      </form>
    </section>

    <section className="bg-white border-2 border-red/30 rounded-2xl p-6">
      <div className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-red mb-1">Account access</div>
      <h2 className="font-serif text-navy text-xl mb-3">Deactivate account</h2>
      <p className="font-sans text-sm text-gray-600 leading-relaxed mb-4">We will email you a confirmation link. After you confirm, access to your dashboard and new file requests is blocked. Your uploaded contracts, invoices, analyses, and billing previews remain stored while a retention policy is finalized. No files are deleted by deactivation. File links you opened earlier may work for up to 10 minutes.</p>
      <p className="font-sans text-xs text-gray-500 mb-5">To ask about reactivation or your stored data, contact <a href={`mailto:${SITE.email}`} className="text-blue">{SITE.email}</a>.</p>
      <div className="flex items-center justify-between gap-4"><p role="status" className="font-sans text-sm text-gray-600">{deactivationMessage}</p>
        <button type="button" onClick={requestDeactivation} disabled={requestingDeactivation || !email} className="font-sans text-sm font-medium bg-red text-white px-5 py-2.5 rounded-lg disabled:opacity-60 cursor-pointer">{requestingDeactivation ? "Sending…" : "Email deactivation link"}</button></div>
    </section>
  </div>;
}

function PasswordField({ label, value, onChange, autoComplete }: { label: string; value: string; onChange: (value: string) => void; autoComplete: string }) {
  return <label className="block font-sans text-xs font-semibold text-gray-700">{label}
    <input type="password" value={value} required autoComplete={autoComplete} onChange={event => onChange(event.target.value)}
      className="mt-1.5 w-full font-sans text-sm font-normal text-navy bg-white rounded-lg px-3.5 py-2.5 border border-gray-300 outline-none focus:border-blue" />
  </label>;
}
