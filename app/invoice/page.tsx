"use client";
import { useState, useRef, useEffect } from "react";

const C = {
  navy:      "#0C2D54", navyDark:  "#081E38", blue: "#3D80C8",
  blueMid:   "#2563A8", blueLight: "#6AAEE0", bluePale: "#E2EEFA",
  teal:      "#17A882", tealLight: "#D4F2EA", white: "#FFFFFF",
  offWhite:  "#F7F9FC", gray100: "#F0F4F8",  gray200: "#E2E8F0",
  gray300:   "#CBD5E1", gray500: "#64748B",  gray700: "#334155",
  red: "#DC2626", amber: "#D97706",
};
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');`;
const mkId  = () => Math.random().toString(36).slice(2,10).toUpperCase();

// ── primitives ──────────────────────────
function Tag({ children, variant="teal" }) {
  const m = { teal:{bg:C.tealLight,color:"#0D6E52"}, blue:{bg:C.bluePale,color:C.blueMid}, navy:{bg:C.navy,color:C.blueLight}, red:{bg:"#FEE2E2",color:C.red} };
  const s = m[variant]||m.teal;
  return <span style={{background:s.bg,color:s.color,fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,padding:"4px 12px",borderRadius:20,display:"inline-block"}}>{children}</span>;
}
function Eyebrow({ children, color=C.blue }) {
  return <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,letterSpacing:"0.16em",textTransform:"uppercase",color,marginBottom:10}}>{children}</div>;
}
function Btn({ children, onClick, variant="navy", full=false, size="md", disabled=false }) {
  const sz = { lg:{padding:"15px 32px",fontSize:16}, md:{padding:"12px 24px",fontSize:14}, sm:{padding:"8px 16px",fontSize:13} }[size];
  const th = { navy:{background:C.navy,color:"#fff",border:"none"}, teal:{background:C.teal,color:"#fff",border:"none",boxShadow:"0 4px 20px rgba(23,168,130,0.3)"}, blue:{background:C.blue,color:"#fff",border:"none"}, outline:{background:"transparent",color:C.navy,border:`1.5px solid ${C.navy}`}, ghost:{background:C.gray100,color:C.gray700,border:"none"} }[variant];
  return <button onClick={disabled?undefined:onClick} style={{...sz,...th,fontFamily:"'DM Sans',sans-serif",fontWeight:500,cursor:disabled?"not-allowed":"pointer",borderRadius:9,display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all 0.2s",opacity:disabled?0.5:1,width:full?"100%":"auto"}} onMouseEnter={e=>{if(!disabled)e.currentTarget.style.opacity="0.85"}} onMouseLeave={e=>{e.currentTarget.style.opacity="1"}}>{children}</button>;
}

// ── Nav ─────────────────────────────────
function Nav({ step }) {
  const steps = ["Upload","Your Info","Scanning","Results"];
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

// ── QR code (pure SVG pattern) ───────────
function QRCode({ sessionId, size=160 }) {
  // Static finder-pattern QR visual — in production replace with qrcode.js
  const cell = size/21;
  const pat = [
    [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,1,0,1,0,0,1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,0,1,1,0,0,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,1,1,0,1,1,0,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0],
    [1,0,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,0,1,0],
    [0,1,0,0,1,0,0,0,1,0,0,1,0,0,0,1,0,0,1,0,1],
    [1,1,1,0,1,1,1,1,0,1,0,0,1,1,0,1,1,0,1,1,0],
    [0,0,1,0,0,1,0,0,1,0,1,0,0,1,1,0,0,1,0,0,1],
    [1,0,0,1,1,0,1,0,0,1,0,1,0,0,0,1,0,0,1,0,1],
    [0,0,0,0,0,0,0,0,1,1,0,0,1,0,1,0,1,0,0,1,0],
    [1,1,1,1,1,1,1,0,0,0,1,1,0,1,0,1,0,0,1,0,1],
    [1,0,0,0,0,0,1,0,1,0,0,1,1,0,1,1,0,1,0,1,0],
    [1,0,1,1,1,0,1,0,0,1,0,0,0,1,0,0,1,0,1,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,0,0,1,0,1,0],
    [1,0,1,1,1,0,1,0,0,1,0,1,0,1,0,1,0,0,1,0,1],
    [1,0,0,0,0,0,1,0,1,0,1,0,1,0,1,0,1,0,0,1,0],
    [1,1,1,1,1,1,1,0,0,1,0,1,0,1,0,1,0,1,0,0,1],
  ];
  const rects = pat.flatMap((row,r)=>row.map((v,c)=>v?`<rect x="${c*cell}" y="${r*cell}" width="${cell-0.5}" height="${cell-0.5}" fill="${C.navy}" rx="0.4"/>`:"")).join("");
  return (
    <div style={{background:"#fff",padding:14,borderRadius:12,border:`2px solid ${C.bluePale}`,display:"inline-block",boxShadow:"0 4px 20px rgba(12,45,84,0.08)"}}>
      <div dangerouslySetInnerHTML={{__html:`<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg"><rect width="${size}" height="${size}" fill="white"/>${rects}</svg>`}}/>
      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:C.gray500,textAlign:"center",marginTop:8,letterSpacing:"0.1em"}}>SESSION · {sessionId}</div>
    </div>
  );
}

// ── Mobile phone simulator ───────────────
function MobileView({ sessionId, onUploaded }) {
  const [mFile, setMFile]     = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy]       = useState(false);
  const [sent, setSent]       = useState(false);
  const inputRef = useRef();

  const pick = f => {
    if(!f) return;
    setMFile(f);
    const r = new FileReader(); r.onload=e=>setPreview(e.target.result); r.readAsDataURL(f);
  };
  const send = () => {
    setBusy(true);
    setTimeout(()=>{
      setBusy(false); setSent(true);
      try { localStorage.setItem(`mcd_${sessionId}`,JSON.stringify({done:true,fileName:mFile.name})); } catch{}
      setTimeout(()=>onUploaded(mFile), 700);
    }, 1600);
  };

  return (
    <div style={{width:300,background:C.offWhite,borderRadius:22,overflow:"hidden",boxShadow:"0 24px 60px rgba(12,45,84,0.22)",border:`6px solid ${C.navyDark}`}}>
      {/* status bar */}
      <div style={{background:C.navy,padding:"8px 18px 6px",display:"flex",justifyContent:"space-between"}}>
        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"rgba(255,255,255,0.6)"}}>9:41</span>
        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"rgba(255,255,255,0.6)"}}>●●● WiFi 100%</span>
      </div>
      {/* mini nav */}
      <div style={{background:C.navy,padding:"6px 16px 12px",textAlign:"center",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
        <div style={{fontFamily:"'DM Serif Display',serif",fontSize:15,color:"#fff"}}>Contract <span style={{fontStyle:"italic",color:C.blueLight}}>Doctors</span></div>
        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:"rgba(255,255,255,0.45)",marginTop:1}}>mycontractdoctors.com/upload?session={sessionId}</div>
      </div>
      <div style={{padding:"18px 16px"}}>
        {!sent ? <>
          <div style={{textAlign:"center",marginBottom:16}}>
            <Tag variant="blue">Session #{sessionId}</Tag>
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:18,color:C.navy,margin:"10px 0 6px",lineHeight:1.2}}>Scan your invoice</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.gray500,lineHeight:1.6}}>Take a clear photo of your paper invoice and send it to your desktop session.</div>
          </div>
          <input ref={inputRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>pick(e.target.files[0])}/>
          {!mFile ? <>
            <button onClick={()=>inputRef.current.click()} style={{width:"100%",padding:"14px",borderRadius:10,background:C.navy,color:"#fff",border:"none",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:8}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="#fff" strokeWidth="2" fill="none"/><circle cx="12" cy="13" r="4" stroke="#fff" strokeWidth="2"/></svg>
              Open Camera
            </button>
            <button onClick={()=>{const i=document.createElement("input");i.type="file";i.accept="image/*,application/pdf";i.onchange=e=>pick(e.target.files[0]);i.click();}} style={{width:"100%",padding:"11px",borderRadius:10,background:C.offWhite,color:C.gray700,border:`1px solid ${C.gray300}`,fontFamily:"'DM Sans',sans-serif",fontSize:13,cursor:"pointer"}}>
              Choose from Library
            </button>
          </> : <>
            {preview&&<img src={preview} alt="" style={{width:"100%",borderRadius:8,marginBottom:10,maxHeight:150,objectFit:"cover",border:`1px solid ${C.gray200}`}}/>}
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.gray500,textAlign:"center",marginBottom:10}}>{mFile.name}</div>
            <Btn variant="teal" full onClick={send} disabled={busy}>
              {busy?<span style={{display:"flex",alignItems:"center",gap:8}}><span style={{width:13,height:13,border:"2px solid rgba(255,255,255,0.4)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite"}}/>Sending...</span>:"Send to Desktop →"}
            </Btn>
            <button onClick={()=>{setMFile(null);setPreview(null);}} style={{marginTop:8,width:"100%",background:"none",border:"none",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.gray500,cursor:"pointer",textDecoration:"underline"}}>Retake</button>
          </>}
        </> : (
          <div style={{textAlign:"center",padding:"16px 0"}}>
            <div style={{width:52,height:52,borderRadius:"50%",background:C.tealLight,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",fontSize:24}}>✓</div>
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:18,color:C.navy,marginBottom:6}}>Sent!</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.gray500,lineHeight:1.6}}>Your invoice is linked to your desktop session. You can close this tab.</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── STEP 0 — Upload ──────────────────────
function StepUpload({ onNext }) {
  const [method, setMethod]       = useState("desktop");
  const [dragging, setDragging]   = useState(false);
  const [file, setFile]           = useState(null);
  const [preview, setPreview]     = useState(null);
  const [sessionId]               = useState(mkId);
  const [mobileLinked, setLinked] = useState(false);
  const [showDemo, setShowDemo]   = useState(false);
  const inputRef = useRef();
  const pollRef  = useRef();

  // Poll localStorage for mobile completion
  useEffect(()=>{
    if(method!=="qr") return;
    pollRef.current = setInterval(()=>{
      try {
        const raw = localStorage.getItem(`mcd_${sessionId}`);
        if(raw){ const d=JSON.parse(raw); if(d.done){ clearInterval(pollRef.current); setLinked(true); setFile({name:d.fileName||"invoice-mobile.jpg",size:200000,type:"image/jpeg",mobile:true}); }}
      } catch{}
    }, 700);
    return ()=>clearInterval(pollRef.current);
  },[method, sessionId]);

  const handleFile = f => {
    if(!f) return; setFile(f);
    if(f.type?.startsWith("image/")){ const r=new FileReader(); r.onload=e=>setPreview(e.target.result); r.readAsDataURL(f); }
    else setPreview("pdf");
  };

  const vendors = ["Cintas","UniFirst","ALSCO","Aramark","G&K Services","Other"];

  return (
    <div style={{maxWidth:780,margin:"0 auto",padding:"52px 24px"}}>
      <div style={{textAlign:"center",marginBottom:38}}>
        <Tag variant="teal">Free — no credit card required</Tag>
        <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(28px,4vw,44px)",color:C.navy,lineHeight:1.15,margin:"16px 0 12px"}}>Upload your invoice.<br/><em style={{fontStyle:"italic",color:C.blue}}>Get your first saving instantly.</em></h1>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:16,fontWeight:300,color:C.gray500,lineHeight:1.75,maxWidth:500,margin:"0 auto"}}>Upload a PDF or photo of your latest uniform invoice. We'll analyze it and give you one free recommendation right away.</p>
      </div>

      {/* Method tabs */}
      <div style={{display:"flex",background:C.gray100,borderRadius:12,padding:4,marginBottom:26,gap:4}}>
        {[
          {key:"desktop", label:"📄  Upload a file",    sub:"PDF or image from this device"},
          {key:"qr",      label:"📱  Scan with phone",  sub:"Paper invoice? Use your camera"},
        ].map(({key,label,sub})=>(
          <button key={key} onClick={()=>{setMethod(key);setFile(null);setPreview(null);setLinked(false);}} style={{flex:1,padding:"12px 16px",borderRadius:9,border:"none",cursor:"pointer",background:method===key?C.white:"transparent",boxShadow:method===key?"0 1px 6px rgba(12,45,84,0.08)":"none",transition:"all 0.2s",textAlign:"center"}}>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:500,color:method===key?C.navy:C.gray500}}>{label}</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.gray500,marginTop:2}}>{sub}</div>
          </button>
        ))}
      </div>

      {/* ── Desktop upload ── */}
      {method==="desktop" && (
        <div onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)}
          onDrop={e=>{e.preventDefault();setDragging(false);handleFile(e.dataTransfer.files[0]);}}
          onClick={()=>!file&&inputRef.current.click()}
          style={{border:`2px dashed ${dragging?C.teal:file?C.blue:C.gray300}`,borderRadius:18,padding:file?"32px":"52px 32px",textAlign:"center",background:dragging?C.tealLight:file?C.bluePale:C.offWhite,cursor:file?"default":"pointer",transition:"all 0.25s",marginBottom:20}}>
          <input ref={inputRef} type="file" accept="image/*,application/pdf" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>
          {!file ? <>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{margin:"0 auto 14px",display:"block"}}><rect width="48" height="48" rx="12" fill={C.bluePale}/><path d="M24 30V18M24 18L19 23M24 18L29 23" stroke={C.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 34h16" stroke={C.blue} strokeWidth="2" strokeLinecap="round"/></svg>
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:20,color:C.navy,marginBottom:8}}>Drop your invoice here</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.gray500,marginBottom:18}}>PDF or image (JPG, PNG)</div>
            <Btn variant="outline" onClick={e=>{e.stopPropagation();inputRef.current.click();}}>Choose a file</Btn>
          </> : (
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
              {preview&&preview!=="pdf"?<img src={preview} alt="" style={{maxHeight:160,maxWidth:"100%",borderRadius:10,border:`1px solid ${C.gray200}`}}/>:<div style={{width:64,height:80,background:C.navy,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontFamily:"'DM Sans',sans-serif",fontSize:16,color:C.blueLight}}>PDF</span></div>}
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:17,color:C.navy}}>{file.name}</div>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <Tag variant="teal">✓ Ready to analyze</Tag>
                <button onClick={e=>{e.stopPropagation();setFile(null);setPreview(null);}} style={{background:"none",border:"none",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.gray500,cursor:"pointer",textDecoration:"underline"}}>Remove</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── QR mobile handoff ── */}
      {method==="qr" && (
        <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:18,overflow:"hidden",marginBottom:20}}>
          {!mobileLinked ? (
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr"}}>
              {/* Left — QR */}
              <div style={{padding:"36px 32px",borderRight:`1px solid ${C.gray200}`}}>
                <Eyebrow color={C.teal}>Step 1</Eyebrow>
                <div style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:C.navy,marginBottom:10,lineHeight:1.2}}>Scan this QR code with your phone</div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.gray500,lineHeight:1.7,marginBottom:22}}>Your camera app will open a mobile-optimized page where you can photograph your paper invoice — it'll link automatically to this session.</div>
                <QRCode sessionId={sessionId} size={148}/>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.gray500,marginTop:12}}>QR code expires in 30 minutes</div>
              </div>
              {/* Right — waiting */}
              <div style={{padding:"36px 32px",background:C.offWhite,display:"flex",flexDirection:"column"}}>
                <Eyebrow color={C.navy}>Step 2</Eyebrow>
                <div style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:C.navy,marginBottom:18,lineHeight:1.2}}>Photograph & send from your phone</div>
                <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:28}}>
                  {["Open your camera and scan the QR code","Tap 'Open Camera' on the page that loads","Photograph your paper invoice clearly","Tap 'Send to Desktop' — this page updates automatically"].map((t,i)=>(
                    <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                      <div style={{width:24,height:24,borderRadius:"50%",background:C.navy,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,color:"#fff"}}>{i+1}</div>
                      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.gray700,lineHeight:1.6,paddingTop:2}}>{t}</div>
                    </div>
                  ))}
                </div>
                {/* Waiting dots */}
                <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,padding:"14px 18px",display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
                  <div style={{display:"flex",gap:4,flexShrink:0}}>
                    {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:C.blue,animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}
                  </div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.gray700}}>Waiting for your phone upload...</div>
                </div>
                {/* Demo button */}
                <button onClick={()=>setShowDemo(true)} style={{background:"none",border:`1px dashed ${C.gray300}`,borderRadius:8,padding:"10px 14px",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.gray500,cursor:"pointer",display:"flex",alignItems:"center",gap:6,justifyContent:"center"}}>
                  <span style={{fontSize:14}}>👀</span> Preview the mobile experience
                </button>
              </div>
            </div>
          ) : (
            <div style={{padding:"40px",textAlign:"center"}}>
              <div style={{width:64,height:64,borderRadius:"50%",background:C.tealLight,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:28}}>✓</div>
              <Tag variant="teal">Phone upload received</Tag>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:26,color:C.navy,margin:"14px 0 8px"}}>Invoice linked from your phone</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:C.gray500,marginBottom:6}}><strong>{file?.name}</strong> received from session <strong>{sessionId}</strong></div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.gray500,marginBottom:20}}>Your phone can be put away — everything continues here on desktop.</div>
              <Tag variant="blue">Ready to analyze</Tag>
            </div>
          )}
        </div>
      )}

      {/* Vendors */}
      <div style={{textAlign:"center",marginBottom:26}}>
        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.gray500,marginBottom:10}}>Works with all major vendors</div>
        <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
          {["Cintas","UniFirst","ALSCO","Aramark","G&K Services","Other"].map(v=><span key={v} style={{background:C.white,border:`1px solid ${C.gray200}`,fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:500,color:C.gray700,padding:"5px 14px",borderRadius:20}}>{v}</span>)}
        </div>
      </div>

      <Btn variant="teal" full size="lg" disabled={!file} onClick={()=>onNext(file)}>Continue — Enter Your Info →</Btn>

      <div style={{display:"flex",justifyContent:"center",gap:28,marginTop:22,flexWrap:"wrap"}}>
        {[{icon:"🔒",text:"Encrypted & never shared"},{icon:"⚡",text:"Results in under 2 minutes"},{icon:"💰",text:"First recommendation free"}].map(({icon,text})=>(
          <div key={text} style={{display:"flex",alignItems:"center",gap:7}}><span style={{fontSize:14}}>{icon}</span><span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.gray500}}>{text}</span></div>
        ))}
      </div>

      {/* Mobile demo modal */}
      {showDemo && (
        <div style={{position:"fixed",inset:0,zIndex:999,background:"rgba(8,30,56,0.8)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",padding:24,flexDirection:"column",gap:20}} onClick={e=>{if(e.target===e.currentTarget)setShowDemo(false);}}>
          <div style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:"#fff",textAlign:"center"}}>Mobile upload experience</div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"rgba(255,255,255,0.6)",textAlign:"center",marginBottom:4}}>This is what your customer sees after scanning the QR code</div>
          <MobileView sessionId={sessionId} onUploaded={f=>{setShowDemo(false);setLinked(true);setFile(f);setMethod("qr");}}/>
          <button onClick={()=>setShowDemo(false)} style={{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.3)",color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:13,padding:"8px 20px",borderRadius:8,cursor:"pointer"}}>Close preview</button>
        </div>
      )}
    </div>
  );
}

