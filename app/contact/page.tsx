"use client";
import { useState } from "react";

const C = {
  navy:"#0C2D54",navyDark:"#081E38",blue:"#3D80C8",blueMid:"#2563A8",
  blueLight:"#6AAEE0",bluePale:"#E2EEFA",teal:"#17A882",tealLight:"#D4F2EA",
  white:"#FFFFFF",offWhite:"#F7F9FC",gray100:"#F0F4F8",gray200:"#E2E8F0",
  gray300:"#CBD5E1",gray500:"#64748B",gray700:"#334155",
};
const FONTS=`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');`;

function Nav(){
  return(
    <nav style={{background:C.navy,padding:"0 32px",position:"sticky",top:0,zIndex:50,borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
      <div style={{maxWidth:1180,margin:"0 auto",height:64,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",flexDirection:"column",lineHeight:1}}>
          <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,fontWeight:600,letterSpacing:"0.22em",textTransform:"uppercase",color:C.blueLight}}>My</span>
          <div><span style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:"#fff"}}>Contract </span><span style={{fontFamily:"'DM Serif Display',serif",fontSize:22,fontStyle:"italic",color:C.blueLight}}>Doctors</span></div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:32}}>
          {["Demystifier","The Agreement","The Invoice","Our Shop"].map(l=>(
            <a key={l} href="#" style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"rgba(255,255,255,0.75)",textDecoration:"none"}}>{l}</a>
          ))}
          <a href="#" style={{background:C.teal,color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:500,padding:"9px 20px",borderRadius:8,textDecoration:"none"}}>Get Started</a>
        </div>
      </div>
    </nav>
  );
}

function Footer(){
  return(
    <footer style={{background:C.navyDark,padding:"48px 32px 28px"}}>
      <div style={{maxWidth:1180,margin:"0 auto"}}>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:48,marginBottom:48}}>
          <div>
            <div style={{marginBottom:14}}>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,fontWeight:600,letterSpacing:"0.22em",textTransform:"uppercase",color:C.blueLight,display:"block"}}>My</span>
              <div><span style={{fontFamily:"'DM Serif Display',serif",fontSize:20,color:"#fff"}}>Contract </span><span style={{fontFamily:"'DM Serif Display',serif",fontSize:20,fontStyle:"italic",color:C.blueLight}}>Doctors</span></div>
            </div>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:300,color:"rgba(255,255,255,0.45)",lineHeight:1.7,maxWidth:260}}>We're on your side, not the vendor's. Helping businesses demystify their uniform and linen agreements since 2026.</p>
          </div>
          {[{heading:"Products",links:["The Invoice","The Agreement","The Demystifier","Our Shop"]},{heading:"Company",links:["About Us","Contact","Blog","My Energy Doctors"]},{heading:"Legal",links:["Privacy Policy","Terms & Conditions","ADA Compliance"]}].map(({heading,links})=>(
            <div key={heading}>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,letterSpacing:"0.14em",textTransform:"uppercase",color:C.blueLight,marginBottom:16}}>{heading}</div>
              {links.map(l=><a key={l} href="#" style={{display:"block",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:300,color:"rgba(255,255,255,0.5)",textDecoration:"none",marginBottom:10}}>{l}</a>)}
            </div>
          ))}
        </div>
        <div style={{borderTop:"1px solid rgba(255,255,255,0.08)",paddingTop:24,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
          <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"rgba(255,255,255,0.3)"}}>© 2026 My Contract Doctors | Website by OSC Web Design</span>
          <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"rgba(255,255,255,0.3)"}}>A sister company of My Energy Doctors</span>
        </div>
      </div>
    </footer>
  );
}

