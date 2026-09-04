"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { createClient } from "@/lib/supabase/client";

const C = {
  navy:      "#0C2D54", navyDark:  "#081E38", blue: "#3D80C8",
  blueMid:   "#2563A8", blueLight: "#6AAEE0", bluePale: "#E2EEFA",
  teal:      "#17A882", tealLight: "#D4F2EA", white: "#FFFFFF",
  offWhite:  "#F7F9FC", gray100: "#F0F4F8",  gray200: "#E2E8F0",
  gray300:   "#CBD5E1", gray500: "#64748B",  gray700: "#334155",
  red: "#DC2626", amber: "#D97706",
};
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');`;
const MAX_INVOICE_BYTES = 25 * 1024 * 1024;
const ALLOWED_INVOICE_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic"]);

type PhoneInvoiceFile = {
  source: "phone";
  sessionId: string;
  storagePath: string;
  name: string;
  type: string;
  size: number;
};
type InvoiceSource = File | PhoneInvoiceFile;
type LeadCapture = { email: string; businessName: string; marketingConsent: boolean };
type PhoneSession = { sessionId: string; token: string; uploadUrl: string; expiresAt: string };

// ── primitives ──────────────────────────
function Tag({ children, variant="teal" }) {
  const m = { teal:{bg:C.tealLight,color:"#0D6E52"}, blue:{bg:C.bluePale,color:C.blueMid}, navy:{bg:C.navy,color:C.blueLight}, red:{bg:"#FEE2E2",color:C.red} };
  const s = m[variant]||m.teal;
  return <span style={{background:s.bg,color:s.color,fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,padding:"4px 12px",borderRadius:20,display:"inline-block"}}>{children}</span>;
}
function Btn({ children, onClick=()=>{}, variant="navy", full=false, size="md", disabled=false }) {
  const sz = { lg:{padding:"15px 32px",fontSize:16}, md:{padding:"12px 24px",fontSize:14}, sm:{padding:"8px 16px",fontSize:13} }[size];
  const th = { navy:{background:C.navy,color:"#fff",border:"none"}, teal:{background:C.teal,color:"#fff",border:"none",boxShadow:"0 4px 20px rgba(23,168,130,0.3)"}, blue:{background:C.blue,color:"#fff",border:"none"}, outline:{background:"transparent",color:C.navy,border:`1.5px solid ${C.navy}`}, ghost:{background:C.gray100,color:C.gray700,border:"none"} }[variant];
  return <button onClick={disabled?undefined:onClick} style={{...sz,...th,fontFamily:"'DM Sans',sans-serif",fontWeight:500,cursor:disabled?"not-allowed":"pointer",borderRadius:9,display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all 0.2s",opacity:disabled?0.5:1,width:full?"100%":"auto"}} onMouseEnter={e=>{if(!disabled)e.currentTarget.style.opacity="0.85"}} onMouseLeave={e=>{e.currentTarget.style.opacity="1"}}>{children}</button>;
}

// ── Nav ─────────────────────────────────
function Nav({ step }) {
  const steps = ["Upload","Email","Analyze","Confirm"];
  return (
    <nav style={{background:C.navy,padding:"0 32px",position:"sticky",top:0,zIndex:50,borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
      <div style={{maxWidth:1100,margin:"0 auto",height:64,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",flexDirection:"column",lineHeight:1}}>
          <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,fontWeight:600,letterSpacing:"0.22em",textTransform:"uppercase",color:C.blueLight}}>My</span>
          <div><span style={{fontFamily:"'DM Serif Display',serif",fontSize:20,color:"#fff"}}>Contract </span><span style={{fontFamily:"'DM Serif Display',serif",fontSize:20,fontStyle:"italic",color:C.blueLight}}>Doctors</span></div>
        </div>
        <div style={{display:"flex",alignItems:"center"}}>
          {steps.map((s,i)=>{
            const done=i<step, cur=i===step;
            return <div key={s} style={{display:"flex",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:26,height:26,borderRadius:"50%",background:done?C.teal:cur?C.blue:"rgba(255,255,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,fontFamily:"'DM Sans',sans-serif",color:done||cur?"#fff":"rgba(255,255,255,0.35)",transition:"all 0.4s"}}>{done?"✓":i+1}</div>
                <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:500,color:cur?"#fff":done?C.blueLight:"rgba(255,255,255,0.35)",transition:"color 0.3s"}}>{s}</span>
              </div>
              {i<steps.length-1&&<div style={{width:28,height:1,background:done?C.teal:"rgba(255,255,255,0.12)",margin:"0 10px",transition:"background 0.4s"}}/>}
            </div>;
          })}
        </div>
        <div style={{width:140}}/>
      </div>
    </nav>
  );
}

// ── STEP 0 — Upload ──────────────────────
function StepUpload({ onNext }) {
  const [method, setMethod] = useState<"desktop" | "phone">("desktop");
  const [dragging, setDragging]   = useState(false);
  const [file, setFile]           = useState(null);
  const [preview, setPreview]     = useState(null);
  const [fileError, setFileError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = f => {
    if(!f) return;
    setFileError("");
    if (!ALLOWED_INVOICE_TYPES.has(f.type)) {
      setFile(null);
      setPreview(null);
      setFileError("Choose a PDF, JPG, PNG, WEBP, or HEIC invoice.");
      return;
    }
    if (f.size < 1 || f.size > MAX_INVOICE_BYTES) {
      setFile(null);
      setPreview(null);
      setFileError("Choose a file smaller than 25 MB.");
      return;
    }
    setFile(f);
    if(f.type?.startsWith("image/")){ const r=new FileReader(); r.onload=e=>setPreview(e.target.result); r.readAsDataURL(f); }
    else setPreview("pdf");
  };

  return (
    <div style={{maxWidth:780,margin:"0 auto",padding:"52px 24px"}}>
      <div style={{textAlign:"center",marginBottom:38}}>
        <Tag variant="teal">First confirmed invoice opportunity free</Tag>
        <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(28px,4vw,44px)",color:C.navy,lineHeight:1.15,margin:"16px 0 12px"}}>Upload your invoice.<br/><em style={{fontStyle:"italic",color:C.blue}}>Confirm the charges. See where to look first.</em></h1>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:16,fontWeight:300,color:C.gray500,lineHeight:1.75,maxWidth:540,margin:"0 auto"}}>Upload a PDF or photo of your latest uniform invoice. We'll extract the line items, ask you to confirm the math, and show one evidence-backed opportunity when the required facts are available.</p>
      </div>

      {/* Method tabs */}
      <div style={{display:"flex",background:C.gray100,borderRadius:12,padding:4,marginBottom:26,gap:4}}>
        {[
          {key:"desktop", label:"📄  Upload a file",    sub:"PDF or image from this device"},
          {key:"phone",   label:"📱  Scan with phone",  sub:"Take a photo on your phone"},
        ].map(({key,label,sub})=>(
          <button key={key} onClick={() => { setMethod(key as "desktop" | "phone"); setFile(null); setPreview(null); setFileError(""); }} style={{flex:1,padding:"12px 16px",borderRadius:9,border:"none",cursor:"pointer",background:method===key?C.white:"transparent",boxShadow:method===key?"0 1px 6px rgba(12,45,84,0.08)":"none",textAlign:"center"}}>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:500,color:method===key?C.navy:C.gray500}}>{label}</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.gray500,marginTop:2}}>{sub}</div>
          </button>
        ))}
      </div>

      {/* ── Desktop upload ── */}
      {method === "desktop" ? <div onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)}
          onDrop={e=>{e.preventDefault();setDragging(false);handleFile(e.dataTransfer.files[0]);}}
          onClick={()=>!file&&inputRef.current?.click()}
          style={{border:`2px dashed ${dragging?C.teal:file?C.blue:C.gray300}`,borderRadius:18,padding:file?"32px":"52px 32px",textAlign:"center",background:dragging?C.tealLight:file?C.bluePale:C.offWhite,cursor:file?"default":"pointer",transition:"all 0.25s",marginBottom:20}}>
          <input ref={inputRef} type="file" accept="image/*,application/pdf" style={{display:"none"}} onChange={e=>handleFile(e.currentTarget.files?.[0])}/>
          {!file ? <>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{margin:"0 auto 14px",display:"block"}}><rect width="48" height="48" rx="12" fill={C.bluePale}/><path d="M24 30V18M24 18L19 23M24 18L29 23" stroke={C.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 34h16" stroke={C.blue} strokeWidth="2" strokeLinecap="round"/></svg>
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:20,color:C.navy,marginBottom:8}}>Drop your invoice here</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.gray500,marginBottom:18}}>PDF or image (JPG, PNG)</div>
            <Btn variant="outline" onClick={()=>inputRef.current?.click()}>Choose a file</Btn>
          </> : (
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
              {preview&&preview!=="pdf"?<Image src={preview} alt="Selected invoice preview" width={640} height={800} unoptimized style={{width:"auto",height:"auto",maxHeight:160,maxWidth:"100%",borderRadius:10,border:`1px solid ${C.gray200}`}}/>:<div style={{width:64,height:80,background:C.navy,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontFamily:"'DM Sans',sans-serif",fontSize:16,color:C.blueLight}}>PDF</span></div>}
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:17,color:C.navy}}>{file.name}</div>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <Tag variant="teal">✓ Ready to analyze</Tag>
                <button onClick={e=>{e.stopPropagation();setFile(null);setPreview(null);}} style={{background:"none",border:"none",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.gray500,cursor:"pointer",textDecoration:"underline"}}>Remove</button>
              </div>
            </div>
          )}
      </div> : <PhoneUpload onReady={setFile} onError={setFileError} />}

      {fileError && (
        <div role="alert" style={{background:"#FEE2E2",border:`1px solid ${C.red}`,borderRadius:9,padding:"11px 14px",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.red,marginBottom:20}}>
          {fileError}
        </div>
      )}

      {/* Vendors */}
      <div style={{textAlign:"center",marginBottom:26}}>
        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.gray500,marginBottom:10}}>Works with all major vendors</div>
        <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
          {["Cintas","UniFirst","ALSCO","Aramark","G&K Services","Other"].map(v=><span key={v} style={{background:C.white,border:`1px solid ${C.gray200}`,fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:500,color:C.gray700,padding:"5px 14px",borderRadius:20}}>{v}</span>)}
        </div>
      </div>

      <Btn variant="teal" full size="lg" disabled={!file} onClick={()=>onNext(file)}>Continue →</Btn>

      <div style={{display:"flex",justifyContent:"center",gap:28,marginTop:22,flexWrap:"wrap"}}>
        {[{icon:"🔒",text:"Private account storage"},{icon:"⚡",text:"Most files ready in a few minutes"},{icon:"✓",text:"You confirm before analysis"}].map(({icon,text})=>(
          <div key={text} style={{display:"flex",alignItems:"center",gap:7}}><span style={{fontSize:14}}>{icon}</span><span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.gray500}}>{text}</span></div>
        ))}
      </div>

    </div>
  );
}