// ── STEP 1 — Contact ─────────────────────
function StepContact({ onNext, onBack }) {
  const [form, setForm] = useState({name:"",email:"",phone:"",business:"",vendor:"",frequency:""});
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
  const valid = form.name.trim()&&form.email.trim()&&form.business.trim();
  const iSt = {width:"100%",padding:"12px 14px",borderRadius:8,border:`1.5px solid ${C.gray300}`,fontFamily:"'DM Sans',sans-serif",fontSize:14,color:C.navy,background:C.white,outline:"none",transition:"border-color 0.2s"};
  const lSt = {fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,color:C.gray700,marginBottom:6,display:"block"};
  const fo = e=>{ e.target.style.borderColor=C.blue; };
  const bl = e=>{ e.target.style.borderColor=C.gray300; };
  const selBg=`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748B' stroke-width='1.5' fill='none'/%3E%3C/svg%3E") no-repeat right 14px center`;

  return (
    <div style={{maxWidth:640,margin:"0 auto",padding:"52px 24px"}}>
      <div style={{marginBottom:30}}>
        <Tag variant="blue">Step 2 of 4</Tag>
        <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:34,color:C.navy,margin:"14px 0 8px"}}>Tell us about your business</h2>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:300,color:C.gray500,lineHeight:1.7}}>We use this to personalize your analysis and send your free recommendation.</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18}}>
        {[{k:"name",l:"Full name *",p:"Jane Smith",t:"text"},{k:"business",l:"Business name *",p:"Acme Restaurant Group",t:"text"},{k:"email",l:"Email address *",p:"jane@acme.com",t:"email"},{k:"phone",l:"Phone number",p:"(555) 000-0000",t:"tel"}].map(({k,l,p,t})=>(
          <div key={k}><label style={lSt}>{l}</label><input style={iSt} type={t} placeholder={p} value={form[k]} onChange={set(k)} onFocus={fo} onBlur={bl}/></div>
        ))}
        <div><label style={lSt}>Vendor</label><select style={{...iSt,background:`${C.white} ${selBg}`,appearance:"none"}} value={form.vendor} onChange={set("vendor")} onFocus={fo} onBlur={bl}><option value="">Select...</option>{["Cintas","UniFirst","ALSCO","Aramark","G&K Services","Other"].map(v=><option key={v}>{v}</option>)}</select></div>
        <div><label style={lSt}>Invoice frequency</label><select style={{...iSt,background:`${C.white} ${selBg}`,appearance:"none"}} value={form.frequency} onChange={set("frequency")} onFocus={fo} onBlur={bl}><option value="">Select...</option>{["Weekly","Bi-weekly","Monthly"].map(f=><option key={f}>{f}</option>)}</select></div>
      </div>
      <div style={{background:C.offWhite,border:`1px solid ${C.gray200}`,borderRadius:10,padding:"13px 16px",marginBottom:26,display:"flex",gap:12,alignItems:"flex-start"}}>
        <input type="checkbox" defaultChecked style={{marginTop:2,accentColor:C.teal,flexShrink:0,cursor:"pointer"}}/>
        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.gray500,lineHeight:1.6}}>Send me my savings report by email and keep me updated on ways to reduce my uniform costs. Unsubscribe anytime.</span>
      </div>
      <div style={{display:"flex",gap:12}}>
        <Btn variant="ghost" onClick={onBack}>← Back</Btn>
        <div style={{flex:1}}><Btn variant="teal" full size="lg" disabled={!valid} onClick={()=>onNext(form)}>Analyze My Invoice →</Btn></div>
      </div>
      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.gray500,textAlign:"center",marginTop:12}}>By continuing you agree to our Privacy Policy and Terms &amp; Conditions.</div>
    </div>
  );
}

