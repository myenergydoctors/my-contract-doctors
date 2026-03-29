"use client";
import { useState, useRef, useEffect } from "react";

// ─────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────
const C = {
  navy:"#0C2D54",navyDark:"#081E38",blue:"#3D80C8",
  blueMid:"#2563A8",blueLight:"#6AAEE0",bluePale:"#E2EEFA",
  teal:"#17A882",tealLight:"#D4F2EA",white:"#FFFFFF",
  offWhite:"#F7F9FC",gray100:"#F0F4F8",gray200:"#E2E8F0",
  gray300:"#CBD5E1",gray500:"#64748B",gray700:"#334155",
  red:"#DC2626",redLight:"#FEE2E2",
  amber:"#D97706",amberLight:"#FEF3C7",
  green:"#16A34A",greenLight:"#DCFCE7",
};
const FONTS=`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');`;
const mkId=()=>Math.random().toString(36).slice(2,10).toUpperCase();

// ─────────────────────────────────────────
// SHARED UI PRIMITIVES
// ─────────────────────────────────────────
function Tag({children,variant="teal"}){
  const m={teal:{bg:C.tealLight,color:"#0D6E52"},blue:{bg:C.bluePale,color:C.blueMid},navy:{bg:C.navy,color:C.blueLight},red:{bg:C.redLight,color:C.red},amber:{bg:C.amberLight,color:C.amber},green:{bg:C.greenLight,color:C.green}};
  const s=m[variant]||m.teal;
  return <span style={{background:s.bg,color:s.color,fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,padding:"4px 12px",borderRadius:20,display:"inline-block"}}>{children}</span>;
}
function RiskBadge({risk}){
  const map={high:"red",medium:"amber",low:"green"};
  const labels={high:"High Risk",medium:"Medium Risk",low:"Low Risk"};
  return <Tag variant={map[risk]}>{labels[risk]}</Tag>;
}
function Eyebrow({children,color=C.blue}){
  return <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,letterSpacing:"0.16em",textTransform:"uppercase",color,marginBottom:10}}>{children}</div>;
}
function Btn({children,onClick,variant="navy",full=false,size="md",disabled=false,style={}}){
  const sz={lg:{padding:"15px 32px",fontSize:16},md:{padding:"12px 24px",fontSize:14},sm:{padding:"8px 14px",fontSize:12}}[size];
  const th={
    navy:{background:C.navy,color:"#fff",border:"none",boxShadow:"none"},
    teal:{background:C.teal,color:"#fff",border:"none",boxShadow:"0 4px 20px rgba(23,168,130,0.3)"},
    blue:{background:C.blue,color:"#fff",border:"none",boxShadow:"none"},
    outline:{background:"transparent",color:C.navy,border:`1.5px solid ${C.navy}`,boxShadow:"none"},
    ghost:{background:C.gray100,color:C.gray700,border:"none",boxShadow:"none"},
    red:{background:C.red,color:"#fff",border:"none",boxShadow:"none"},
  }[variant]||{};
  return(
    <button onClick={disabled?undefined:onClick}
      style={{...sz,...th,...style,fontFamily:"'DM Sans',sans-serif",fontWeight:500,cursor:disabled?"not-allowed":"pointer",borderRadius:9,display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all 0.2s",opacity:disabled?0.5:1,width:full?"100%":"auto"}}
      onMouseEnter={e=>{if(!disabled)e.currentTarget.style.opacity="0.85";}}
      onMouseLeave={e=>{e.currentTarget.style.opacity="1";}}
    >{children}</button>
  );
}
// ───────────────────────────────────────
// QR CODE (pure SVG pattern)
// ─────────────────────────────────────────
function QRCode({sessionId,size=148}){
  const cell=size/21;
  const pat=[[1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],[1,0,0,0,0,0,1,0,0,1,0,1,0,0,1,0,0,0,0,0,1],[1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1],[1,0,1,1,1,0,1,0,0,1,1,0,0,0,1,0,1,1,1,0,1],[1,0,1,1,1,0,1,0,1,1,0,1,1,0,1,0,1,1,1,0,1],[1,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,1],[1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],[0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0],[1,0,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,0,1,0],[0,1,0,0,1,0,0,0,1,0,0,1,0,0,0,1,0,0,1,0,1],[1,1,1,0,1,1,1,1,0,1,0,0,1,1,0,1,1,0,1,1,0],[0,0,1,0,0,1,0,0,1,0,1,0,0,1,1,0,0,1,0,0,1],[1,0,0,1,1,0,1,0,0,1,0,1,0,0,0,1,0,0,1,0,1],[0,0,0,0,0,0,0,0,1,1,0,0,1,0,1,0,1,0,0,1,0],[1,1,1,1,1,1,1,0,0,0,1,1,0,1,0,1,0,0,1,0,1],[1,0,0,0,0,0,1,0,1,0,0,1,1,0,1,1,0,1,0,1,0],[1,0,1,1,1,0,1,0,0,1,0,0,0,1,0,0,1,0,1,0,1],[1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,0,0,1,0,1,0],[1,0,1,1,1,0,1,0,0,1,0,1,0,1,0,1,0,0,1,0,1],[1,0,0,0,0,0,1,0,1,0,1,0,1,0,1,0,1,0,0,1,0],[1,1,1,1,1,1,1,0,0,1,0,1,0,1,0,1,0,1,0,0,1]];
  const rects=pat.flatMap((row,r)=>row.map((v,c)=>v?`<rect x="${c*cell}" y="${r*cell}" width="${cell-0.5}" height="${cell-0.5}" fill="${C.navy}" rx="0.4"/>`:"")).join("");
  return(
    <div style={{background:"#fff",padding:14,borderRadius:12,border:`2px solid ${C.bluePale}`,display:"inline-block",boxShadow:"0 4px 20px rgba(12,45,84,0.08)"}}>
      <div dangerouslySetInnerHTML={{__html:`<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg"><rect width="${size}" height="${size}" fill="white"/>${rects}</svg>`}}/>
      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:C.gray500,textAlign:"center",marginTop:8,letterSpacing:"0.1em"}}>SESSION · {sessionId}</div>
    </div>
  );
}