function PhoneUpload({ onReady, onError }: { onReady: (file: PhoneInvoiceFile | null) => void; onError: (message: string) => void }) {
  const [session, setSession] = useState<PhoneSession | null>(null);
  const [starting, setStarting] = useState(true);
  const [status, setStatus] = useState("Creating a secure phone link…");

  useEffect(() => {
    let cancelled = false;
    let pollId: ReturnType<typeof setInterval> | null = null;
    void fetch("/api/invoices/upload-sessions", { method: "POST" })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "Phone upload could not be started.");
        if (cancelled) return;
        setSession(data);
        setStarting(false);
        setStatus("Scan this code with your phone, then take or choose a photo.");
        pollId = setInterval(async () => {
          try {
            const check = await fetch(`/api/invoices/upload-sessions/${data.sessionId}`, { headers: { "x-upload-token": data.token }, cache: "no-store" });
            const result = await check.json();
            if (!check.ok) throw new Error(result?.error || "Could not check the phone upload.");
            if (result.status === "uploaded" && result.file?.storagePath) {
              if (pollId) clearInterval(pollId);
              setStatus(`${result.file.name || "Invoice"} arrived from your phone.`);
              onReady({ source: "phone", sessionId: data.sessionId, storagePath: result.file.storagePath, name: result.file.name || "phone-invoice", type: result.file.type || "application/octet-stream", size: result.file.size || 0 });
            } else if (result.status === "expired") {
              if (pollId) clearInterval(pollId);
              setStatus("This phone link expired. Switch tabs and return to create a fresh link.");
            } else if (result.status === "failed") {
              if (pollId) clearInterval(pollId);
              setStatus("The phone upload failed. Switch tabs and try again.");
            } else if (result.status === "uploading") {
              setStatus("Your phone is sending the invoice…");
            }
          } catch (error) {
            if (pollId) clearInterval(pollId);
            onError(error instanceof Error ? error.message : "Could not check the phone upload.");
          }
        }, 1500);
      })
      .catch(error => {
        if (!cancelled) {
          setStarting(false);
          onError(error instanceof Error ? error.message : "Phone upload could not be started.");
        }
      });
    return () => { cancelled = true; if (pollId) clearInterval(pollId); };
  }, [onError, onReady]);

  return (
    <div style={{border:`2px dashed ${C.blue}`,borderRadius:18,padding:"34px 24px",textAlign:"center",background:C.bluePale,marginBottom:20,minHeight:300,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
      {starting || !session ? (
        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:C.gray500}}>{status}</div>
      ) : (
        <>
          <div style={{background:C.white,padding:14,borderRadius:14,lineHeight:0,marginBottom:16}}><QRCodeSVG value={session.uploadUrl} size={176} level="M" /></div>
          <div style={{fontFamily:"'DM Serif Display',serif",fontSize:20,color:C.navy,marginBottom:7}}>Open the camera on your phone</div>
          <div aria-live="polite" style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.gray500,maxWidth:430,lineHeight:1.55}}>{status}</div>
          <a href={session.uploadUrl} style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.blue,marginTop:12}}>Open this upload link on this device</a>
        </>
      )}
    </div>
  );
}