// ── STEP 2 — Scanning ────────────────────
function StepScanning({ contact, onDone }) {
  const [phase, setPhase]       = useState(0);
  const [progress, setProgress] = useState(0);

  // All mutable state lives in refs to avoid stale closures entirely
  const started  = useRef(false);
  const resultR  = useRef(null);
  const doneR    = useRef(false);
  const progR    = useRef(0);       // single source of truth for progress value
  const phT      = useRef(null);
  const progT    = useRef(null);
  const finishT  = useRef(null);

  const PHASES = ["Reading your invoice...","Identifying line items...","Calculating annual spend...","Comparing to regional averages...","Generating your recommendations..."];
  const MOCK = {
    vendor: contact?.vendor||"Cintas", invoiceTotal:487, annualTotal:25324,
    lineItems:[
      {name:"Uniform rental — 8 employees",weeklyCharge:192,annualCost:9984,flagged:false,annualSaving:null},
      {name:"Commercial floor mats × 6",weeklyCharge:156,annualCost:8112,flagged:true,flagReason:"38% above regional average",annualSaving:2184},
      {name:"Shop rags (bulk service)",weeklyCharge:74,annualCost:3848,flagged:true,flagReason:"Competitors charge ~20% less",annualSaving:770},
      {name:"Restroom supplies",weeklyCharge:41,annualCost:2132,flagged:false,annualSaving:null},
      {name:"Facility service fee",weeklyCharge:24,annualCost:1248,flagged:true,flagReason:"Rose 12% since contract signing",annualSaving:500},
    ],
    freeRec:{item:"Commercial floor mats × 6",weeklyCharge:156,annualCost:8112,annualSaving:2184,explanation:"You're paying $156/week to rent 6 floor mats — $8,112 a year. Commercial-grade mats of equivalent quality can be purchased outright for about $300 total, with a payback period of under 3 weeks.",action:"Purchase replacement mats from our shop and cancel this line item at your next contract review."},
    totalPotentialSaving:3454, lockedCount:3,
    shopProduct:{name:"Heavy-Duty Commercial Floor Mat",theirAnnualCost:8112,ourPrice:49,quantity:6,yearlySaving:2184,tip:"Vacuum weekly and hose down monthly — commercial mats last 5–8 years with basic care."},
  };

  // Called once AI is done — drives progress from wherever it is to 100
  const finish = useRef(()=>{
    clearInterval(progT.current);
    clearInterval(phT.current);
    setPhase(PHASES.length - 1);
    finishT.current = setInterval(()=>{
      progR.current = Math.min(progR.current + 2, 100);
      setProgress(progR.current);
      if (progR.current >= 100) {
        clearInterval(finishT.current);
        if (!doneR.current) {
          doneR.current = true;
          setTimeout(() => onDone(resultR.current || MOCK), 350);
        }
      }
    }, 40);
  });

  useEffect(()=>{
    if (started.current) return;
    started.current = true;

    // Phase cycling
    let ph = 0;
    phT.current = setInterval(()=>{
      ph = Math.min(ph + 1, PHASES.length - 1);
      setPhase(ph);
    }, 1400);

    // Progress crawls to 88 then holds
    progT.current = setInterval(()=>{
      if (progR.current >= 88) { clearInterval(progT.current); return; }
      progR.current = Math.min(progR.current + Math.random() * 2.5 + 0.5, 88);
      setProgress(progR.current);
    }, 120);

    // AI call — always resolves (falls back to MOCK on any error)
    const callAI = async () => {
      try {
        const res  = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            messages: [{ role: "user", content:
              `You are an analyst for My Contract Doctors. Business: "${contact?.business||"customer"}", vendor: ${contact?.vendor||"a uniform vendor"}. Return ONLY valid JSON (no markdown fences) matching this exact shape:
{"vendor":"string","invoiceTotal":number,"annualTotal":number,"lineItems":[{"name":"string","weeklyCharge":number,"annualCost":number,"flagged":boolean,"flagReason":"string or null","annualSaving":"number or null"}],"freeRec":{"item":"string","weeklyCharge":number,"annualCost":number,"annualSaving":number,"explanation":"2-3 sentences plain English","action":"string"},"totalPotentialSaving":number,"lockedCount":number,"shopProduct":{"name":"string","theirAnnualCost":number,"ourPrice":number,"quantity":number,"yearlySaving":number,"tip":"string"}}`
            }],
          }),
        });
        const data = await res.json();
        const raw  = (data.content?.[0]?.text || "").replace(/```json|```/g, "").trim();
        resultR.current = JSON.parse(raw);
      } catch {
        resultR.current = MOCK;
      }
      // Always finish, regardless of success or failure
      finish.current();
    };

    callAI();

    return () => {
      clearInterval(phT.current);
      clearInterval(progT.current);
      clearInterval(finishT.current);
    };
  }, []); // eslint-disable-line

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
      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.gray500,marginBottom:44}}>{Math.round(progress)}% complete</div>
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