export default function ContactPage(){
  const [form,setForm]=useState({name:"",email:"",phone:"",message:""});
  const [submitted,setSubmitted]=useState(false);
  const [errors,setErrors]=useState({});
  const set=k=>e=>setForm(f=>({...f,[k]:e.target.value}));

  const validate=()=>{
    const e={};
    if(!form.name.trim())e.name="Name is required";
    if(!form.email.trim())e.email="Email is required";
    else if(!/\S+@\S+\.\S+/.test(form.email))e.email="Please enter a valid email";
    if(!form.message.trim())e.message="Please include a message";
    return e;
  };

  const handleSubmit=()=>{
    const e=validate();
    if(Object.keys(e).length){setErrors(e);return;}
    setSubmitted(true);
  };

  const iSt=(field)=>({
    width:"100%",padding:"12px 14px",borderRadius:8,
    border:`1.5px solid ${errors[field]?C.red:C.gray300}`,
    fontFamily:"'DM Sans',sans-serif",fontSize:14,color:C.navy,
    background:C.white,outline:"none",transition:"border-color 0.2s",
  });
  const lSt={fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,color:C.gray700,marginBottom:6,display:"block"};
  const errSt={fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.red,marginTop:4};
  const fo=(field)=>e=>{
    if(!errors[field])e.target.style.borderColor=C.blue;
  };
  const bl=(field)=>e=>{
    e.target.style.borderColor=errors[field]?C.red:C.gray300;
  };

  const contactInfo=[
    {icon:"📞",label:"Phone",value:"(XXX) XXX-XXXX",sub:"Monday–Friday, 9am–5pm EST"},
    {icon:"✉️",label:"Email",value:"hello@mycontractdoctors.com",sub:"We respond within one business day"},
    {icon:"🕐",label:"Hours",value:"Mon–Fri: 9am – 5pm EST",sub:"Closed weekends and major holidays"},
  ];

  return(
    <>
      <style>{`${FONTS} *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;} body{background:${C.offWhite};} input::placeholder,textarea::placeholder{color:${C.gray300};}`}</style>
      <Nav/>

      {/* Hero */}
      <section style={{background:`linear-gradient(160deg,${C.navyDark} 0%,${C.navy} 100%)`,padding:"100px 32px 72px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,opacity:0.04,backgroundImage:`linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)`,backgroundSize:"48px 48px"}}/>
        <div style={{maxWidth:640,margin:"0 auto",textAlign:"center",position:"relative",zIndex:2}}>
          <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,letterSpacing:"0.16em",textTransform:"uppercase",color:C.teal,display:"block",marginBottom:14}}>Get in touch</span>
          <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(32px,4.5vw,50px)",color:"#fff",lineHeight:1.1,marginBottom:18}}>
            We're on your side.<br/><em style={{fontStyle:"italic",color:C.blueLight}}>Ask us anything.</em>
          </h1>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:16,fontWeight:300,color:"rgba(255,255,255,0.7)",lineHeight:1.75}}>Have a question about your contract, our products, or how we can help? We'd love to hear from you.</p>
        </div>
      </section>

      {/* Main content */}
      <section style={{padding:"80px 32px",background:C.offWhite}}>
        <div style={{maxWidth:1060,margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:64,alignItems:"start"}}>

          {/* Form */}
          <div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,letterSpacing:"0.16em",textTransform:"uppercase",color:C.blue,marginBottom:12}}>Send us a message</div>
            <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:32,color:C.navy,marginBottom:8,lineHeight:1.15}}>How can we help?</h2>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:300,color:C.gray500,lineHeight:1.7,marginBottom:32}}>Fill out the form and one of our contract specialists will get back to you within one business day.</p>

            {!submitted?(
              <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:16,padding:"32px"}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18}}>
                  <div>
                    <label style={lSt}>Full name *</label>
                    <input style={iSt("name")} type="text" placeholder="Jane Smith" value={form.name} onChange={set("name")} onFocus={fo("name")} onBlur={bl("name")}/>
                    {errors.name&&<div style={errSt}>{errors.name}</div>}
                  </div>
                  <div>
                    <label style={lSt}>Phone number</label>
                    <input style={iSt("phone")} type="tel" placeholder="(555) 000-0000" value={form.phone} onChange={set("phone")} onFocus={fo("phone")} onBlur={bl("phone")}/>
                  </div>
                </div>
                <div style={{marginBottom:18}}>
                  <label style={lSt}>Email address *</label>
                  <input style={iSt("email")} type="email" placeholder="jane@yourbusiness.com" value={form.email} onChange={set("email")} onFocus={fo("email")} onBlur={bl("email")}/>
                  {errors.email&&<div style={errSt}>{errors.email}</div>}
                </div>
                <div style={{marginBottom:24}}>
                  <label style={lSt}>How can we help? *</label>
                  <textarea style={{...iSt("message"),resize:"vertical",minHeight:140,lineHeight:1.7}} placeholder="Tell us about your situation — which vendor you use, what you're trying to understand, or any questions you have about your agreement or invoice..." value={form.message} onChange={set("message")} onFocus={fo("message")} onBlur={bl("message")}/>
                  {errors.message&&<div style={errSt}>{errors.message}</div>}
                </div>
                <button onClick={handleSubmit} style={{width:"100%",padding:"14px",background:C.teal,color:"#fff",border:"none",borderRadius:9,fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:500,cursor:"pointer",boxShadow:"0 4px 20px rgba(23,168,130,0.3)",transition:"opacity 0.2s"}} onMouseEnter={e=>e.currentTarget.style.opacity="0.88"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                  Send Message →
                </button>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.gray500,textAlign:"center",marginTop:12}}>We typically respond within one business day.</div>
              </div>
            ):(
              <div style={{background:C.white,border:`2px solid ${C.teal}`,borderRadius:16,padding:"48px 32px",textAlign:"center"}}>
                <div style={{width:64,height:64,borderRadius:"50%",background:C.tealLight,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:28}}>✓</div>
                <h3 style={{fontFamily:"'DM Serif Display',serif",fontSize:26,color:C.navy,marginBottom:10}}>Message received!</h3>
                <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:300,color:C.gray500,lineHeight:1.7,marginBottom:24}}>
                  Thank you, {form.name.split(" ")[0]}. We'll be in touch at <strong>{form.email}</strong> within one business day.
                </p>
                <button onClick={()=>{setSubmitted(false);setForm({name:"",email:"",phone:"",message:""}); setErrors({});}} style={{background:"none",border:`1px solid ${C.gray300}`,borderRadius:8,padding:"10px 20px",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.gray700,cursor:"pointer"}}>Send another message</button>
              </div>
            )}
          </div>

          {/* Contact info + FAQ */}
          <div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,letterSpacing:"0.16em",textTransform:"uppercase",color:C.blue,marginBottom:12}}>Contact information</div>
            <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:32,color:C.navy,marginBottom:32,lineHeight:1.15}}>Reach us directly</h2>

            {/* Contact cards */}
            <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:40}}>
              {contactInfo.map(({icon,label,value,sub})=>(
                <div key={label} style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:14,padding:"20px 22px",display:"flex",gap:16,alignItems:"flex-start"}}>
                  <div style={{width:44,height:44,borderRadius:11,background:C.bluePale,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{icon}</div>
                  <div>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:C.gray500,marginBottom:3}}>{label}</div>
                    <div style={{fontFamily:"'DM Serif Display',serif",fontSize:18,color:C.navy,marginBottom:3}}>{value}</div>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:300,color:C.gray500}}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* FAQ */}
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,letterSpacing:"0.16em",textTransform:"uppercase",color:C.blue,marginBottom:16}}>Common questions</div>
            {[
              {q:"Which vendors do you work with?",a:"We work with all major uniform and linen service providers including Cintas, UniFirst, ALSCO, ImageFirst, Aramark, G&K Services, and more. The clause patterns are similar across all vendors."},
              {q:"Do I need to upload my contract to get started?",a:"No — The Demystifier requires no upload at all. You can start learning about your agreement rights immediately. Uploading your contract is only required for The Agreement personalized analysis."},
              {q:"Is my contract information kept private?",a:"Yes. Your uploaded documents are encrypted in transit and at rest, are never sold or shared with third parties, and are used only to generate your analysis."},
              {q:"What if I don't have a digital copy of my agreement?",a:"No problem — use our QR code mobile upload feature to photograph your paper agreement with your phone and it'll be linked to your session automatically."},
            ].map(({q,a},i)=>(
              <FAQItem key={i} q={q} a={a}/>
            ))}

            {/* Sister company */}
            <div style={{marginTop:32,background:`linear-gradient(135deg,${C.navy},#153D6B)`,borderRadius:14,padding:"22px 24px",display:"flex",gap:16,alignItems:"center"}}>
              <div style={{flex:1}}>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:C.blueLight,marginBottom:4}}>Sister company</div>
                <div style={{fontFamily:"'DM Serif Display',serif",fontSize:18,color:"#fff",marginBottom:4}}>My Energy Doctors</div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:300,color:"rgba(255,255,255,0.6)",lineHeight:1.6}}>Save 15–30% on your commercial energy bills. Same trusted team, different expertise.</div>
              </div>
              <a href="https://myenergydoctors.com" target="_blank" rel="noopener noreferrer" style={{background:"rgba(255,255,255,0.12)",color:"#fff",border:"1px solid rgba(255,255,255,0.2)",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500,padding:"9px 16px",borderRadius:8,textDecoration:"none",flexShrink:0,whiteSpace:"nowrap"}}>Visit Site →</a>
            </div>
          </div>
        </div>
      </section>

      <Footer/>
    </>
  );
}

function FAQItem({q,a}){
  const [open,setOpen]=useState(false);
  return(
    <div style={{borderBottom:`1px solid ${C.gray200}`,paddingBottom:0}}>
      <button onClick={()=>setOpen(o=>!o)} style={{width:"100%",background:"none",border:"none",padding:"16px 0",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",gap:12}}>
        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:500,color:C.navy,textAlign:"left",lineHeight:1.4}}>{q}</span>
        <span style={{color:C.blue,fontSize:18,flexShrink:0,transform:open?"rotate(45deg)":"rotate(0deg)",transition:"transform 0.2s",lineHeight:1}}>+</span>
      </button>
      {open&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:300,color:C.gray500,lineHeight:1.75,paddingBottom:16}}>{a}</div>}
    </div>
  );
}