// ─────────────────────────────────────────
// STEP INDICATOR
// ─────────────────────────────────────────
function StepBar({step}){
  const steps=["Upload","Your Info","Analyzing","Results"];
  return(
    <div style={{background:C.navy,padding:"0 32px",position:"sticky",top:0,zIndex:50,borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
      <div style={{maxWidth:1100,margin:"0 auto",height:64,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",flexDirection:"column",lineHeight:1}}>
          <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,fontWeight:600,letterSpacing:"0.22em",textTransform:"uppercase",color:C.blueLight}}>My</span>
          <div><span style={{fontFamily:"'DM Serif Display',serif",fontSize:20,color:"#fff"}}>Contract </span><span style={{fontFamily:"'DM Serif Display',serif",fontSize:20,fontStyle:"italic",color:C.blueLight}}>Doctors</span></div>
        </div>
        <div style={{display:"flex",alignItems:"center"}}>
          {steps.map((s,i)=>{
            const done=i<step,cur=i===step;
            return(
              <div key={s} style={{display:"flex",alignItems:"center"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:26,height:26,borderRadius:"50%",background:done?C.teal:cur?C.blue:"rgba(255,255,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,fontFamily:"'DM Sans',sans-serif",color:done||cur?"#fff":"rgba(255,255,255,0.35)",transition:"all 0.4s"}}>{done?"✓":i+1}</div>
                  <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:500,color:cur?"#fff":done?C.blueLight:"rgba(255,255,255,0.35)",transition:"color 0.3s"}}>{s}</span>
                </div>
                {i<steps.length-1&&<div style={{width:28,height:1,background:done?C.teal:"rgba(255,255,255,0.12)",margin:"0 10px",transition:"background 0.4s"}}/>}
              </div>
            );
          })}
        </div>
        <div style={{width:140}}/>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// LANDING PAGE
// ─────────────────────────────────────────
function LandingPage({onStart}){
  const differences=[
    {demyst:"Generic agreement walkthrough",agreement:"Your actual contract, analyzed line by line"},
    {demyst:"Standard clause explanations",agreement:"Personalized flags based on YOUR terms & rates"},
    {demyst:"No upload required",agreement:"Upload your PDF or photo — we extract everything"},
    {demyst:"Same advice for every business",agreement:"Benchmarked against contracts in your region"},
    {demyst:"Educational guidance",agreement:"Specific dollar amounts you're overpaying"},
  ];
  const steps=[
    {n:"01",title:"Upload your agreement",body:"PDF, photo, or use our QR code to scan a paper copy with your phone. We accept any format."},
    {n:"02",title:"AI reads every clause",body:"Our AI extracts your actual terms — contract length, pricing, cancellation fees, renewal dates — and benchmarks them."},
    {n:"03",title:"Get your personalized report",body:"A full scorecard of your contract's health plus a clause-by-clause breakdown with specific negotiation actions."},
    {n:"04",title:"Download & negotiate",body:"Save your full PDF report, copy negotiation emails, and go back to your vendor armed with everything you need."},
  ];
  return(
    <div style={{background:C.offWhite}}>

      {/* Hero */}
      <section style={{background:`linear-gradient(160deg,${C.navyDark} 0%,${C.navy} 60%,#153D6B 100%)`,padding:"140px 32px 100px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,opacity:0.04,backgroundImage:`linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)`,backgroundSize:"48px 48px"}}/>
        <div style={{position:"absolute",top:"15%",right:"8%",width:440,height:440,borderRadius:"50%",background:`radial-gradient(circle,rgba(61,128,200,0.15) 0%,transparent 70%)`,pointerEvents:"none"}}/>
        <div style={{maxWidth:1100,margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:80,alignItems:"center",position:"relative",zIndex:2}}>
          <div>
            <Tag variant="blue">Personalized contract analysis</Tag>
            <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(34px,4.5vw,54px)",color:"#fff",lineHeight:1.1,margin:"18px 0 20px"}}>
              Upload your contract.<br/>
              <em style={{fontStyle:"italic",color:C.blueLight}}>See exactly what it's costing you.</em>
            </h1>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:17,fontWeight:300,color:"rgba(255,255,255,0.7)",lineHeight:1.75,marginBottom:36,maxWidth:460}}>
              The Demystifier teaches you what uniform contracts mean. The Agreement analyzes <em style={{fontStyle:"italic"}}>yours</em> — your vendor, your rates, your clauses — and tells you exactly where you're overpaying and what to do about it.
            </p>
            <div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:28}}>
              <Btn variant="teal" size="lg" onClick={onStart}>Upload My Agreement →</Btn>
              <a href="#compare" style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.1)",color:"#fff",border:"1px solid rgba(255,255,255,0.2)",fontFamily:"'DM Sans',sans-serif",fontSize:16,fontWeight:500,padding:"15px 28px",borderRadius:9,textDecoration:"none"}}>See what's included ↓</a>
            </div>
            <div style={{display:"flex",gap:24,flexWrap:"wrap"}}>
              {[{val:"2 min",label:"to upload & get results"},{val:"$XX",label:"one-time · no subscription"},{val:"100%",label:"personalized to your contract"}].map(({val,label})=>(
                <div key={val}>
                  <div style={{fontFamily:"'DM Serif Display',serif",fontSize:26,color:"#fff",lineHeight:1}}>{val}</div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"rgba(255,255,255,0.5)",marginTop:3,maxWidth:120}}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: sample scorecard preview */}
          <div style={{animation:"slideUp 0.7s ease 0.2s both"}}>
            <div style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:20,padding:28,backdropFilter:"blur(20px)"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:"#EF4444"}}/>
                <div style={{width:10,height:10,borderRadius:"50%",background:"#F59E0B"}}/>
                <div style={{width:10,height:10,borderRadius:"50%",background:"#22C55E"}}/>
                <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"rgba(255,255,255,0.4)",marginLeft:8}}>Agreement Analysis — Your Business</span>
              </div>
              {/* Score ring */}
              <div style={{textAlign:"center",marginBottom:22}}>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(255,255,255,0.4)",marginBottom:8}}>Contract Health Score</div>
                <div style={{position:"relative",width:100,height:100,margin:"0 auto"}}>
                  <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8"/>
                    <circle cx="50" cy="50" r="42" fill="none" stroke={C.amber} strokeWidth="8" strokeDasharray="264" strokeDashoffset="92" strokeLinecap="round" transform="rotate(-90 50 50)"/>
                  </svg>
                  <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                    <div style={{fontFamily:"'DM Serif Display',serif",fontSize:26,color:"#fff",lineHeight:1}}>65</div>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:C.amber}}>Fair</div>
                  </div>
                </div>
              </div>
              {/* Flags */}
              {[
                {label:"Contract term",value:"12 months",status:"ok"},
                {label:"Cancellation penalty",value:"40% × weeks left",status:"warn"},
                {label:"Minimum billing",value:"80% of agreement",status:"warn"},
                {label:"Price escalation",value:"Unlimited increases",status:"bad"},
                {label:"Arbitration venue",value:"Philadelphia, PA",status:"bad"},
              ].map(({label,value,status})=>{
                const color=status==="ok"?C.teal:status==="warn"?C.amber:C.red;
                const bg=status==="ok"?"rgba(23,168,130,0.1)":status==="warn"?"rgba(217,119,6,0.1)":"rgba(220,38,38,0.1)";
                return(
                  <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 12px",borderRadius:8,background:bg,marginBottom:6}}>
                    <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"rgba(255,255,255,0.8)"}}>{label}</span>
                    <span style={{fontFamily:"'DM Serif Display',serif",fontSize:13,color}}>{value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Demystifier vs Agreement comparison */}
      <section id="compare" style={{padding:"88px 32px",background:C.white}}>
        <div style={{maxWidth:860,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:48}}>
            <Eyebrow>Demystifier vs The Agreement</Eyebrow>
            <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(26px,3.5vw,38px)",color:C.navy,lineHeight:1.15}}>
              What makes <em style={{fontStyle:"italic",color:C.blue}}>your</em> analysis different
            </h2>
          </div>
          <div style={{border:`1px solid ${C.gray200}`,borderRadius:16,overflow:"hidden"}}>
            {/* Header */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",background:C.navy}}>
              <div style={{padding:"16px 20px",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.4)",letterSpacing:"0.1em",textTransform:"uppercase"}}>Feature</div>
              <div style={{padding:"16px 20px",fontFamily:"'DM Serif Display',serif",fontSize:16,color:"rgba(255,255,255,0.6)",borderLeft:"1px solid rgba(255,255,255,0.08)"}}>The Demystifier</div>
              <div style={{padding:"16px 20px",borderLeft:"1px solid rgba(255,255,255,0.08)",display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontFamily:"'DM Serif Display',serif",fontSize:16,color:"#fff"}}>The Agreement</span>
                <Tag variant="teal">You are here</Tag>
              </div>
            </div>
            {differences.map(({demyst,agreement},i)=>(
              <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",borderTop:`1px solid ${C.gray100}`,background:i%2===0?C.white:C.offWhite}}>
                <div style={{padding:"14px 20px"}}/>
                <div style={{padding:"14px 20px",borderLeft:`1px solid ${C.gray100}`,fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.gray500,display:"flex",alignItems:"center",gap:8}}>
                  <span style={{color:C.gray300,fontSize:14}}>○</span>{demyst}
                </div>
                <div style={{padding:"14px 20px",borderLeft:`1px solid ${C.gray100}`,fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500,color:C.navy,display:"flex",alignItems:"center",gap:8}}>
                  <span style={{color:C.teal,fontSize:14}}>✓</span>{agreement}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{padding:"88px 32px",background:C.offWhite}}>
        <div style={{maxWidth:1060,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:56}}>
            <Eyebrow color={C.teal}>How it works</Eyebrow>
            <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(26px,3.5vw,38px)",color:C.navy,lineHeight:1.15}}>From upload to full analysis in minutes</h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:20}}>
            {steps.map(({n,title,body},i)=>(
              <div key={n} style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:14,padding:"28px 22px",position:"relative",overflow:"hidden"}}>
                <div style={{fontFamily:"'DM Serif Display',serif",fontSize:64,fontStyle:"italic",color:C.blue,opacity:0.08,position:"absolute",top:-8,right:12,lineHeight:1,userSelect:"none"}}>{n}</div>
                <div style={{width:36,height:36,borderRadius:9,background:C.bluePale,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16}}>
                  <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,color:C.blue}}>{n}</span>
                </div>
                <div style={{fontFamily:"'DM Serif Display',serif",fontSize:17,color:C.navy,marginBottom:8,lineHeight:1.25}}>{title}</div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:300,color:C.gray500,lineHeight:1.7}}>{body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's in the report */}
      <section style={{padding:"88px 32px",background:C.white}}>
        <div style={{maxWidth:860,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:48}}>
            <Eyebrow>What you receive</Eyebrow>
            <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(26px,3.5vw,38px)",color:C.navy,lineHeight:1.15}}>Your complete contract analysis package</h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:48}}>
            {[
              {icon:"🏆",title:"Contract health scorecard",body:"An overall score plus a clause-by-clause risk rating — High, Medium, Low — so you know exactly what needs attention."},
              {icon:"📄",title:"Downloadable PDF report",body:"A formatted report with all findings, recommendations, and negotiation scripts you can reference any time."},
              {icon:"🔍",title:"Split-screen clause viewer",body:"Your actual contract text on the left, plain-English explanation and action items on the right."},
              {icon:"✉️",title:"Personalized negotiation emails",body:"Pre-written emails referencing your specific terms and dollar amounts — ready to send to your vendor."},
              {icon:"💰",title:"Dollar-amount savings estimate",body:"We calculate exactly how much your above-average clauses are costing you annually and over the contract life."},
              {icon:"📊",title:"Regional benchmarking",body:"Your terms compared to what other businesses in your area are paying for the same service and vendor."},
            ].map(({icon,title,body})=>(
              <div key={title} style={{display:"flex",gap:16,padding:"20px 22px",background:C.offWhite,border:`1px solid ${C.gray200}`,borderRadius:14}}>
                <div style={{fontSize:22,flexShrink:0}}>{icon}</div>
                <div>
                  <div style={{fontFamily:"'DM Serif Display',serif",fontSize:16,color:C.navy,marginBottom:5}}>{title}</div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:300,color:C.gray500,lineHeight:1.65}}>{body}</div>
                </div>
              </div>
            ))}
          </div>
          {/* CTA */}
          <div style={{background:`linear-gradient(135deg,${C.navy},#153D6B)`,borderRadius:18,padding:"40px 48px",textAlign:"center"}}>
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:32,color:"#fff",marginBottom:10}}>Ready to see your contract's real cost?</div>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:300,color:"rgba(255,255,255,0.65)",marginBottom:28,maxWidth:480,margin:"0 auto 28px"}}>Upload your agreement and get your personalized analysis in minutes.</p>
            <Btn variant="teal" size="lg" onClick={onStart}>Upload My Agreement →</Btn>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"rgba(255,255,255,0.35)",marginTop:14}}>One-time · Instant access · Price TBD — placeholder</div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────
