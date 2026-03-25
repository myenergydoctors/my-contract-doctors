"use client";
import { useState } from "react";

const C = {
  navy:"#0C2D54",navyDark:"#081E38",blue:"#3D80C8",blueMid:"#2563A8",
  blueLight:"#6AAEE0",bluePale:"#E2EEFA",teal:"#17A882",tealLight:"#D4F2EA",
  white:"#FFFFFF",offWhite:"#F7F9FC",gray100:"#F0F4F8",gray200:"#E2E8F0",
  gray300:"#CBD5E1",gray500:"#64748B",gray700:"#334155",red:"#DC2626",
};
const FONTS=`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');`;

// Sample posts — in production these come from a CMS
const POSTS=[
  {
    slug:"what-is-auto-renewal-clause",
    category:"Know Your Contract",
    categoryColor:"red",
    title:"The Auto-Renewal Clause That's Costing Businesses Thousands",
    excerpt:"Most uniform service agreements auto-renew for another full term if you don't send written notice 90 days before the end date. Here's how to protect yourself.",
    author:"My Contract Doctors",
    date:"March 18, 2026",
    readTime:"5 min read",
    featured:true,
  },
  {
    slug:"how-to-negotiate-cancellation-fee",
    category:"Negotiation",
    categoryColor:"amber",
    title:"How to Negotiate Your Uniform Contract Cancellation Fee Down to $0",
    excerpt:"The 40% cancellation penalty in most uniform agreements is not set in stone. Here's the exact language to use when pushing back — and when to use it.",
    author:"My Contract Doctors",
    date:"March 11, 2026",
    readTime:"7 min read",
    featured:false,
  },
  {
    slug:"cintas-vs-unifirst-vs-alsco",
    category:"Vendor Comparison",
    categoryColor:"blue",
    title:"Cintas vs. UniFirst vs. ALSCO: Which Uniform Vendor Has the Fairest Contract?",
    excerpt:"We've analyzed contracts from all three major vendors. Here's how their terms, cancellation policies, and pricing structures actually compare.",
    author:"My Contract Doctors",
    date:"March 4, 2026",
    readTime:"9 min read",
    featured:false,
  },
  {
    slug:"ldp-protection-charge-explained",
    category:"Know Your Contract",
    categoryColor:"red",
    title:"LDP Protection: The Automatic Charge You Probably Didn't Notice",
    excerpt:"Loss Damage Protection is billed every week — whether you lose anything or not. We break down what it actually covers and how to get it removed.",
    author:"My Contract Doctors",
    date:"February 25, 2026",
    readTime:"4 min read",
    featured:false,
  },
  {
    slug:"floor-mat-rental-vs-purchase",
    category:"Save Money",
    categoryColor:"teal",
    title:"Floor Mat Rental vs. Purchase: The Numbers Might Surprise You",
    excerpt:"Renting floor mats from your uniform vendor can cost $400–$800 per year per location. Owning them outright costs about $50 each. We do the math.",
    author:"My Contract Doctors",
    date:"February 18, 2026",
    readTime:"6 min read",
    featured:false,
  },
  {
    slug:"service-charge-negotiation",
    category:"Negotiation",
    categoryColor:"amber",
    title:"The Weekly Service Charge Is the First Thing You Should Negotiate",
    excerpt:"The service charge is pure margin for the vendor — and it's the first line item they'll raise every year. Here's exactly how to get it waived on a new account.",
    author:"My Contract Doctors",
    date:"February 11, 2026",
    readTime:"5 min read",
    featured:false,
  },
  {
    slug:"what-is-minimum-billing",
    category:"Know Your Contract",
    categoryColor:"red",
    title:"Minimum Billing Guarantees: What They Mean and Why They Matter",
    excerpt:"80% minimum billing means even if you lay off half your staff, you still owe most of your original weekly amount. Here's how to negotiate this before you sign.",
    author:"My Contract Doctors",
    date:"February 4, 2026",
    readTime:"5 min read",
    featured:false,
  },
  {
    slug:"uniform-contract-checklist",
    category:"Resources",
    categoryColor:"blue",
    title:"The 10-Point Checklist to Review Before Signing Any Uniform Contract",
    excerpt:"Don't sign without running through this checklist. Covers term length, auto-renewal, minimum billing, cancellation penalties, price escalators, and more.",
    author:"My Contract Doctors",
    date:"January 28, 2026",
    readTime:"8 min read",
    featured:false,
  },
];

const CATEGORIES=["All","Know Your Contract","Negotiation","Vendor Comparison","Save Money","Resources"];