function StepLeadCapture({ onNext }: { onNext: (lead: LeadCapture) => void }) {
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const valid = /^\S+@\S+\.\S+$/.test(email.trim());

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    void supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user || cancelled) return;
      setEmail(user.email || "");
      const { data } = await supabase.from("profiles").select("business_name").eq("id", user.id).maybeSingle();
      if (!cancelled && data?.business_name) setBusinessName(data.business_name);
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <div style={{maxWidth:600,margin:"0 auto",padding:"64px 24px 90px"}}>
      <Tag variant="blue">Before we analyze</Tag>
      <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(28px,4vw,40px)",color:C.navy,lineHeight:1.18,margin:"16px 0 10px"}}>Where should we connect this invoice result?</h1>
      <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:300,color:C.gray500,lineHeight:1.7,marginBottom:26}}>We save the result to your account and use this email to associate the invoice, its finding categories, and the number of locked findings with your lead record.</p>
      <label style={{display:"block",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,color:C.navy,marginBottom:7}}>Email for this result</label>
      <input value={email} onChange={event=>setEmail(event.target.value)} type="email" autoComplete="email" style={{width:"100%",border:`1px solid ${C.gray300}`,borderRadius:9,padding:"12px 14px",fontFamily:"'DM Sans',sans-serif",fontSize:15,marginBottom:18}} />
      <label style={{display:"block",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,color:C.navy,marginBottom:7}}>Business name <span style={{fontWeight:400,color:C.gray500}}>(optional)</span></label>
      <input value={businessName} onChange={event=>setBusinessName(event.target.value)} autoComplete="organization" style={{width:"100%",border:`1px solid ${C.gray300}`,borderRadius:9,padding:"12px 14px",fontFamily:"'DM Sans',sans-serif",fontSize:15,marginBottom:18}} />
      <label style={{display:"flex",alignItems:"flex-start",gap:10,fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.gray700,lineHeight:1.5,marginBottom:24,cursor:"pointer"}}>
        <input type="checkbox" checked={marketingConsent} onChange={event=>setMarketingConsent(event.target.checked)} style={{marginTop:3}} />
        Send me occasional invoice-saving tips and relevant offers based on what this analysis finds. This is optional and does not affect my result.
      </label>
      <Btn variant="teal" full size="lg" disabled={!valid} onClick={()=>onNext({ email: email.trim().toLowerCase(), businessName: businessName.trim(), marketingConsent })}>Analyze my invoice →</Btn>
      <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.gray500,lineHeight:1.5,textAlign:"center",marginTop:14}}>Your analysis is stored in your account whether or not you opt into marketing.</p>
    </div>
  );
}