// ── STEP 3 — Results ─────────────────────
function StepResults({ result, contact }) {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeType, setUpgradeType] = useState("onetime");
  if(!result) return null;
  const { freeRec:free, shopProduct:shop } = result;

  return (
    <div style={{maxWidth:980,margin:"0 auto",padding:"44px 24px 80px"}}>
      {/* Banner */}
      <div style={{background:`linear-gradient(135deg,${C.navy} 0%,#153D6B 100%)`,borderRadius:18,padding:"28px 34px",marginBottom:26,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:20}}>
        <div>
          <Tag variant="teal">Analysis complete</Tag>
          <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(22px,3vw,34px)",color:"#fff",margin:"12px 0 6px",lineHeight:1.1}}>We found <span style={{color:C.teal}}>${result.totalPotentialSaving?.toLocaleString()}</span> in potential annual savings</h2>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:300,color:"rgba(255,255,255,0.6)"}}>{contact?.business} · {result.vendor} · ${result.invoiceTotal?.toLocaleString()}/week · ${result.annualTotal?.toLocaleString()}/year</p>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"rgba(255,255,255,0.4)",marginBottom:2}}>Savings identified</div>
          <div style={{fontFamily:"'DM Serif Display',serif",fontSize:52,color:C.teal,lineHeight:1}}>${result.totalPotentialSaving?.toLocaleString()}</div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"rgba(255,255,255,0.4)"}}>per year</div>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:22,marginBottom:22}}>
        {/* Free rec */}
        <div style={{gridColumn:"1 / -1"}}>
          <Eyebrow color={C.teal}>Your free recommendation</Eyebrow>
          <div style={{background:C.white,border:`2px solid ${C.teal}`,borderRadius:16,padding:28,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,right:0,background:C.teal,color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,padding:"5px 14px",borderRadius:"0 14px 0 10px"}}>FREE</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:24,alignItems:"start"}}>
              <div>
                <div style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:C.navy,marginBottom:10}}>{free?.item}</div>
                <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:300,color:C.gray500,lineHeight:1.75,marginBottom:16}}>{free?.explanation}</p>
                <div style={{background:C.tealLight,borderRadius:10,padding:"12px 16px",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#0D6E52",lineHeight:1.6}}><strong>Action:</strong> {free?.action}</div>
              </div>
              <div style={{textAlign:"center",flexShrink:0}}>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.gray500,marginBottom:3}}>Annual saving</div>
                <div style={{fontFamily:"'DM Serif Display',serif",fontSize:44,color:C.teal,lineHeight:1}}>${free?.annualSaving?.toLocaleString()}</div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.gray500}}>/year</div>
              </div>
            </div>
          </div>
        </div>

        {/* Locked */}
        <div>
          <Eyebrow>Additional savings — locked</Eyebrow>
          <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:16,overflow:"hidden"}}>
            {(result.lineItems||[]).filter(i=>i.flagged&&i.name!==free?.item).slice(0,result.lockedCount||3).map((item,i)=>(
              <div key={i} style={{padding:"16px 22px",borderBottom:`1px solid ${C.gray100}`,filter:"blur(4px)",userSelect:"none"}}>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:C.navy,marginBottom:3}}>████████████████</div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.gray500}}>████████████████████</div></div>
                  <div style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:C.teal}}>$███</div>
                </div>
              </div>
            ))}
            <div style={{padding:"18px 22px",background:C.navy,textAlign:"center"}}>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"rgba(255,255,255,0.6)",marginBottom:12}}>🔒 {result.lockedCount||3} more savings identified</div>
              <Btn variant="teal" onClick={()=>setShowUpgrade(true)}>Unlock All Savings →</Btn>
            </div>
          </div>
        </div>

        {/* Shop */}
        <div>
          <Eyebrow color={C.blue}>From our shop — own it, don't rent it</Eyebrow>
          <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:16,padding:22}}>
            <div style={{background:C.bluePale,borderRadius:10,padding:"13px 16px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontFamily:"'DM Serif Display',serif",fontSize:18,color:C.navy}}>{shop?.name}</div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.gray500,marginTop:3}}>Qty: {shop?.quantity} · Commercial grade</div></div>
              <div style={{textAlign:"right"}}><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.gray500}}>Our price</div><div style={{fontFamily:"'DM Serif Display',serif",fontSize:26,color:C.blue}}>${shop?.ourPrice}</div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.gray500}}>each</div></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              <div style={{background:C.offWhite,borderRadius:8,padding:"11px 13px"}}><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.gray500,marginBottom:2}}>You pay now</div><div style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:C.red}}>${shop?.theirAnnualCost?.toLocaleString()}<span style={{fontSize:12,color:C.gray500}}>/yr</span></div></div>
              <div style={{background:C.tealLight,borderRadius:8,padding:"11px 13px"}}><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#0D6E52",marginBottom:2}}>You'd save</div><div style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:C.teal}}>${shop?.yearlySaving?.toLocaleString()}<span style={{fontSize:12,color:C.gray500}}>/yr</span></div></div>
            </div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.gray500,background:C.offWhite,borderRadius:8,padding:"9px 12px",marginBottom:14,lineHeight:1.6}}>💡 <strong>Care tip:</strong> {shop?.tip}</div>
            <Btn variant="blue" full>View in Our Shop →</Btn>
          </div>
        </div>
      </div>

      {/* Agreement upsell */}
      <div style={{background:`linear-gradient(135deg,${C.offWhite},${C.bluePale})`,border:`1px solid ${C.gray200}`,borderRadius:16,padding:"26px 30px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:20}}>
        <div>
          <Tag variant="navy">Next step</Tag>
          <h3 style={{fontFamily:"'DM Serif Display',serif",fontSize:24,color:C.navy,margin:"10px 0 8px"}}>Want to go deeper? Upload your actual contract.</h3>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:300,color:C.gray500,maxWidth:500,lineHeight:1.7}}>Your invoice shows what you're paying. Your agreement shows <em>why</em> — and what you can negotiate. Our AI will flag every clause worth challenging.</p>
        </div>
        <div style={{textAlign:"center"}}>
          <div style={{fontFamily:"'DM Serif Display',serif",fontSize:36,color:C.navy}}>$49<span style={{fontSize:18}}>.99</span></div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.gray500,marginBottom:12}}>one-time · instant access</div>
          <Btn variant="navy">Analyze My Agreement</Btn>
        </div>
      </div>

      {/* Upgrade modal */}
      {showUpgrade&&(
        <div style={{position:"fixed",inset:0,zIndex:999,background:"rgba(8,30,56,0.75)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",padding:24}} onClick={e=>{if(e.target===e.currentTarget)setShowUpgrade(false);}}>
          <div style={{background:C.white,borderRadius:20,padding:40,maxWidth:460,width:"100%",boxShadow:"0 24px 80px rgba(12,45,84,0.25)",animation:"popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards"}}>
            <button onClick={()=>setShowUpgrade(false)} style={{float:"right",background:"none",border:"none",fontSize:22,cursor:"pointer",color:C.gray500,lineHeight:1}}>×</button>
            <Tag variant="teal">Unlock all savings</Tag>
            <h3 style={{fontFamily:"'DM Serif Display',serif",fontSize:28,color:C.navy,margin:"14px 0 10px"}}>${result.totalPotentialSaving?.toLocaleString()} is waiting</h3>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:300,color:C.gray500,lineHeight:1.7,marginBottom:22}}>Get the full breakdown — every flagged item, exact overpayments, and step-by-step instructions to fix each one.</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:22}}>
              {[{key:"onetime",label:"One-time report",price:"$29.99",sub:"Full analysis, single invoice"},{key:"sub",label:"Monthly monitoring",price:"$19.99/mo",sub:"Ongoing analysis + alerts"}].map(({key,label,price,sub})=>(
                <div key={key} onClick={()=>setUpgradeType(key)} style={{border:`2px solid ${upgradeType===key?C.teal:C.gray200}`,background:upgradeType===key?C.tealLight:C.white,borderRadius:10,padding:"14px 12px",cursor:"pointer",transition:"all 0.2s"}}>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,color:C.navy,marginBottom:4}}>{label}</div>
                  <div style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:C.teal}}>{price}</div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.gray500,marginTop:3}}>{sub}</div>
                </div>
              ))}
            </div>
            <Btn variant="teal" full size="lg">Get My Full Report →</Btn>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.gray500,textAlign:"center",marginTop:10}}>Secure checkout · Cancel anytime · Satisfaction guaranteed</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Root ─────────────────────────────────
export default function InvoicePage() {
  const [step, setStep]       = useState(0);
  const [file, setFile]       = useState(null);
  const [contact, setContact] = useState(null);
  const [result, setResult]   = useState(null);

  return (
    <>
      <style>{`
        ${FONTS}
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{background:${C.offWhite};}
        @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(61,128,200,0.35)}50%{box-shadow:0 0 0 18px rgba(61,128,200,0)}}
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes popIn{from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)}}
      `}</style>
      <Nav step={step}/>
      {step===0 && <StepUpload  onNext={f=>{setFile(f);setStep(1);}}/>}
      {step===1 && <StepContact onNext={c=>{setContact(c);setStep(2);}} onBack={()=>setStep(0)}/>}
      {step===2 && <StepScanning contact={contact} onDone={r=>{setResult(r);setStep(3);}}/>}
      {step===3 && <StepResults result={result} contact={contact}/>}
    </>
  );
}