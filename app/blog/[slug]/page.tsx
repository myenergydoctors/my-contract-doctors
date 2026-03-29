"use client";
import { useParams } from "next/navigation";
import { useState } from "react";
import { posts } from "@/lib/posts";

const C = {
  navy:"#0C2D54",navyDark:"#081E38",blue:"#3D80C8",blueMid:"#2563A8",
  blueLight:"#6AAEE0",bluePale:"#E2EEFA",teal:"#17A882",tealLight:"#D4F2EA",
  white:"#FFFFFF",offWhite:"#F7F9FC",gray100:"#F0F4F8",gray200:"#E2E8F0",
  gray300:"#CBD5E1",gray500:"#64748B",gray700:"#334155",
  red:"#DC2626",redLight:"#FEE2E2",amber:"#D97706",amberLight:"#FEF3C7",
};

const FONTS=`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');`;

function CategoryTag({category,color}:{category:string,color:string}){
  const map:{[key:string]:{bg:string,color:string}} = {
    red:{bg:C.redLight,color:C.red},
    amber:{bg:C.amberLight,color:C.amber},
    blue:{bg:C.bluePale,color:C.blueMid},
    teal:{bg:C.tealLight,color:"#0D6E52"},
  };
  const s=map[color]||map.blue;
  return <span style={{background:s.bg,color:s.color,fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:20,display:"inline-block"}}>{category}</span>;
}

function BodyBlock({block}:{block:any}){
  switch(block.type){
    case "h2": return <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:28,color:C.navy,lineHeight:1.2,margin:"40px 0 16px"}}>{block.text}</h2>;
    case "h3": return <h3 style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:C.navy,lineHeight:1.2,margin:"32px 0 12px"}}>{block.text}</h3>;
    case "p":  return <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:16,fontWeight:300,color:C.gray700,lineHeight:1.85,marginBottom:20}}>{block.text}</p>;
    case "quote": return (
      <blockquote style={{borderLeft:`4px solid ${C.blue}`,margin:"28px 0",padding:"16px 24px",background:C.bluePale,borderRadius:"0 10px 10px 0"}}>
        <p style={{fontFamily:"'DM Serif Display',serif",fontStyle:"italic",fontSize:18,color:C.navy,lineHeight:1.6,margin:0}}>{block.text}</p>
      </blockquote>
    );
    case "list": return (
      <ul style={{paddingLeft:0,listStyle:"none",margin:"0 0 20px"}}>
        {block.items.map((item:string,i:number)=>(
          <li key={i} style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:10}}>
            <span style={{color:C.teal,fontSize:16,flexShrink:0,lineHeight:1.6}}>→</span>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:300,color:C.gray700,lineHeight:1.7}}>{item}</span>
          </li>
        ))}
      </ul>
    );
    case "callout":{
      const styles:{[key:string]:{bg:string,border:string,titleColor:string}} = {
        red:{bg:C.redLight,border:C.red,titleColor:C.red},
        teal:{bg:C.tealLight,border:C.teal,titleColor:"#0D6E52"},
        amber:{bg:C.amberLight,border:C.amber,titleColor:C.amber},
        blue:{bg:C.bluePale,border:C.blue,titleColor:C.blueMid},
      };
      const s=styles[block.variant]||styles.blue;
      return(
        <div style={{background:s.bg,border:`1px solid ${s.border}`,borderLeft:`4px solid ${s.border}`,borderRadius:"0 10px 10px 0",padding:"18px 22px",margin:"28px 0"}}>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:s.titleColor,marginBottom:6}}>{block.title}</div>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:300,color:C.gray700,lineHeight:1.75,margin:0}}>{block.text}</p>
        </div>
      );
    }
    default: return null;
  }
}