// ── STEP 2 — Scanning ────────────────────
function StepScanning({ file, lead }: { file: InvoiceSource | null; lead: LeadCapture | null }) {
  const router = useRouter();
  const [phase, setPhase]       = useState(0);
  const [progress, setProgress] = useState(0);
  const [errorState, setErrorState] = useState/* :null | { kind:string; ... } */(null);

  // All mutable state lives in refs to avoid stale closures entirely
  const started  = useRef(false);
  const progR    = useRef(0);       // single source of truth for progress value
  const phT      = useRef(null);
  const progT    = useRef(null);
  const finishT  = useRef(null);

  const PHASES = [
    "Uploading your invoice...",
    "Checking the document and pages...",
    "Reading line items and charges...",
    "Checking invoice totals...",
    "Preparing your invoice review...",
  ];
  const stopWaitingAnimation = () => {
    clearInterval(progT.current);
    clearInterval(phT.current);
  };

  useEffect(()=>{
    if (started.current) return;
    started.current = true;

    // Phase cycling
    let ph = 0;
    phT.current = setInterval(()=>{
      ph = Math.min(ph + 1, PHASES.length - 1);
      setPhase(ph);
    }, 1400);

    // This is an estimated progress animation, not server-reported progress.
    // Move quickly through the early work, then visibly slow-crawl toward 98.
    // Only a completed server response is allowed to set it to 100.
    progT.current = setInterval(()=>{
      if (progR.current < 88) {
        progR.current = Math.min(progR.current + Math.random() * 2.5 + 0.5, 88);
      } else {
        progR.current = Math.min(progR.current + (98 - progR.current) * 0.004, 98);
      }
      setProgress(progR.current);
    }, 120);

    // Real upload + AI extraction flow
    const runExtraction = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/sign-in?redirect=%2Finvoice");
          return;
        }
        if (!file || !lead) {
          stopWaitingAnimation();
          setErrorState({ kind: "upload_failed", message: "Choose the invoice and results email again." });
          return;
        }

        // Signed-in users always use the real extraction and review flow.
        {
          // 1) Desktop files are uploaded here. Phone files have already been
          // securely stored by the expiring upload session.
          let path: string;
          let uploadSessionId: string | undefined;
          if (file instanceof File) {
            const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
            path = `${user.id}/${Date.now()}-${safeName}`;
            const { error: upErr } = await supabase.storage
              .from("invoices")
              .upload(path, file, { contentType: file.type, upsert: false });
            if (upErr) {
              stopWaitingAnimation();
              setErrorState({ kind: "upload_failed", message: upErr.message });
              return;
            }
          } else {
            path = file.storagePath;
            uploadSessionId = file.sessionId;
          }

          // 2) Call extraction API
          const res = await fetch("/api/invoices/extract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              storage_path: path,
              bucket: "invoices",
              upload_session_id: uploadSessionId,
            }),
          });
          const data = await res.json();

          // 2a) Wrong document type — show specialized error UI
          if (res.status === 422 && data?.error === "wrong_document_type") {
            stopWaitingAnimation();
            setErrorState({
              kind: "wrong_document_type",
              detected: data.detected_type,
              reason: data.reason,
            });
            return;
          }

          if (!res.ok) {
            stopWaitingAnimation();
            setErrorState({
              kind: data?.error === "invoice_limit_reached" ? "invoice_limit_reached" : "extraction_failed",
              message: data?.message || data?.error || "Something went wrong analyzing this file.",
              code: data?.code,
              details: data?.details,
              hint: data?.hint,
            });
            return;
          }

          // 3) Connect the pre-results email and optional marketing consent to
          // the saved invoice. Result categories are added after confirmation.
          const leadResponse = await fetch(`/api/invoices/${data.invoice_id}/lead`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              stage: "capture",
              email: lead.email,
              businessName: lead.businessName || undefined,
              marketingConsent: lead.marketingConsent,
            }),
          });
          if (!leadResponse.ok) {
            stopWaitingAnimation();
            setErrorState({ kind: "lead_failed", invoiceId: data.invoice_id, message: "The invoice was analyzed, but we could not connect the results email. You can still open the saved review." });
            return;
          }

          // 4) Go to the real dashboard detail page. The customer confirms the
          // extraction there before findings are revealed.
          stopWaitingAnimation();
          setPhase(PHASES.length - 1);
          progR.current = 100;
          setProgress(100);
          finishT.current = setTimeout(() => {
            router.push(`/dashboard/invoices/${data.invoice_id}`);
          }, 300);
          return;
        }

      } catch (err: unknown) {
        console.error(err);
        stopWaitingAnimation();
        setErrorState({
          kind: "extraction_failed",
          message: err instanceof Error ? err.message : "Something went wrong.",
        });
      }
    };

    runExtraction();

    return () => {
      clearInterval(phT.current);
      clearInterval(progT.current);
      clearInterval(finishT.current);
    };
  }, []); // eslint-disable-line

  // ── Error states ──────────────────────
  if (errorState?.kind === "wrong_document_type") {
    const labelMap = {
      agreement: "service contract or agreement",
      statement: "statement (not a per-period invoice)",
      "purchase-order": "purchase order",
      receipt: "receipt",
      other: "different kind of document",
    };
    const detected = labelMap[errorState.detected] || "different kind of document";
    return (
      <div style={{maxWidth:560,margin:"0 auto",padding:"80px 24px",textAlign:"center"}}>
        <div style={{width:80,height:80,borderRadius:20,background:"#FEF3C7",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 28px"}}>
          <span style={{fontSize:38}}>📋</span>
        </div>
        <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:28,color:C.navy,marginBottom:10,lineHeight:1.2}}>This looks like a {detected}.</h2>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:300,color:C.gray500,marginBottom:8,lineHeight:1.65}}>The invoice analyzer is built for periodic bills with line items and totals. The file you uploaded looks like something different.</p>
        {errorState.reason && (
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.gray500,marginBottom:24,fontStyle:"italic"}}>
            What we saw: {errorState.reason}
          </p>
        )}
        {errorState.detected === "agreement" && (
          <a href="/agreement" style={{display:"inline-block",background:C.teal,color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:500,padding:"12px 28px",borderRadius:9,textDecoration:"none",marginBottom:14}}>
            Analyze as a contract instead →
          </a>
        )}
        <div style={{marginTop:8}}>
          <a href="/invoice" style={{display:"inline-block",background:C.white,color:C.navy,border:`1px solid ${C.gray300}`,fontFamily:"'DM Sans',sans-serif",fontSize:13,padding:"10px 22px",borderRadius:9,textDecoration:"none"}}>
            Upload a different file
          </a>
        </div>
      </div>
    );
  }

  if (errorState?.kind === "upload_failed" || errorState?.kind === "extraction_failed") {
    return (
      <div style={{maxWidth:520,margin:"0 auto",padding:"80px 24px",textAlign:"center"}}>
        <div style={{width:80,height:80,borderRadius:20,background:"#FEE2E2",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 28px"}}>
          <span style={{fontSize:38}}>⚠</span>
        </div>
        <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:26,color:C.navy,marginBottom:10,lineHeight:1.2}}>We couldn't read this file.</h2>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:300,color:C.gray500,marginBottom:6,lineHeight:1.65}}>
          {errorState.kind === "upload_failed" ? "The file couldn't be uploaded." : "Something went wrong analyzing this file."}
        </p>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.gray500,marginBottom:8,fontStyle:"italic"}}>{errorState.message}</p>
        {(errorState.code || errorState.hint || errorState.details) && (
          <pre style={{fontFamily:"monospace",fontSize:11,color:C.gray500,marginBottom:24,background:C.gray100,padding:"10px 14px",borderRadius:6,textAlign:"left",whiteSpace:"pre-wrap",wordBreak:"break-word"}}>
            {[
              errorState.code   ? `code: ${errorState.code}`     : null,
              errorState.hint   ? `hint: ${errorState.hint}`     : null,
              errorState.details? `details: ${errorState.details}` : null,
            ].filter(Boolean).join("\n")}
          </pre>
        )}
        <a href="/invoice" style={{display:"inline-block",background:C.navy,color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:500,padding:"12px 28px",borderRadius:9,textDecoration:"none"}}>
          Try again
        </a>
      </div>
    );
  }

  if (errorState?.kind === "invoice_limit_reached") {
    return (
      <div style={{maxWidth:560,margin:"0 auto",padding:"80px 24px",textAlign:"center"}}>
        <div style={{width:80,height:80,borderRadius:20,background:C.bluePale,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 28px",fontSize:34}}>▤</div>
        <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:28,color:C.navy,marginBottom:10,lineHeight:1.2}}>Your current invoice allowance is used.</h2>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:300,color:C.gray500,marginBottom:24,lineHeight:1.65}}>{errorState.message}</p>
        <div style={{display:"flex",justifyContent:"center",gap:12,flexWrap:"wrap"}}>
          <Link href="/checkout/pro" style={{display:"inline-block",background:C.teal,color:C.white,fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:600,padding:"12px 24px",borderRadius:9,textDecoration:"none"}}>Preview Pro checkout →</Link>
          <Link href="/dashboard/invoices" style={{display:"inline-block",background:C.white,color:C.navy,border:`1px solid ${C.gray300}`,fontFamily:"'DM Sans',sans-serif",fontSize:14,padding:"11px 24px",borderRadius:9,textDecoration:"none"}}>View saved invoices</Link>
        </div>
      </div>
    );
  }

  if (errorState?.kind === "lead_failed") {
    return (
      <div style={{maxWidth:560,margin:"0 auto",padding:"80px 24px",textAlign:"center"}}>
        <div style={{width:80,height:80,borderRadius:20,background:"#FEF3C7",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 28px",fontSize:34}}>✉</div>
        <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:28,color:C.navy,marginBottom:10}}>Your invoice review is saved.</h2>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:C.gray500,lineHeight:1.65,marginBottom:24}}>{errorState.message}</p>
        <Link href={`/dashboard/invoices/${errorState.invoiceId}`} style={{display:"inline-block",background:C.navy,color:C.white,fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:500,padding:"12px 28px",borderRadius:9,textDecoration:"none"}}>Open the invoice review →</Link>
      </div>
    );
  }

  return (
    <div style={{maxWidth:500,margin:"0 auto",padding:"80px 24px",textAlign:"center"}}>
      <div style={{width:80,height:80,borderRadius:20,background:C.navy,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 28px",animation:"pulse 2s ease-in-out infinite"}}>
        <svg width="44" height="44" viewBox="0 0 54 54" fill="none"><rect x="13" y="10" width="22" height="28" rx="3" fill="none" stroke="#fff" strokeWidth="1.8"/><line x1="18" y1="17" x2="30" y2="17" stroke={C.blueLight} strokeWidth="1.4" strokeLinecap="round"/><line x1="18" y1="21" x2="30" y2="21" stroke={C.blueLight} strokeWidth="1.4" strokeLinecap="round"/><line x1="18" y1="25" x2="26" y2="25" stroke={C.blueLight} strokeWidth="1.4" strokeLinecap="round"/><path d="M35 22 Q44 22 44 31 Q44 40 37 40" stroke={C.teal} strokeWidth="2" fill="none" strokeLinecap="round"/><circle cx="34.5" cy="41" r="3" fill={C.teal}/><circle cx="34.5" cy="41" r="1.2" fill={C.navy}/></svg>
      </div>
      <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:30,color:C.navy,marginBottom:8}}>Analyzing your invoice...</h2>
      <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:300,color:C.gray500,marginBottom:34,minHeight:24}}>{PHASES[phase]}</p>
      <div style={{background:C.gray200,borderRadius:8,height:8,marginBottom:10,overflow:"hidden"}}>
        <div style={{height:"100%",borderRadius:8,background:`linear-gradient(90deg,${C.blue},${C.teal})`,width:`${Math.round(progress)}%`,transition:"width 0.3s ease"}}/>
      </div>
      <div aria-live="polite" style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.gray500,marginBottom:44,minHeight:18}}>
        {progress >= 88 && progress < 100
          ? `About ${Math.round(progress)}% complete · Still working — larger files can take a little longer.`
          : progress >= 100
            ? "100% complete · Opening your invoice review..."
            : `About ${Math.round(progress)}% complete`}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12,textAlign:"left"}}>
        {PHASES.map((p,i)=>(
          <div key={p} style={{display:"flex",alignItems:"center",gap:12,opacity:i<=phase?1:0.28,transition:"opacity 0.4s"}}>
            <div style={{width:22,height:22,borderRadius:"50%",flexShrink:0,background:i<phase?C.teal:i===phase?C.blue:C.gray200,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",fontWeight:600,fontFamily:"'DM Sans',sans-serif",transition:"background 0.4s"}}>{i<phase?"✓":i+1}</div>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:i<=phase?C.navy:C.gray500}}>{p}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Root ─────────────────────────────────
export default function InvoicePage() {
  const [authState, setAuthState] = useState<"signed-in" | "signed-out">("signed-out");
  const [step, setStep]       = useState(0);
  const [file, setFile]       = useState<InvoiceSource | null>(null);
  const [lead, setLead]       = useState<LeadCapture | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    void supabase.auth.getUser()
      .then(({ data: { user } }) => {
        if (!cancelled) setAuthState(user ? "signed-in" : "signed-out");
      })
      .catch(() => {
        if (!cancelled) setAuthState("signed-out");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <style>{`
        ${FONTS}
        *,*::before,*::after{box-sizing:border-box;}
        body{background:${C.offWhite};}
        @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(61,128,200,0.35)}50%{box-shadow:0 0 0 18px rgba(61,128,200,0)}}
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes popIn{from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)}}
      `}</style>
      <Nav step={step}/>
      {authState === "signed-out" && <InvoiceAccountGate />}
      {authState === "signed-in" && <>
        {step===0 && <StepUpload onNext={f=>{setFile(f);setStep(1);}}/>}
        {step===1 && <StepLeadCapture onNext={value=>{setLead(value);setStep(2);}}/>}
        {step===2 && <StepScanning file={file} lead={lead}/>}
      </>}
    </>
  );
}

function InvoiceAccountGate() {
  return (
    <div style={{maxWidth:720,margin:"0 auto",padding:"64px 24px 90px",textAlign:"center"}}>
      <Tag variant="teal">First confirmed invoice opportunity free</Tag>
      <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(30px,4vw,44px)",color:C.navy,lineHeight:1.15,margin:"18px 0 12px"}}>Your invoice analysis belongs in a secure account.</h1>
      <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:16,fontWeight:300,color:C.gray500,lineHeight:1.75,maxWidth:560,margin:"0 auto 26px"}}>Create a free account or sign in before choosing your file. That keeps the original invoice, your corrections, and your saved result tied to you from upload through review.</p>
      <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
        <Link href="/sign-up?redirect=%2Finvoice" style={{background:C.teal,color:C.white,fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:600,padding:"13px 24px",borderRadius:9,textDecoration:"none"}}>Create free account →</Link>
        <Link href="/sign-in?redirect=%2Finvoice" style={{background:C.white,color:C.navy,border:`1.5px solid ${C.navy}`,fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:500,padding:"12px 24px",borderRadius:9,textDecoration:"none"}}>Sign in</Link>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginTop:34,textAlign:"left"}}>
        {["Upload one PDF or photo","Confirm every charge and total","See one verified opportunity free"].map((text,index) => (
          <div key={text} style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,padding:"16px 18px",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.gray700,lineHeight:1.5}}><strong style={{color:C.teal,marginRight:7}}>{index + 1}.</strong>{text}</div>
        ))}
      </div>
    </div>
  );
}
