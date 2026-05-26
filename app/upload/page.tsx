"use client";
import { useEffect, useRef, useState } from "react";
import Logo from "@/components/Logo";

// Mobile-side of the QR-scan upload flow.
// The desktop /invoice page renders a QR code pointing to this page with a
// ?session=XYZ parameter. User scans QR with phone, lands here, photographs
// their invoice, taps Send. We mark the session as "complete" in localStorage.
//
// CROSS-DEVICE LIMITATION: localStorage is per-device, so the desktop browser
// won't actually see this completion. Real cross-device handoff requires a
// backend channel (Supabase Realtime, a polling API, or websockets). This is
// being tracked as the next big infrastructure piece.

export default function UploadPage() {
  const [sessionId, setSessionId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSessionId(params.get("session") || "DEMO");
  }, []);

  const pick = (f: File | undefined) => {
    if (!f) return;
    setFile(f);
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = e => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview("pdf");
    }
  };

  const send = () => {
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setSent(true);
      try {
        localStorage.setItem(`mcd_${sessionId}`, JSON.stringify({ done: true, fileName: file?.name }));
      } catch {}
    }, 1400);
  };

  return (
    <div className="min-h-screen flex flex-col bg-off-white">
      {/* Header */}
      <header className="bg-navy text-white px-5 py-4 flex items-center justify-between">
        <Logo href={null} variant="dark-bg" size="sm" />
        <span className="font-sans text-[10px] text-white/50 uppercase tracking-wider">Session · {sessionId}</span>
      </header>

      <main className="flex-1 px-5 py-8 max-w-md mx-auto w-full">
        {!sent ? (
          <>
            <div className="text-center mb-8">
              <span className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-teal block mb-3">Photograph your invoice</span>
              <h1 className="font-serif text-navy text-2xl leading-tight mb-3">Take a clear photo of your paper invoice.</h1>
              <p className="font-sans font-light text-gray-500 text-sm leading-relaxed">
                Make sure the line items are readable. We'll send it back to your desktop session to analyze.
              </p>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={e => pick(e.target.files?.[0])}
            />
            <input
              id="library-input"
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={e => pick(e.target.files?.[0])}
            />

            {!file ? (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => inputRef.current?.click()}
                  className="w-full bg-navy text-white font-sans text-base font-medium px-5 py-4 rounded-xl flex items-center justify-center gap-3 hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                  Open Camera
                </button>
                <button
                  onClick={() => (document.getElementById("library-input") as HTMLInputElement | null)?.click()}
                  className="w-full bg-white border border-gray-300 text-navy font-sans text-base px-5 py-4 rounded-xl hover:bg-off-white transition-colors cursor-pointer"
                >
                  Choose from Library
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {preview && preview !== "pdf" && (
                  <img src={preview} alt="" className="w-full rounded-xl border border-gray-200 max-h-[400px] object-cover" />
                )}
                {preview === "pdf" && (
                  <div className="bg-blue-pale border border-blue/20 rounded-xl p-5 text-center">
                    <div className="font-sans text-sm text-navy font-medium">📄 PDF</div>
                    <div className="font-sans text-xs text-gray-500 mt-1">{file.name}</div>
                  </div>
                )}
                <div className="text-center font-sans text-xs text-gray-500">{file.name}</div>
                <button
                  onClick={send}
                  disabled={busy}
                  className="w-full bg-teal text-white font-sans text-base font-medium px-5 py-4 rounded-xl hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-60"
                >
                  {busy ? "Sending…" : "Send to Desktop →"}
                </button>
                <button
                  onClick={() => { setFile(null); setPreview(null); }}
                  className="font-sans text-sm text-gray-500 underline bg-transparent border-none cursor-pointer"
                >
                  Retake
                </button>
              </div>
            )}

            <div className="mt-12 bg-white border border-gray-200 rounded-xl p-4">
              <div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">What we look for</div>
              <ul className="flex flex-col gap-1.5 font-sans text-sm text-navy">
                <li className="flex gap-2"><span className="text-teal">✓</span> Line items above industry-average rates</li>
                <li className="flex gap-2"><span className="text-teal">✓</span> Surcharges added outside your contract</li>
                <li className="flex gap-2"><span className="text-teal">✓</span> Pricing escalators applied above their cap</li>
              </ul>
            </div>
          </>
        ) : (
          <div className="text-center pt-12">
            <div className="w-20 h-20 rounded-full bg-teal-light text-teal flex items-center justify-center mx-auto mb-5 text-3xl">✓</div>
            <h2 className="font-serif text-navy text-2xl leading-tight mb-3">Sent.</h2>
            <p className="font-sans font-light text-gray-500 text-sm leading-relaxed mb-6">
              Your invoice is linked to session <strong className="text-navy">{sessionId}</strong>. Head back to your desktop browser — your analysis will appear there.
            </p>
            <button
              onClick={() => { setFile(null); setPreview(null); setSent(false); }}
              className="font-sans text-sm font-medium bg-white border border-gray-300 text-navy px-5 py-2.5 rounded-lg hover:bg-off-white transition-colors cursor-pointer"
            >
              Send another
            </button>
          </div>
        )}

        {/* Honest note about the prototype */}
        <div className="mt-12 bg-amber/10 border border-amber/30 rounded-xl p-4">
          <div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-amber-700 mb-1">Preview build</div>
          <p className="font-sans text-xs text-amber-700 leading-relaxed">
            Cross-device sync between phone and desktop isn't fully wired yet. For now your file stays on this device.
          </p>
        </div>
      </main>
    </div>
  );
}