function Nav(){
  return(
    <nav style={{background:C.navy,padding:"0 32px",position:"sticky",top:0,zIndex:50,borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
      <div style={{maxWidth:1180,margin:"0 auto",height:64,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",flexDirection:"column",lineHeight:1}}>
          <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,fontWeight:600,letterSpacing:"0.22em",textTransform:"uppercase",color:C.blueLight}}>My</span>
          <div><span style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:"#fff"}}>Contract </span><span style={{fontFamily:"'DM Serif Display',serif",fontSize:22,fontStyle:"italic",color:C.blueLight}}>Doctors</span></div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:32}}>
          {["Demystifier","The Agreement","The Invoice","Blog"].map(l=>(
            <a key={l} href="#" style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:l==="Blog"?600:400,color:l==="Blog"?C.blueLight:"rgba(255,255,255,0.75)",textDecoration:"none",borderBottom:l==="Blog"?`2px solid ${C.teal}`:"none",paddingBottom:l==="Blog"?2:0}}>{l}</a>
          ))}
          <a href="#" style={{background:C.teal,color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:500,padding:"9px 20px",borderRadius:8,textDecoration:"none"}}>Get Started</a>
        </div>
      </div>
    </nav>
  );
}

function CategoryTag({category,color}){
  const map={red:{bg:"#FEE2E2",color:C.red},amber:{bg:"#FEF3C7",color:C.amber},blue:{bg:C.bluePale,color:C.blueMid},teal:{bg:C.tealLight,color:"#0D6E52"},navy:{bg:C.navy,color:C.blueLight}};
  const s=map[color]||map.blue;
  return <span style={{background:s.bg,color:s.color,fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:20,display:"inline-block"}}>{category}</span>;
}