// STEP 0 — UPLOAD
// ─────────────────────────────────────────
function StepUpload({onNext}){
  const [method,setMethod]=useState("desktop");
  const [dragging,setDragging]=useState(false);
  const [file,setFile]=useState(null);
  const [preview,setPreview]=useState(null);
  const [sessionId]=useState(mkId);
  const [mobileLinked,setLinked]=useState(false);
  const [showDemo,setShowDemo]=useState(false);
  const inputRef=useRef();
  const pollRef=useRef();

  useEffect(()=>{
    if(method!=="qr")return;
    pollRef.current=setInterval(()=>{
      try{
        const raw=localStorage.getItem(`mcd_agr_${sessionId}`);
        if(raw){const d=JSON.parse(raw);if(d.done){clearInterval(pollRef.current);setLinked(true);setFile({name:d.fileName||"agreement-mobile.jpg",size:200000,type:"image/jpeg",mobile:true});}}
      }catch{}
    },700);
    return()=>clearInterval(pollRef.current);
  },[method,sessionId]);

  const handleFile=f=>{
    if(!f)return;setFile(f);
    if(f.type?.startsWith("image/")){const r=new FileReader();r.onload=e=>setPreview(e.target.result);r.readAsDataURL(f);}
    else setPreview("pdf");
  };

  return(
    <div style={{maxWidth:760,margin:"0 auto",padding:"52px 24px"}}>
      <div style={{textAlign:"center",marginBottom:36}}>
        <Tag variant="blue">Personalized AI analysis</Tag>
        <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(28px,4vw,42px)",color:C.navy,lineHeight:1.15,margin:"16px 0 12px"}}>
          Upload your service agreement.<br/><em style={{fontStyle:"italic",color:C.blue}}>We'll do the rest.</em>
        </h1>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:300,color:C.gray500,lineHeight:1.75,maxWidth:500,margin:"0 auto"}}>Upload your PDF or photograph your paper agreement. Our AI reads every clause and generates a personalized analysis specific to your contract.</p>
      </div>

      {/* Method tabs */}
      <div style={{display:"flex",background:C.gray100,borderRadius:12,padding:4,marginBottom:24,gap:4}}>
        {[{key:"desktop",label:"📄  Upload a file",sub:"PDF or image from this device"},{key:"qr",label:"📱  Scan with phone",sub:"Paper agreement? Use your camera"}].map(({key,label,sub})=>(
          <button key={key} onClick={()=>{setMethod(key);setFile(null);setPreview(null);setLinked(false);}} style={{flex:1,padding:"12px 16px",borderRadius:9,border:"none",cursor:"pointer",background:method===key?C.white:"transparent",boxShadow:method===key?"0 1px 6px rgba(12,45,84,0.08)":"none",transition:"all 0.2s",textAlign:"center"}}>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:500,color:method===key?C.navy:C.gray500}}>{label}</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.gray500,marginTop:2}}>{sub}</div>
          </button>
        ))}
      </div>

      {/* Desktop upload */}
      {method==="desktop"&&(
        <div onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)}
          onDrop={e=>{e.preventDefault();setDragging(false);handleFile(e.dataTransfer.files[0]);}}
          onClick={()=>!file&&inputRef.current.click()}
          style={{border:`2px dashed ${dragging?C.teal:file?C.blue:C.gray300}`,borderRadius:18,padding:file?"32px":"52px 32px",textAlign:"center",background:dragging?C.tealLight:file?C.bluePale:C.offWhite,cursor:file?"default":"pointer",transition:"all 0.25s",marginBottom:20}}>
          <input ref={inputRef} type="file" accept="image/*,application/pdf" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>
          {!file?<>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{margin:"0 auto 14px",display:"block"}}><rect width="48" height="48" rx="12" fill={C.bluePale}/><path d="M14 32V28a2 2 0 012-2h16a2 2 0 012 2v4M24 18v12M24 18l-4 4M24 18l4 4" stroke={C.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:20,color:C.navy,marginBottom:8}}>Drop your agreement here</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.gray500,marginBottom:18}}>PDF or image (JPG, PNG) — signed or unsigned</div>
            <Btn variant="outline" onClick={e=>{e.stopPropagation();inputRef.current.click();}}>Choose a file</Btn>
          </>:(
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

      {/* QR mobile */}
      {method==="qr"&&(
        <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:18,overflow:"hidden",marginBottom:20}}>
          {!mobileLinked?(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr"}}>
              <div style={{padding:"32px",borderRight:`1px solid ${C.gray200}`}}>
                <Eyebrow color={C.teal}>Step 1</Eyebrow>
                <div style={{fontFamily:"'DM Serif Display',serif",fontSize:20,color:C.navy,marginBottom:10,lineHeight:1.2}}>Scan this QR code with your phone</div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.gray500,lineHeight:1.7,marginBottom:20}}>Opens a mobile page where you can photograph your paper agreement and send it directly to this session.</div>
                <QRCode sessionId={sessionId} size={148}/>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.gray500,marginTop:10}}>Expires in 30 minutes</div>
              </div>
              <div style={{padding:"32px",background:C.offWhite,display:"flex",flexDirection:"column"}}>
                <Eyebrow color={C.navy}>Step 2</Eyebrow>
                <div style={{fontFamily:"'DM Serif Display',serif",fontSize:20,color:C.navy,marginBottom:16,lineHeight:1.2}}>Photograph & send</div>
                {["Scan the QR code with your camera app","Tap 'Open Camera' on the page that loads","Photograph your paper agreement clearly","Tap 'Send to Desktop' — this page updates automatically"].map((t,i)=>(
                  <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:12}}>
                    <div style={{width:24,height:24,borderRadius:"50%",background:C.navy,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,color:"#fff"}}>{i+1}</div>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.gray700,lineHeight:1.6,paddingTop:2}}>{t}</div>
                  </div>
                ))}
                <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,padding:"14px 18px",display:"flex",alignItems:"center",gap:14,marginTop:"auto",marginBottom:14}}>
                  <div style={{display:"flex",gap:4,flexShrink:0}}>
                    {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:C.blue,animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}
                  </div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.gray700}}>Waiting for your phone upload...</div>
                </div>
                <button onClick={()=>setShowDemo(true)} style={{background:"none",border:`1px dashed ${C.gray300}`,borderRadius:8,padding:"10px 14px",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.gray500,cursor:"pointer",display:"flex",alignItems:"center",gap:6,justifyContent:"center"}}>
                  <span>👀</span> Preview the mobile experience
                </button>
              </div>
            </div>
          ):(
            <div style={{padding:"40px",textAlign:"center"}}>
              <div style={{width:64,height:64,borderRadius:"50%",background:C.tealLight,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:28}}>✓</div>
              <Tag variant="teal">Agreement received from phone</Tag>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:24,color:C.navy,margin:"14px 0 8px"}}>{file?.name} linked to session {sessionId}</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.gray500,marginBottom:20}}>Your phone can be put away — everything continues here on desktop.</div>
              <Tag variant="blue">Ready to analyze</Tag>
            </div>
          )}
        </div>
      )}

      <Btn variant="teal" full size="lg" disabled={!file} onClick={()=>onNext(file)}>Continue — Add Your Details →</Btn>
      <div style={{display:"flex",justifyContent:"center",gap:28,marginTop:20,flexWrap:"wrap"}}>
        {[{icon:"🔒",text:"Encrypted & never shared"},{icon:"⚡",text:"Analysis in under 3 minutes"},{icon:"📄",text:"All vendors supported"}].map(({icon,text})=>(
          <div key={text} style={{display:"flex",alignItems:"center",gap:7}}><span style={{fontSize:14}}>{icon}</span><span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.gray500}}>{text}</span></div>
        ))}
      </div>

      {/* Mobile demo modal */}
      {showDemo&&(
        <div style={{position:"fixed",inset:0,zIndex:999,background:"rgba(8,30,56,0.8)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",padding:24,flexDirection:"column",gap:20}} onClick={e=>{if(e.target===e.currentTarget)setShowDemo(false);}}>
          <div style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:"#fff",textAlign:"center"}}>Mobile upload experience</div>
          <MobileView sessionId={sessionId} label="agreement" storageKey={`mcd_agr_${sessionId}`} onUploaded={f=>{setShowDemo(false);setLinked(true);setFile(f);setMethod("qr");}}/>
          <button onClick={()=>setShowDemo(false)} style={{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.3)",color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:13,padding:"8px 20px",borderRadius:8,cursor:"pointer"}}>Close preview</button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// MOBILE VIEW (phone simulator)
// ─────────────────────────────────────────
function MobileView({sessionId,label="agreement",storageKey,onUploaded}){
  const [mFile,setMFile]=useState(null);
  const [preview,setPreview]=useState(null);
  const [busy,setBusy]=useState(false);
  const [sent,setSent]=useState(false);
  const inputRef=useRef();
  const key=storageKey||`mcd_agr_${sessionId}`;

  const pick=f=>{if(!f)return;setMFile(f);const r=new FileReader();r.onload=e=>setPreview(e.target.result);r.readAsDataURL(f);};
  const send=()=>{
    setBusy(true);
    setTimeout(()=>{
      setBusy(false);setSent(true);
      try{localStorage.setItem(key,JSON.stringify({done:true,fileName:mFile.name}));}catch{}
      setTimeout(()=>onUploaded(mFile),700);
    },1600);
  };

  return(
    <div style={{width:300,background:C.offWhite,borderRadius:22,overflow:"hidden",boxShadow:"0 24px 60px rgba(12,45,84,0.22)",border:`6px solid ${C.navyDark}`}}>
      <div style={{background:C.navy,padding:"8px 18px 6px",display:"flex",justifyContent:"space-between"}}>
        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"rgba(255,255,255,0.6)"}}>9:41</span>
        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"rgba(255,255,255,0.6)"}}>●●● WiFi 100%</span>
      </div>
      <div style={{background:C.navy,padding:"6px 16px 12px",textAlign:"center",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
        <div style={{fontFamily:"'DM Serif Display',serif",fontSize:15,color:"#fff"}}>Contract <span style={{fontStyle:"italic",color:C.blueLight}}>Doctors</span></div>
        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:"rgba(255,255,255,0.45)",marginTop:1}}>Upload your {label}</div>
      </div>
      <div style={{padding:"18px 16px"}}>
        {!sent?<>
          <div style={{textAlign:"center",marginBottom:16}}>
            <Tag variant="blue">Session #{sessionId}</Tag>
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:18,color:C.navy,margin:"10px 0 6px",lineHeight:1.2}}>Scan your {label}</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.gray500,lineHeight:1.6}}>Take a clear photo and send it to your desktop session.</div>
          </div>
          <input ref={inputRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>pick(e.target.files[0])}/>
          {!mFile?<>
            <button onClick={()=>inputRef.current.click()} style={{width:"100%",padding:"14px",borderRadius:10,background:C.navy,color:"#fff",border:"none",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:8}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="#fff" strokeWidth="2" fill="none"/><circle cx="12" cy="13" r="4" stroke="#fff" strokeWidth="2"/></svg>
              Open Camera
            </button>
            <button onClick={()=>{const i=document.createElement("input");i.type="file";i.accept="image/*,application/pdf";i.onchange=e=>pick(e.target.files[0]);i.click();}} style={{width:"100%",padding:"11px",borderRadius:10,background:C.offWhite,color:C.gray700,border:`1px solid ${C.gray300}`,fontFamily:"'DM Sans',sans-serif",fontSize:13,cursor:"pointer"}}>Choose from Library</button>
          </>:<>
            {preview&&<img src={preview} alt="" style={{width:"100%",borderRadius:8,marginBottom:10,maxHeight:150,objectFit:"cover",border:`1px solid ${C.gray200}`}}/>}
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.gray500,textAlign:"center",marginBottom:10}}>{mFile.name}</div>
            <Btn variant="teal" full onClick={send} disabled={busy}>
              {busy?<span style={{display:"flex",alignItems:"center",gap:8}}><span style={{width:13,height:13,border:"2px solid rgba(255,255,255,0.4)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite"}}/>Sending...</span>:"Send to Desktop →"}
            </Btn>
            <button onClick={()=>{setMFile(null);setPreview(null);}} style={{marginTop:8,width:"100%",background:"none",border:"none",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.gray500,cursor:"pointer",textDecoration:"underline"}}>Retake</button>
          </>}
        </>:(
          <div style={{textAlign:"center",padding:"16px 0"}}>
            <div style={{width:52,height:52,borderRadius:"50%",background:C.tealLight,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",fontSize:24}}>✓</div>
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:18,color:C.navy,marginBottom:6}}>Sent!</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.gray500,lineHeight:1.6}}>Linked to your desktop session. You can close this tab.</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// STEP 1 — CONTACT
// ─────────────────────────────────────────
function StepContact({onNext,onBack}){
  const [form,setForm]=useState({name:"",email:"",phone:"",business:"",vendor:"",location:""});
  const set=k=>e=>setForm(f=>({...f,[k]:e.target.value}));
  const valid=form.name.trim()&&form.email.trim()&&form.business.trim();
  const iSt={width:"100%",padding:"12px 14px",borderRadius:8,border:`1.5px solid ${C.gray300}`,fontFamily:"'DM Sans',sans-serif",fontSize:14,color:C.navy,background:C.white,outline:"none",transition:"border-color 0.2s"};
  const lSt={fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,color:C.gray700,marginBottom:6,display:"block"};
  const fo=e=>e.target.style.borderColor=C.blue;
  const bl=e=>e.target.style.borderColor=C.gray300;
  const selBg=`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748B' stroke-width='1.5' fill='none'/%3E%3C/svg%3E") no-repeat right 14px center`;

  return(
    <div style={{maxWidth:640,margin:"0 auto",padding:"52px 24px"}}>
      <div style={{marginBottom:30}}>
        <Tag variant="blue">Step 2 of 4</Tag>
        <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:34,color:C.navy,margin:"14px 0 8px"}}>Tell us about your business</h2>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:300,color:C.gray500,lineHeight:1.7}}>We use this to personalize your analysis and benchmark your contract against others in your area.</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18}}>
        {[{k:"name",l:"Full name *",p:"Jane Smith",t:"text"},{k:"business",l:"Business name *",p:"Acme Restaurant Group",t:"text"},{k:"email",l:"Email address *",p:"jane@acme.com",t:"email"},{k:"phone",l:"Phone number",p:"(555) 000-0000",t:"tel"}].map(({k,l,p,t})=>(
          <div key={k}><label style={lSt}>{l}</label><input style={iSt} type={t} placeholder={p} value={form[k]} onChange={set(k)} onFocus={fo} onBlur={bl}/></div>
        ))}
        <div>
          <label style={lSt}>Vendor</label>
          <select style={{...iSt,background:`${C.white} ${selBg}`,appearance:"none"}} value={form.vendor} onChange={set("vendor")} onFocus={fo} onBlur={bl}>
            <option value="">Select vendor...</option>
            {["Cintas","UniFirst","ALSCO","ImageFirst / Berstein-Magoon-Gay","Aramark","G&K Services","Other"].map(v=><option key={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label style={lSt}>Business location (city, state)</label>
          <input style={iSt} type="text" placeholder="Portland, ME" value={form.location} onChange={set("location")} onFocus={fo} onBlur={bl}/>
        </div>
      </div>

      {/* Why we ask for location */}
      <div style={{background:C.bluePale,border:`1px solid rgba(61,128,200,0.2)`,borderRadius:10,padding:"13px 16px",marginBottom:26,display:"flex",gap:12,alignItems:"flex-start"}}>
        <span style={{fontSize:16,flexShrink:0}}>📍</span>
        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.blueMid,lineHeight:1.6}}>Your location helps us benchmark your contract terms against other businesses in your region — so we can tell you if you're paying above-average rates for your area.</span>
      </div>

      <div style={{background:C.offWhite,border:`1px solid ${C.gray200}`,borderRadius:10,padding:"13px 16px",marginBottom:26,display:"flex",gap:12,alignItems:"flex-start"}}>
        <input type="checkbox" defaultChecked style={{marginTop:2,accentColor:C.teal,flexShrink:0,cursor:"pointer"}}/>
        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.gray500,lineHeight:1.6}}>Send me my analysis report by email and keep me updated on ways to reduce my uniform costs. Unsubscribe anytime.</span>
      </div>

      <div style={{display:"flex",gap:12}}>
        <Btn variant="ghost" onClick={onBack}>← Back</Btn>
        <div style={{flex:1}}><Btn variant="teal" full size="lg" disabled={!valid} onClick={()=>onNext(form)}>Analyze My Agreement →</Btn></div>
      </div>
      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.gray500,textAlign:"center",marginTop:12}}>By continuing you agree to our Privacy Policy and Terms &amp; Conditions.</div>
    </div>
  );
}

