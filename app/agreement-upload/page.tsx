"use client";

import Image from "next/image";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Logo from "@/components/Logo";

const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic"]);

export default function AgreementUploadPage() {
  return <Suspense fallback={<Shell message="Opening your secure agreement upload…" />}><PhoneAgreementUpload /></Suspense>;
}

function PhoneAgreementUpload() {
  const params = useSearchParams();
  const sessionId = params.get("session") || "";
  const token = params.get("token") || "";
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview); }, [preview]);
  function pick(candidate?: File) {
    setError("");
    if (!candidate) return;
    if (!ALLOWED_TYPES.has(candidate.type) || candidate.size < 1 || candidate.size > MAX_BYTES) {
      setError("Choose a PDF, JPG, PNG, WEBP, or HEIC file smaller than 25 MB."); return;
    }
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setFile(candidate); setPreview(candidate.type.startsWith("image/") ? URL.createObjectURL(candidate) : "pdf");
  }
  async function send() {
    if (!file || !sessionId || !token) return;
    setBusy(true); setError("");
    try {
      const form = new FormData(); form.set("file", file);
      const response = await fetch(`/api/agreements/upload-sessions/${sessionId}/file`, { method: "POST", headers: { "x-upload-token": token }, body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "The agreement could not be sent.");
      setSent(true);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "The agreement could not be sent."); }
    finally { setBusy(false); }
  }
  if (!sessionId || !token) return <Shell message="This agreement upload link is incomplete. Return to the desktop and scan a fresh code." error />;

  return <div className="min-h-screen bg-off-white">
    <header className="flex items-center justify-between bg-navy px-5 py-4 text-white"><Logo href={null} variant="dark-bg" size="sm" /><span className="font-sans text-[10px] uppercase tracking-wider text-white/50">Secure agreement upload</span></header>
    <main className="mx-auto w-full max-w-md px-5 py-8">
      {!sent ? <>
        <div className="mb-8 text-center"><span className="mb-3 block font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-teal">Your desktop is waiting</span><h1 className="mb-3 font-serif text-2xl text-navy">Choose the complete agreement.</h1><p className="font-sans text-sm font-light leading-relaxed text-gray-500">For a multi-page paper agreement, scan every page into one PDF before uploading. The camera option is intended for a readable one-page agreement.</p></div>
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={event=>pick(event.currentTarget.files?.[0])} />
        <input ref={libraryRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={event=>pick(event.currentTarget.files?.[0])} />
        {!file ? <div className="flex flex-col gap-3"><button onClick={()=>cameraRef.current?.click()} className="w-full rounded-xl bg-navy px-5 py-4 font-sans font-medium text-white">Open camera</button><button onClick={()=>libraryRef.current?.click()} className="w-full rounded-xl border border-gray-300 bg-white px-5 py-4 font-sans text-navy">Choose PDF or photo</button></div> :
          <div className="flex flex-col gap-3">{preview !== "pdf" && preview ? <Image src={preview} alt="Selected agreement" width={800} height={1000} unoptimized className="max-h-[400px] w-full rounded-xl border border-gray-200 object-contain" /> : <div className="rounded-xl border border-blue/20 bg-blue-pale p-5 text-center font-sans text-sm text-navy">PDF selected</div>}<div className="break-all text-center font-sans text-xs text-gray-500">{file.name}</div><button onClick={send} disabled={busy} className="w-full rounded-xl bg-teal px-5 py-4 font-sans font-medium text-white disabled:opacity-60">{busy ? "Sending securely…" : "Send to desktop →"}</button><button onClick={()=>{setFile(null);setPreview(null);}} className="border-none bg-transparent font-sans text-sm text-gray-500 underline">Choose a different file</button></div>}
        {error && <div role="alert" className="mt-4 rounded-xl border border-red/30 bg-red-light p-4 font-sans text-sm text-red">{error}</div>}
        <div className="mt-10 rounded-xl border border-gray-200 bg-white p-4 font-sans text-xs leading-5 text-gray-500">This one-use link expires after 30 minutes and does not sign your account into this phone.</div>
      </> : <div className="pt-12 text-center"><div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-teal-light text-3xl text-teal">✓</div><h2 className="mb-3 font-serif text-2xl text-navy">Sent to your desktop.</h2><p className="font-sans text-sm text-gray-500">Return to the desktop browser. It will recognize the agreement automatically.</p></div>}
    </main>
  </div>;
}

function Shell({ message, error = false }: { message: string; error?: boolean }) {
  return <div className="flex min-h-screen items-center justify-center bg-off-white px-6 text-center font-sans text-sm text-gray-500"><div className={error ? "rounded-xl border border-red/30 bg-red-light p-5 text-red" : ""}>{message}</div></div>;
}