export default function BlogIndex(){
  const [activeCategory,setActiveCategory]=useState("All");
  const [search,setSearch]=useState("");

  const filtered=POSTS.filter(p=>{
    const matchCat=activeCategory==="All"||p.category===activeCategory;
    const matchSearch=!search||p.title.toLowerCase().includes(search.toLowerCase())||p.excerpt.toLowerCase().includes(search.toLowerCase());
    return matchCat&&matchSearch;
  });

  const featured=POSTS.find(p=>p.featured);
  const rest=filtered.filter(p=>!p.featured||activeCategory!=="All"||search);

  return(
    <>
      <style>{`${FONTS} *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;} body{background:${C.offWhite};} input::placeholder{color:${C.gray300};}`}</style>
      <Nav/>

      {/* Header */}
      <section style={{background:`linear-gradient(160deg,${C.navyDark},${C.navy})`,padding:"88px 32px 72px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,opacity:0.04,backgroundImage:`linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)`,backgroundSize:"48px 48px"}}/>
        <div style={{maxWidth:700,margin:"0 auto",textAlign:"center",position:"relative",zIndex:2}}>
          <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,letterSpacing:"0.16em",textTransform:"uppercase",color:C.teal,display:"block",marginBottom:14}}>The MCD Blog</span>
          <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(32px,4vw,48px)",color:"#fff",lineHeight:1.1,marginBottom:18}}>
            Know your contract.<br/><em style={{fontStyle:"italic",color:C.blueLight}}>Know your rights.</em>
          </h1>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:16,fontWeight:300,color:"rgba(255,255,255,0.65)",lineHeight:1.75,marginBottom:32}}>Plain-English guides on uniform and linen contracts, negotiation tactics, and how to keep more of your money.</p>
          {/* Search */}
          <div style={{position:"relative",maxWidth:480,margin:"0 auto"}}>
            <input type="text" placeholder="Search articles..." value={search} onChange={e=>setSearch(e.target.value)}
              style={{width:"100%",padding:"14px 20px 14px 48px",borderRadius:10,border:"none",fontFamily:"'DM Sans',sans-serif",fontSize:14,color:C.navy,outline:"none",background:C.white,boxShadow:"0 4px 20px rgba(8,30,56,0.2)"}}/>
            <span style={{position:"absolute",left:16,top:"50%",transform:"translateY(-50%)",fontSize:16,opacity:0.4}}>🔍</span>
          </div>
        </div>
      </section>

      {/* Category filter */}
      <div style={{background:C.white,borderBottom:`1px solid ${C.gray200}`,padding:"0 32px",position:"sticky",top:64,zIndex:40}}>
        <div style={{maxWidth:1180,margin:"0 auto",display:"flex",gap:4,overflowX:"auto",padding:"12px 0"}}>
          {CATEGORIES.map(cat=>(
            <button key={cat} onClick={()=>setActiveCategory(cat)} style={{padding:"7px 16px",borderRadius:20,border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500,whiteSpace:"nowrap",background:activeCategory===cat?C.navy:"transparent",color:activeCategory===cat?C.white:C.gray500,transition:"all 0.2s"}}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <section style={{maxWidth:1180,margin:"0 auto",padding:"56px 32px 80px"}}>

        {/* Featured post */}
        {featured&&activeCategory==="All"&&!search&&(
          <div style={{marginBottom:56}}>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,letterSpacing:"0.14em",textTransform:"uppercase",color:C.gray500,marginBottom:16}}>Featured article</div>
            <a href="#" style={{textDecoration:"none",display:"block"}}>
              <div style={{background:C.navy,borderRadius:18,overflow:"hidden",display:"grid",gridTemplateColumns:"1fr 1fr",transition:"transform 0.2s",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-3px)"} onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
                {/* Text */}
                <div style={{padding:"48px 48px"}}>
                  <div style={{marginBottom:20}}><CategoryTag category={featured.category} color={featured.categoryColor}/></div>
                  <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(22px,2.5vw,32px)",color:"#fff",lineHeight:1.2,marginBottom:16}}>{featured.title}</h2>
                  <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:300,color:"rgba(255,255,255,0.65)",lineHeight:1.75,marginBottom:28}}>{featured.excerpt}</p>
                  <div style={{display:"flex",alignItems:"center",gap:16}}>
                    <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"rgba(255,255,255,0.4)"}}>{featured.date}</span>
                    <span style={{width:4,height:4,borderRadius:"50%",background:"rgba(255,255,255,0.2)"}}/>
                    <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"rgba(255,255,255,0.4)"}}>{featured.readTime}</span>
                  </div>
                </div>
                {/* Visual */}
                <div style={{background:`linear-gradient(135deg,#153D6B,#0D2440)`,display:"flex",alignItems:"center",justifyContent:"center",padding:48}}>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontFamily:"'DM Serif Display',serif",fontSize:72,fontStyle:"italic",color:"rgba(255,255,255,0.08)",lineHeight:1,marginBottom:16,userSelect:"none"}}>AUTO<br/>RENEW</div>
                    <div style={{background:C.tealLight,color:"#0D6E52",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,padding:"6px 16px",borderRadius:20,display:"inline-block"}}>Most businesses miss this</div>
                  </div>
                </div>
              </div>
            </a>
          </div>
        )}

        {/* Post grid */}
        {rest.length>0?(
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:24}}>
            {rest.map(post=>(
              <PostCard key={post.slug} post={post}/>
            ))}
          </div>
        ):(
          <div style={{textAlign:"center",padding:"60px 0"}}>
            <div style={{fontSize:40,marginBottom:16}}>🔍</div>
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:C.navy,marginBottom:8}}>No articles found</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:C.gray500}}>Try a different search term or category.</div>
          </div>
        )}

        {/* Newsletter signup */}
        <div style={{marginTop:72,background:`linear-gradient(135deg,${C.navy},#153D6B)`,borderRadius:18,padding:"48px",textAlign:"center"}}>
          <h3 style={{fontFamily:"'DM Serif Display',serif",fontSize:28,color:"#fff",marginBottom:10}}>Get contract tips in your inbox</h3>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:300,color:"rgba(255,255,255,0.6)",marginBottom:28,maxWidth:460,margin:"0 auto 28px"}}>New articles, negotiation scripts, and savings tips — delivered monthly. No spam.</p>
          <div style={{display:"flex",gap:10,justifyContent:"center",maxWidth:420,margin:"0 auto"}}>
            <input type="email" placeholder="your@email.com" style={{flex:1,padding:"13px 16px",borderRadius:8,border:"none",fontFamily:"'DM Sans',sans-serif",fontSize:14,color:C.navy,outline:"none"}}/>
            <button style={{background:C.teal,color:"#fff",border:"none",borderRadius:8,padding:"13px 22px",fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:500,cursor:"pointer",whiteSpace:"nowrap"}}>Subscribe</button>
          </div>
        </div>
      </section>
    </>
  );
}

function PostCard({post}){
  return(
    <a href="#" style={{textDecoration:"none",display:"block"}}>
      <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:14,overflow:"hidden",transition:"all 0.2s",height:"100%"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 8px 32px rgba(12,45,84,0.1)";}} onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
        {/* Color band top */}
        <div style={{height:4,background:{red:C.red,amber:C.amber,blue:C.blue,teal:C.teal}[post.categoryColor]||C.blue}}/>
        <div style={{padding:"24px 24px 20px"}}>
          <div style={{marginBottom:14}}><CategoryTag category={post.category} color={post.categoryColor}/></div>
          <h3 style={{fontFamily:"'DM Serif Display',serif",fontSize:19,color:C.navy,lineHeight:1.25,marginBottom:10}}>{post.title}</h3>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:300,color:C.gray500,lineHeight:1.7,marginBottom:20}}>{post.excerpt}</p>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:16,borderTop:`1px solid ${C.gray100}`}}>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.gray500}}>{post.date}</span>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.blue,fontWeight:500}}>{post.readTime}</span>
          </div>
        </div>
      </div>
    </a>
  );
}