// ─────────────────────────────────────────
// STEP 2 — SCANNING (ref-based, no stale closures)
// ─────────────────────────────────────────
function StepScanning({contact,onDone}){
  const [phase,setPhase]=useState(0);
  const [progress,setProgress]=useState(0);
  const started=useRef(false);
  const resultR=useRef(null);
  const doneR=useRef(false);
  const progR=useRef(0);
  const phT=useRef(null);
  const progT=useRef(null);
  const finishT=useRef(null);

  const PHASES=["Reading your agreement...","Extracting contract terms...","Identifying risk clauses...","Benchmarking against regional data...","Calculating your savings potential...","Generating your personalized report..."];

  const MOCK={
    vendor:contact?.vendor||"ImageFirst / Berstein-Magoon-Gay",
    business:contact?.business||"Your Business",
    location:contact?.location||"Your Area",
    contractNum:"63-JL00212",
    weeklyValue:70.53,
    annualValue:3667.56,
    contractTerm:12,
    autoRenewalDays:90,
    score:58,
    scoreLabel:"Below Average",
    annualOverpayEstimate:2840,
    contractLifeOverpay:5680,
    clauses:[
      {id:"rental",label:"Rental Terms & Liability",risk:"medium",contractText:`All items are and will remain the property of Company, and the customer agrees to return such items on demand and to be liable for any loss or destruction of such items, including such loss or destruction caused by customer's employees, except as a result of normal wear...`,finding:"Replacement costs are at vendor's 'prevailing rate' with no cap defined. This gives the vendor discretion to charge premium replacement pricing.",recommendation:"Negotiate a cap on replacement costs at 2× the weekly rental rate per item. Add a definition of 'normal wear' in writing.",annualImpact:null,flag:"watch"},
      {id:"term",label:"Contract Term & Auto-Renewal",risk:"medium",contractText:`The term of this agreement is for twelve (12) months from the date of the first delivery and thereafter for the same time period unless cancelled by either party, in writing, at least ninety (90) days prior to any termination date.`,finding:"12-month term with 90-day written cancellation notice required. Auto-renews for another full 12 months if you miss the window. Renewal date: approx. November 2025.",recommendation:"Set a calendar reminder for August 2025 (95 days before renewal). Request reduction of notice period to 30 days and month-to-month after initial term.",annualImpact:null,flag:"warn"},
      {id:"cancellation",label:"Minimum Billing & Cancellation",risk:"high",contractText:`There will be a minimum weekly billing of 80% of this agreement value or 80% of the current invoice amount whichever is greater. Customer may discontinue service at any time provided customer pays Company a cancellation charge of 40% of the agreement value or the current invoice amount, whichever is greater, multiplied by the number of weeks remaining under the agreement.`,finding:`CRITICAL: 80% minimum billing even if you reduce staff or orders. Early exit penalty = 40% × $70.53 × weeks remaining. With 26 weeks left: ~$733. With 52 weeks left: ~$1,467.`,recommendation:"Negotiate minimum billing down to 50% of current invoice (not agreement value). Cap cancellation penalty at a flat dollar maximum of $500.",annualImpact:1467,flag:"bad"},
      {id:"pricing",label:"Price Escalation",risk:"high",contractText:`The price in effect may be changed by Company annually and/or otherwise from time to time. A finance charge of 1 1/2% per month, which is equal to 18% per year will be added to all balances not paid within terms.`,finding:"Vendor can raise prices at ANY time — your weekly invoice serves as the only required notice. No cap on increases. Finance charge of 18%/year on unpaid balances.",recommendation:"Add language: 'All pricing, fees, and service charges shall not increase more than 3% per calendar year.' Strike 'and/or otherwise from time to time.'",annualImpact:220,flag:"bad"},
      {id:"ldp",label:"LDP Protection Charge",risk:"medium",contractText:`LOSSPROTECT 2.16% — LDP Protection — $1.28 weekly ($1.40 on current invoice)`,finding:"LDP is billed automatically every week at $1.40, regardless of whether any items are actually lost or damaged. This is $72.80/year in automatic charges.",recommendation:"Request removal of LDP. If vendor insists, negotiate that LDP only applies when items are actually reported lost or damaged that week.",annualImpact:73,flag:"warn"},
      {id:"arbitration",label:"Arbitration & Jury Waiver",risk:"high",contractText:`Any dispute or matter arising in connection with or relating to this agreement shall be resolved by binding and final arbitration in Philadelphia, PA... the parties hereby expressly waive the right to a trial by jury...`,finding:"Binding arbitration in Philadelphia, PA — regardless of where your business is located. You waive your right to a jury trial. 12-month statute of limitations (shorter than most state laws).",recommendation:"Request arbitration venue be changed to your state or conducted virtually. Ask for mutual arbitration rights. Note: this clause is standard — focus negotiation energy on financial clauses.",annualImpact:null,flag:"bad"},
      {id:"governing",label:"Governing Law & Successors",risk:"low",contractText:`This agreement shall be binding upon present and or future owners, successors or assigns of customer and Company... This agreement shall be governed by the laws of the Commonwealth of Pennsylvania...`,finding:"Agreement binds future owners of your business. Pennsylvania law governs all disputes. No oral modifications are binding — everything must be in writing.",recommendation:"Before signing, write all verbal commitments from your sales rep into the 'Other' section or an addendum. If selling your business, factor in existing vendor agreements.",annualImpact:null,flag:"watch"},
    ],
    topActions:[
      "Negotiate cancellation penalty cap — potential savings up to $1,467",
      "Add price increase cap of 3%/year — saves ~$220/year",
      "Remove LDP charge — saves $72.80/year",
      "Set auto-renewal calendar reminder for 95 days before November 2025",
    ],
  };

  const finish=useRef(()=>{
    clearInterval(progT.current);
    clearInterval(phT.current);
    setPhase(PHASES.length-1);
    finishT.current=setInterval(()=>{
      progR.current=Math.min(progR.current+2,100);
      setProgress(progR.current);
      if(progR.current>=100){
        clearInterval(finishT.current);
        if(!doneR.current){doneR.current=true;setTimeout(()=>onDone(resultR.current||MOCK),350);}
      }
    },40);
  });

  useEffect(()=>{
    if(started.current)return;
    started.current=true;
    let ph=0;
    phT.current=setInterval(()=>{ph=Math.min(ph+1,PHASES.length-1);setPhase(ph);},1200);
    progT.current=setInterval(()=>{
      if(progR.current>=85){clearInterval(progT.current);return;}
      progR.current=Math.min(progR.current+Math.random()*2+0.3,85);
      setProgress(progR.current);
    },120);

    const callAI=async()=>{
      try{
        const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1500,messages:[{role:"user",content:`You are a contract analyst for My Contract Doctors. A business called "${contact?.business||"the customer"}" in "${contact?.location||"their area"}" uses vendor "${contact?.vendor||"a uniform vendor"}". Generate a realistic contract analysis for a uniform/linen service agreement. Return ONLY valid JSON (no markdown fences) with this exact shape:
{"vendor":"string","business":"string","location":"string","contractNum":"string","weeklyValue":number,"annualValue":number,"contractTerm":number,"autoRenewalDays":number,"score":number(0-100),"scoreLabel":"string(Poor/Below Average/Fair/Good/Excellent)","annualOverpayEstimate":number,"contractLifeOverpay":number,"clauses":[{"id":"string","label":"string","risk":"high|medium|low","contractText":"string(1-2 sentences of realistic contract language)","finding":"string(specific finding for THIS business)","recommendation":"string(specific action)","annualImpact":"number or null","flag":"bad|warn|watch|ok"}],"topActions":["string","string","string","string"]}`}]})});
        const data=await res.json();
        resultR.current=JSON.parse((data.content?.[0]?.text||"").replace(/```json|```/g,"").trim());
      }catch{resultR.current=MOCK;}
      finish.current();
    };
    callAI();
    return()=>{clearInterval(phT.current);clearInterval(progT.current);clearInterval(finishT.current);};
  },[]);// eslint-disable-line

  const scoreColor=progress<40?C.red:progress<70?C.amber:C.teal;

  return(
    <div style={{maxWidth:520,margin:"0 auto",padding:"80px 24px",textAlign:"center"}}>
      <div style={{width:80,height:80,borderRadius:20,background:C.navy,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 28px",animation:"pulse 2s ease-in-out infinite"}}>
        <svg width="44" height="44" viewBox="0 0 54 54" fill="none"><rect x="13" y="10" width="22" height="28" rx="3" fill="none" stroke="#fff" strokeWidth="1.8"/><line x1="18" y1="17" x2="30" y2="17" stroke={C.blueLight} strokeWidth="1.4" strokeLinecap="round"/><line x1="18" y1="21" x2="30" y2="21" stroke={C.blueLight} strokeWidth="1.4" strokeLinecap="round"/><line x1="18" y1="25" x2="26" y2="25" stroke={C.blueLight} strokeWidth="1.4" strokeLinecap="round"/><path d="M35 22 Q44 22 44 31 Q44 40 37 40" stroke={C.teal} strokeWidth="2" fill="none" strokeLinecap="round"/><circle cx="34.5" cy="41" r="3" fill={C.teal}/><circle cx="34.5" cy="41" r="1.2" fill={C.navy}/></svg>
      </div>
      <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:30,color:C.navy,marginBottom:8}}>Analyzing your agreement...</h2>
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

// ─────────────────────────────────────────
// STEP 3 — RESULTS (scorecard + split-screen + report)
// ─────────────────────────────────────────
function StepResults({result,contact}){
  const [activeId,setActiveId]=useState(result?.clauses?.[0]?.id||"rental");
  const [showEmailModal,setShowEmailModal]=useState(false);
  const [emailClause,setEmailClause]=useState(null);
  const [reportDownloaded,setReportDownloaded]=useState(false);
  const [view,setView]=useState("scorecard"); // "scorecard" | "viewer"
  if(!result)return null;

  const active=result.clauses?.find(c=>c.id===activeId)||result.clauses?.[0];
  const flagColor={bad:C.red,warn:C.amber,watch:C.blue,ok:C.teal};
  const scoreColor=result.score<40?C.red:result.score<65?C.amber:C.teal;
  const highRisk=result.clauses?.filter(c=>c.risk==="high")||[];
  const totalImpact=result.clauses?.reduce((sum,c)=>sum+(c.annualImpact||0),0)||0;

  const openEmail=clause=>{setEmailClause(clause);setShowEmailModal(true);};

  const downloadReport=()=>{
    // Build a text report and trigger download
    const lines=[
      `MY CONTRACT DOCTORS — Agreement Analysis Report`,
      `${"─".repeat(50)}`,
      `Business: ${result.business}`,
      `Vendor: ${result.vendor}`,
      `Location: ${result.location}`,
      `Contract #: ${result.contractNum}`,
      `Weekly Value: $${result.weeklyValue}`,
      `Annual Value: $${result.annualValue?.toLocaleString()}`,
      ``,
      `CONTRACT HEALTH SCORE: ${result.score}/100 — ${result.scoreLabel}`,
      `Estimated annual overpayment: $${result.annualOverpayEstimate?.toLocaleString()}`,
      `Over contract life: $${result.contractLifeOverpay?.toLocaleString()}`,
      ``,
      `TOP PRIORITY ACTIONS`,
      `${"─".repeat(50)}`,
      ...(result.topActions||[]).map((a,i)=>`${i+1}. ${a}`),
      ``,
      `CLAUSE-BY-CLAUSE ANALYSIS`,
      `${"─".repeat(50)}`,
      ...(result.clauses||[]).flatMap(c=>[
        ``,
        `[${c.risk.toUpperCase()} RISK] ${c.label}`,
        `Contract language: "${c.contractText}"`,
        `Finding: ${c.finding}`,
        `Recommendation: ${c.recommendation}`,
        c.annualImpact?`Estimated annual impact: $${c.annualImpact.toLocaleString()}`:"",
      ].filter(Boolean)),
      ``,
      `${"─".repeat(50)}`,
      `Generated by My Contract Doctors — mycontractdoctors.com`,
      `We're on your side, not the vendor's.`,
    ];
    const blob=new Blob([lines.join("\n")],{type:"text/plain"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download=`MCD_Agreement_Analysis_${result.business?.replace(/\s+/g,"_")||"Report"}.txt`;
    a.click();URL.revokeObjectURL(url);
    setReportDownloaded(true);
  };

  return(
    <div style={{maxWidth:1100,margin:"0 auto",padding:"44px 24px 80px"}}>

      {/* Top banner */}
      <div style={{background:`linear-gradient(135deg,${C.navy},#153D6B)`,borderRadius:18,padding:"28px 36px",marginBottom:28,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:20}}>
        <div>
          <Tag variant="teal">Analysis complete</Tag>
          <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(22px,3vw,34px)",color:"#fff",margin:"12px 0 6px",lineHeight:1.1}}>
            {result.business} — {result.vendor}
          </h2>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:300,color:"rgba(255,255,255,0.6)"}}>
            {result.location} · Contract #{result.contractNum} · ${result.weeklyValue}/week · ${result.annualValue?.toLocaleString()}/year
          </p>
        </div>
        <div style={{display:"flex",gap:16,alignItems:"center"}}>
          <div style={{textAlign:"center"}}>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"rgba(255,255,255,0.4)",marginBottom:4}}>Health score</div>
            <div style={{position:"relative",width:72,height:72}}>
              <svg width="72" height="72" viewBox="0 0 72 72">
                <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6"/>
                <circle cx="36" cy="36" r="30" fill="none" stroke={scoreColor} strokeWidth="6" strokeDasharray={`${2*Math.PI*30}`} strokeDashoffset={`${2*Math.PI*30*(1-result.score/100)}`} strokeLinecap="round" transform="rotate(-90 36 36)" style={{transition:"stroke-dashoffset 1s ease"}}/>
              </svg>
              <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                <div style={{fontFamily:"'DM Serif Display',serif",fontSize:20,color:"#fff",lineHeight:1}}>{result.score}</div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:scoreColor,fontWeight:600}}>{result.scoreLabel}</div>
              </div>
            </div>
          </div>
          <div style={{textAlign:"center",padding:"0 16px",borderLeft:"1px solid rgba(255,255,255,0.12)",borderRight:"1px solid rgba(255,255,255,0.12)"}}>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"rgba(255,255,255,0.4)",marginBottom:2}}>Est. annual overpay</div>
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:36,color:C.amber,lineHeight:1}}>${result.annualOverpayEstimate?.toLocaleString()}</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:2}}>per year</div>
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"rgba(255,255,255,0.4)",marginBottom:2}}>Over contract life</div>
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:28,color:C.red,lineHeight:1}}>${result.contractLifeOverpay?.toLocaleString()}</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:2}}>total</div>
          </div>
        </div>
      </div>

      {/* View toggle + download */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div style={{display:"flex",background:C.gray100,borderRadius:10,padding:3,gap:3}}>
          {[{key:"scorecard",label:"📊  Scorecard"},{key:"viewer",label:"📄  Clause Viewer"}].map(({key,label})=>(
            <button key={key} onClick={()=>setView(key)} style={{padding:"9px 20px",borderRadius:8,border:"none",cursor:"pointer",background:view===key?C.white:"transparent",boxShadow:view===key?"0 1px 4px rgba(12,45,84,0.1)":"none",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:view===key?500:400,color:view===key?C.navy:C.gray500,transition:"all 0.2s"}}>
              {label}
            </button>
          ))}
        </div>
        <div style={{display:"flex",gap:10}}>
          <Btn variant={reportDownloaded?"ghost":"navy"} size="sm" onClick={downloadReport}>
            {reportDownloaded?"✓ Report Downloaded":"⬇ Download Full Report"}
          </Btn>
        </div>
      </div>

      {/* ── SCORECARD VIEW ── */}
      {view==="scorecard"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:22}}>

          {/* Top actions */}
          <div style={{gridColumn:"1/-1"}}>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,letterSpacing:"0.14em",textTransform:"uppercase",color:C.teal,marginBottom:12}}>Priority actions</div>
            <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:14,padding:"20px 24px"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                {(result.topActions||[]).map((action,i)=>(
                  <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",padding:"12px 14px",background:i===0?C.redLight:i===1?C.amberLight:C.offWhite,borderRadius:10,border:`1px solid ${i===0?"rgba(220,38,38,0.2)":i===1?"rgba(217,119,6,0.2)":C.gray200}`}}>
                    <div style={{width:22,height:22,borderRadius:"50%",background:i===0?C.red:i===1?C.amber:C.blue,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:700,color:"#fff"}}>{i+1}</div>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.gray700,lineHeight:1.6,paddingTop:1}}>{action}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Clause risk cards */}
          {(result.clauses||[]).map(clause=>{
            const fc=flagColor[clause.flag]||C.gray500;
            const bg={bad:C.redLight,warn:C.amberLight,watch:C.bluePale,ok:C.greenLight}[clause.flag]||C.offWhite;
            return(
              <div key={clause.id} style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:14,padding:"20px 22px",cursor:"pointer",transition:"all 0.2s",boxShadow:"none"}}
                onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 4px 20px rgba(12,45,84,0.08)";e.currentTarget.style.borderColor=C.blue;}}
                onMouseLeave={e=>{e.currentTarget.style.boxShadow="none";e.currentTarget.style.borderColor=C.gray200;}}
                onClick={()=>{setActiveId(clause.id);setView("viewer");}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
                  <RiskBadge risk={clause.risk}/>
                  {clause.annualImpact&&<div style={{fontFamily:"'DM Serif Display',serif",fontSize:20,color:C.red}}>−${clause.annualImpact.toLocaleString()}/yr</div>}
                </div>
                <div style={{fontFamily:"'DM Serif Display',serif",fontSize:17,color:C.navy,marginBottom:8,lineHeight:1.2}}>{clause.label}</div>
                <div style={{background:bg,borderRadius:8,padding:"10px 12px",marginBottom:12}}>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:fc,fontWeight:500,marginBottom:3}}>Finding</div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:300,color:C.gray700,lineHeight:1.65}}>{clause.finding}</div>
                </div>
                <button onClick={e=>{e.stopPropagation();openEmail(clause);}} style={{background:"none",border:`1px solid ${C.gray300}`,borderRadius:7,padding:"7px 12px",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.gray700,cursor:"pointer",width:"100%",transition:"all 0.2s"}}
                  onMouseEnter={e=>{e.currentTarget.style.background=C.navy;e.currentTarget.style.color="#fff";e.currentTarget.style.borderColor=C.navy;}}
                  onMouseLeave={e=>{e.currentTarget.style.background="none";e.currentTarget.style.color=C.gray700;e.currentTarget.style.borderColor=C.gray300;}}>
                  ✉ Draft negotiation email
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CLAUSE VIEWER ── */}
      {view==="viewer"&&(
        <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:16,overflow:"hidden",display:"grid",gridTemplateColumns:"240px 1fr 1fr",minHeight:600}}>
          {/* Index */}
          <div style={{borderRight:`1px solid ${C.gray200}`,overflowY:"auto"}}>
            <div style={{padding:"14px 16px 10px",borderBottom:`1px solid ${C.gray100}`}}>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",color:C.gray500}}>Clauses</div>
            </div>
            {(result.clauses||[]).map(clause=>{
              const isActive=clause.id===activeId;
              const dc={high:C.red,medium:C.amber,low:C.green}[clause.risk];
              return(
                <div key={clause.id} onClick={()=>setActiveId(clause.id)} style={{padding:"12px 16px",cursor:"pointer",borderBottom:`1px solid ${C.gray100}`,background:isActive?C.bluePale:"transparent",borderLeft:isActive?`3px solid ${C.blue}`:"3px solid transparent",transition:"all 0.15s"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                    <div style={{width:7,height:7,borderRadius:"50%",background:dc,flexShrink:0}}/>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:isActive?600:400,color:isActive?C.navy:C.gray700,lineHeight:1.3}}>{clause.label}</div>
                  </div>
                  {clause.annualImpact&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.red,marginLeft:15}}>−${clause.annualImpact.toLocaleString()}/yr</div>}
                </div>
              );
            })}
          </div>

          {/* Contract text */}
          <div style={{borderRight:`1px solid ${C.gray200}`,overflowY:"auto",padding:"22px"}}>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",color:C.gray500,marginBottom:14}}>Your contract language</div>
            {(result.clauses||[]).map(clause=>{
              const isActive=clause.id===activeId;
              return(
                <div key={clause.id} onClick={()=>setActiveId(clause.id)} style={{borderRadius:10,padding:"13px 15px",marginBottom:10,cursor:"pointer",background:isActive?C.bluePale:C.white,border:isActive?`2px solid ${C.blue}`:`1px solid ${C.gray200}`,transition:"all 0.2s"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:isActive?C.blue:C.gray500}}>{clause.label}</div>
                    <RiskBadge risk={clause.risk}/>
                  </div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:isActive?C.navy:C.gray700,lineHeight:1.7}}>
                    {!isActive&&clause.contractText.length>180?clause.contractText.slice(0,180)+"...":clause.contractText}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Analysis panel */}
          {active&&(
            <div style={{overflowY:"auto",padding:"22px",background:C.offWhite}}>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",color:C.gray500,marginBottom:14}}>Personalized analysis</div>
              <RiskBadge risk={active.risk}/>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:C.navy,margin:"10px 0 4px",lineHeight:1.2}}>{active.label}</div>
              {active.annualImpact&&<div style={{fontFamily:"'DM Serif Display',serif",fontSize:28,color:C.red,marginBottom:12}}>−${active.annualImpact.toLocaleString()}<span style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:C.gray500}}>/year</span></div>}

              <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:10,padding:"16px 18px",marginBottom:14}}>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:C.gray500,marginBottom:8}}>What we found in your contract</div>
                <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:300,color:C.gray700,lineHeight:1.8,margin:0}}>{active.finding}</p>
              </div>

              <div style={{background:C.amberLight,border:`1px solid ${C.amber}`,borderRadius:10,padding:"14px 16px",marginBottom:14}}>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:C.amber,marginBottom:8}}>Our recommendation</div>
                <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:300,color:C.gray700,lineHeight:1.75,margin:0}}>{active.recommendation}</p>
              </div>

              <div style={{background:C.navy,borderRadius:10,padding:"16px 18px",marginBottom:14}}>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:C.blueLight,marginBottom:8}}>Take action</div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"rgba(255,255,255,0.65)",lineHeight:1.6,marginBottom:12}}>We've drafted a negotiation email using your specific contract terms and dollar amounts.</div>
                <Btn variant="teal" full size="sm" onClick={()=>openEmail(active)}>✉ Draft Negotiation Email</Btn>
              </div>

              {(result.clauses||[]).findIndex(c=>c.id===activeId)<(result.clauses||[]).length-1&&(
                <button onClick={()=>{const idx=(result.clauses||[]).findIndex(c=>c.id===activeId);setActiveId(result.clauses[idx+1].id);}}
                  style={{width:"100%",background:"none",border:`1px solid ${C.gray300}`,borderRadius:9,padding:"10px 14px",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:500,color:C.gray500,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",transition:"border-color 0.2s"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=C.blue}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=C.gray300}>
                  <span>Next: {(result.clauses||[])[(result.clauses||[]).findIndex(c=>c.id===activeId)+1]?.label}</span>
                  <span>→</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Invoice cross-sell */}
      <div style={{marginTop:28,background:`linear-gradient(135deg,${C.offWhite},${C.bluePale})`,border:`1px solid ${C.gray200}`,borderRadius:16,padding:"28px 32px",display:"grid",gridTemplateColumns:"1fr auto",gap:24,alignItems:"center"}}>
        <div>
          <Tag variant="teal">Next step — The Invoice</Tag>
          <h3 style={{fontFamily:"'DM Serif Display',serif",fontSize:24,color:C.navy,margin:"10px 0 8px"}}>
            Now see exactly what you're overpaying on every line item.
          </h3>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:300,color:C.gray500,lineHeight:1.7,maxWidth:540}}>
            Your agreement shows the rules of the game. Your weekly invoice shows the score. Upload your latest invoice and we'll identify specific products where you're being overcharged — starting with one free recommendation right now.
          </p>
        </div>
        <div style={{textAlign:"center",flexShrink:0}}>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,color:C.teal,marginBottom:6}}>Free to start</div>
          <Btn variant="teal" size="lg">Analyze My Invoice →</Btn>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.gray500,marginTop:8}}>No credit card · First rec. free</div>
        </div>
      </div>

      {/* Email modal */}
      {showEmailModal&&emailClause&&(
        <EmailModal clause={emailClause} contact={contact} result={result} onClose={()=>{setShowEmailModal(false);setEmailClause(null);}}/>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// EMAIL MODAL (personalized with actual contract terms)
// ─────────────────────────────────────────
function EmailModal({clause,contact,result,onClose}){
  const [copied,setCopied]=useState(false);

  // Build personalized email body
  const getEmail=()=>{
    const vendor=result?.vendor||"[Vendor Name]";
    const business=contact?.business||"[Business Name]";
    const name=contact?.name||"[Your Name]";

    const bodies={
      rental:`Dear ${vendor} Representative,

I'm reviewing our service agreement and would like to add a few clarifying terms before we finalize.

Specifically regarding item replacement and liability, I'd like the following language added:
- "Normal wear" shall be defined as gradual deterioration from standard use over a minimum of 6 months of service.
- Replacement costs for lost or damaged items shall not exceed 200% of the item's weekly rental fee multiplied by 52 weeks.
- All replacement items must be approved by an authorized company representative at ${business} prior to being placed into service.

Please confirm these additions can be included before we sign.

Thank you,
${name}
${business}`,

      term:`Dear ${vendor} Representative,

Before finalizing our service agreement, I'd like to discuss the renewal terms.

I'd like to request the following modifications:
1. Reduce the written cancellation notice period from 90 days to 30 days.
2. After the initial ${result?.contractTerm||12}-month term, the agreement converts to month-to-month rather than auto-renewing for another full term.

Please confirm these adjustments can be made.

Thank you,
${name}
${business}`,

      cancellation:`Dear ${vendor} Representative,

I have concerns about the minimum billing and cancellation provisions in our agreement at $${result?.weeklyValue}/week.

I'd like to negotiate the following:
1. Minimum billing: Reduce from 80% of agreement value to 50% of current invoice amount.
2. Cancellation penalty: Cap the early termination fee at a maximum of $500, regardless of weeks remaining.

At current rates, the uncapped cancellation clause represents significant exposure. A $500 cap brings this into a fair and standard range.

Thank you for your consideration,
${name}
${business}`,

      pricing:`Dear ${vendor} Representative,

I'd like to address the price adjustment language in our service agreement before signing.

I'd like to add the following language: "All pricing, service charges, and fees shall not increase by more than 3% per calendar year during the initial term. Any proposed increase beyond this cap requires 60 days written notice."

This is a reasonable protection that allows ${business} to plan and budget appropriately.

Best regards,
${name}
${business}`,

      ldp:`Dear ${vendor} Representative,

I'd like to request that the LDP Protection charge ($${result?.clauses?.find(c=>c.id==="ldp")?.annualImpact||73}/year) be removed from our agreement.

I prefer to track actual item losses weekly and address them individually as they occur, rather than paying a blanket weekly protection fee.

Please advise whether this charge can be removed.

Thank you,
${name}
${business}`,

      arbitration:`Dear ${vendor} Representative,

Before signing, I'd like to address the arbitration clause, specifically the requirement that all disputes be resolved in Philadelphia, PA.

Given that ${business} is located in ${result?.location||"[our city]"}, I'd like to request one of the following modifications:
1. Change the arbitration venue to ${result?.location||"our state"} or conducted via video conference.
2. Either party may initiate arbitration, not just the customer.

I'm open to arbitration as a dispute resolution method with these location modifications.

Thank you,
${name}
${business}`,

      governing:`Dear ${vendor} Representative,

Before we finalize our agreement, I'd like to confirm in writing all commitments discussed during our sales conversation.

Specifically, please confirm the following in writing as an addendum to our agreement:
[List all verbal commitments from your sales rep here]

I understand that the agreement supersedes all oral understandings, so I want to make sure everything we've discussed is captured in writing before we sign.

Thank you,
${name}
${business}`,
    };

    return bodies[clause.id]||`Dear ${vendor} Representative,\n\nRegarding the ${clause.label} section of our service agreement, I'd like to discuss the following:\n\n${clause.recommendation}\n\nPlease let me know if these modifications can be accommodated.\n\nThank you,\n${name}\n${business}`;
  };

  const emailText=getEmail();
  const copy=()=>{navigator.clipboard.writeText(emailText).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});};

  return(
    <div style={{position:"fixed",inset:0,zIndex:999,background:"rgba(8,30,56,0.8)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:C.white,borderRadius:18,width:"100%",maxWidth:620,maxHeight:"85vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 24px 80px rgba(12,45,84,0.25)",animation:"popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards"}}>
        <div style={{background:C.navy,padding:"18px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",color:C.blueLight,marginBottom:3}}>Personalized Negotiation Email</div>
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:18,color:"#fff"}}>{clause.label}</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"rgba(255,255,255,0.5)",fontSize:22,cursor:"pointer",lineHeight:1}}>×</button>
        </div>
        <div style={{padding:"22px",overflowY:"auto",flex:1}}>
          <div style={{background:C.bluePale,border:`1px solid rgba(61,128,200,0.2)`,borderRadius:10,padding:"12px 16px",marginBottom:16,fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.blueMid,lineHeight:1.6}}>
            💡 This email has been personalized with your vendor name, business name, and contract terms. Update the bracketed fields and send directly from your email client.
          </div>
          <div style={{background:C.offWhite,border:`1px solid ${C.gray200}`,borderRadius:10,padding:"20px"}}>
            <pre style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.gray700,lineHeight:1.8,whiteSpace:"pre-wrap",margin:0}}>{emailText}</pre>
          </div>
        </div>
        <div style={{padding:"16px 22px",borderTop:`1px solid ${C.gray200}`,display:"flex",gap:10,flexShrink:0}}>
          <Btn variant={copied?"ghost":"teal"} full onClick={copy}>{copied?"✓ Copied!":"Copy to Clipboard"}</Btn>
          <Btn variant="ghost" onClick={onClose}>Close</Btn>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────
export default function AgreementPage(){
  const [view,setView]=useState("landing"); // "landing"|"upload"|"contact"|"scanning"|"results"
  const [file,setFile]=useState(null);
  const [contact,setContact]=useState(null);
  const [result,setResult]=useState(null);

  const stepIndex={"landing":-1,"upload":0,"contact":1,"scanning":2,"results":3}[view];

  return(
    <>
      <style>{`
        ${FONTS}
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;}
        body{background:${C.offWhite};}
        @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(61,128,200,0.35)}50%{box-shadow:0 0 0 18px rgba(61,128,200,0)}}
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes popIn{from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {view==="landing"&&<><LandingPage onStart={()=>setView("upload")}/></>}
      {view!=="landing"&&<StepBar step={stepIndex}/>}
      {view==="upload"   &&<StepUpload  onNext={f=>{setFile(f);setView("contact");}}/>}
      {view==="contact"  &&<StepContact onNext={c=>{setContact(c);setView("scanning");}} onBack={()=>setView("upload")}/>}
      {view==="scanning" &&<StepScanning contact={contact} onDone={r=>{setResult(r);setView("results");}}/>}
      {view==="results"  &&<StepResults result={result} contact={contact}/>}
    </>
  );
}