export default function BlogPostPage(){
  const params = useParams();
  const slug = params.slug as string;
  const [email,setEmail]=useState("");
  const [subscribed,setSubscribed]=useState(false);

  // Find post metadata
  const post = posts.find(p => p.slug === slug);

  // Dynamically load content
  const [content, setContent] = useState<any[]>([]);
  useState(() => {
    import(`@/lib/posts/${slug}`)
      .then(mod => setContent(mod.content))
      .catch(() => setContent([]));
  });

  if(!post) return (
    <div style={{maxWidth:760,margin:"80px auto",padding:"80px 24px",textAlign:"center"}}>
      <div style={{fontFamily:"'DM Serif Display',serif",fontSize:32,color:C.navy,marginBottom:16}}>Post not found</div>
      <a href="/blog" style={{color:C.blue}}>← Back to blog</a>
    </div>
  );

  const related = posts.filter(p => p.slug !== slug && p.category === post.category).slice(0,3);

  return(
    <>
      <style>{`${FONTS} *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}`}</style>

      {/* Article header */}
      <section style={{background:`linear-gradient(160deg,${C.navyDark},${C.navy})`,padding:"100px 32px 72px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,opacity:0.04,backgroundImage:`linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)`,backgroundSize:"48px 48px"}}/>
        <div style={{maxWidth:760,margin:"0 auto",position:"relative",zIndex:2}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20}}>
            <a href="/blog" style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"rgba(255,255,255,0.5)",textDecoration:"none"}}>Blog</a>
            <span style={{color:"rgba(255,255,255,0.3)"}}>›</span>
            <CategoryTag category={post.category} color={post.categoryColor}/>
          </div>
          <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(28px,4vw,46px)",color:"#fff",lineHeight:1.1,marginBottom:18}}>{post.title}</h1>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:17,fontWeight:300,color:"rgba(255,255,255,0.65)",lineHeight:1.75,marginBottom:28}}>{post.excerpt}</p>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{width:36,height:36,borderRadius:"50%",background:C.teal,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontFamily:"'DM Serif Display',serif",fontSize:14,color:"#fff"}}>M</div>
            <div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500,color:"rgba(255,255,255,0.85)"}}>My Contract Doctors</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"rgba(255,255,255,0.45)"}}>{post.date} · {post.readTime}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Body + sidebar */}
      <section style={{maxWidth:1100,margin:"0 auto",padding:"64px 32px 80px",display:"grid",gridTemplateColumns:"1fr 320px",gap:64,alignItems:"start"}}>

        {/* Article body */}
        <article>
          {content.length > 0
            ? content.map((block,i) => <BodyBlock key={i} block={block}/>)
            : <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:15,color:C.gray500}}>Loading...</p>
          }

          {/* Article CTA */}
          <div style={{marginTop:48,background:`linear-gradient(135deg,${C.navy},#153D6B)`,borderRadius:16,padding:"32px 36px"}}>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",color:C.teal,marginBottom:10}}>Ready to take action?</div>
            <h3 style={{fontFamily:"'DM Serif Display',serif",fontSize:24,color:"#fff",marginBottom:10,lineHeight:1.2}}>See what's hiding in your own contract.</h3>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:300,color:"rgba(255,255,255,0.65)",lineHeight:1.7,marginBottom:20}}>The Demystifier walks you through every clause for $49.99. Or upload your actual agreement for a fully personalized analysis.</p>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <a href="/demystifier" style={{background:C.teal,color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:500,padding:"11px 22px",borderRadius:8,textDecoration:"none"}}>Explore the Demystifier →</a>
              <a href="/agreement" style={{background:"rgba(255,255,255,0.1)",color:"#fff",border:"1px solid rgba(255,255,255,0.2)",fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:500,padding:"11px 22px",borderRadius:8,textDecoration:"none"}}>Upload My Agreement</a>
            </div>
          </div>

          {/* Related posts */}
          {related.length > 0 && (
            <div style={{marginTop:48}}>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,letterSpacing:"0.14em",textTransform:"uppercase",color:C.gray500,marginBottom:20}}>Related articles</div>
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                {related.map(p=>(
                  <a key={p.slug} href={`/blog/${p.slug}`} style={{textDecoration:"none",display:"block"}}>
                    <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,padding:"18px 20px",display:"flex",gap:14,alignItems:"flex-start"}}>
                      <div style={{height:32,width:4,borderRadius:2,background:{red:C.red,amber:C.amber,blue:C.blue,teal:C.teal}[p.categoryColor],flexShrink:0,marginTop:2}}/>
                      <div style={{flex:1}}>
                        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,color:C.gray500,marginBottom:4}}>{p.category} · {p.readTime}</div>
                        <div style={{fontFamily:"'DM Serif Display',serif",fontSize:16,color:C.navy,lineHeight:1.3}}>{p.title}</div>
                      </div>
                      <span style={{color:C.blue,fontSize:16,flexShrink:0}}>→</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* Sidebar */}
        <aside style={{position:"sticky",top:88,display:"flex",flexDirection:"column",gap:20}}>
          {/* Product CTA */}
          <div style={{background:C.navy,borderRadius:14,padding:"22px"}}>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",color:C.teal,marginBottom:8}}>The Demystifier</div>
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:18,color:"#fff",marginBottom:8,lineHeight:1.3}}>Know every clause. Negotiate every term.</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:300,color:"rgba(255,255,255,0.6)",lineHeight:1.65,marginBottom:16}}>Interactive walkthrough of every clause in a standard uniform agreement. $49.99, instant access.</div>
            <a href="/demystifier" style={{display:"block",background:C.teal,color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500,padding:"10px 16px",borderRadius:8,textDecoration:"none",textAlign:"center"}}>Get Instant Access →</a>
          </div>

          {/* Newsletter */}
          <div style={{background:C.offWhite,border:`1px solid ${C.gray200}`,borderRadius:14,padding:"22px"}}>
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:18,color:C.navy,marginBottom:6,lineHeight:1.3}}>Get tips like this monthly</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:300,color:C.gray500,lineHeight:1.6,marginBottom:14}}>No spam. Just contract knowledge and savings tips.</div>
            {!subscribed ? <>
              <input type="email" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)}
                style={{width:"100%",padding:"10px 12px",borderRadius:8,border:`1.5px solid ${C.gray300}`,fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.navy,outline:"none",marginBottom:8}}/>
              <button onClick={()=>email&&setSubscribed(true)}
                style={{width:"100%",padding:"10px",background:C.blue,color:"#fff",border:"none",borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500,cursor:"pointer"}}>
                Subscribe
              </button>
            </> : (
              <div style={{textAlign:"center",padding:"8px 0"}}>
                <div style={{fontSize:24,marginBottom:8}}>✓</div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.teal,fontWeight:500}}>You're subscribed!</div>
              </div>
            )}
          </div>
        </aside>
      </section>
    </>
  );
}