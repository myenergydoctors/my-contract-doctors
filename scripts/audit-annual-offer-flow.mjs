// Opt-in, no-charge offer verification. No email is sent and no privileges are granted.
import env from '@next/env';import {createClient} from '@supabase/supabase-js';import {createServerClient} from '@supabase/ssr';import {randomUUID} from 'node:crypto';import {mkdir,writeFile} from 'node:fs/promises';import {removeDisposableAccount} from './lib/qa-cleanup.mjs';
env.loadEnvConfig(process.env.OFFER_AUDIT_ENV_DIR||process.cwd());
const project='xrchncayomnwcnphrwhx',url=process.env.NEXT_PUBLIC_SUPABASE_URL,origin=process.env.OFFER_AUDIT_ORIGIN||'http://localhost:3004';
if(process.env.OFFER_AUDIT_PROJECT!==project||new URL(url).hostname!==`${project}.supabase.co`||!['localhost','127.0.0.1'].includes(new URL(origin).hostname))throw new Error('Explicitly select the MCD project and localhost origin.');
const db=createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}}),users=[],emails=[],checks=[],run=randomUUID();
const ok=r=>{if(r.error)throw new Error(r.error.message);return r.data;};const check=(name,passed)=>{checks.push({name,passed});console.log(JSON.stringify({name,passed}));if(!passed)throw new Error(name);};
async function account(label){const email=`account-flow-offer-${label}-${run}@example.invalid`,password=randomUUID();const user=ok(await db.auth.admin.createUser({email,password,email_confirm:true})).user;users.push(user.id);emails.push(email);const jar=new Map();const client=createServerClient(url,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:values=>values.forEach(({name,value})=>jar.set(name,value))}});ok(await client.auth.signInWithPassword({email,password}));return{id:user.id,email,jar,client};}
async function request(person,path,method='GET',body,headers={}){const response=await fetch(origin+path,{method,headers:{Origin:origin,'X-Forwarded-For':`198.18.${parseInt(run.slice(0,2),16)}.${parseInt(run.slice(2,4),16)}`,...(person?{Cookie:[...person.jar].map(([k,v])=>`${k}=${v}`).join('; ')}:{}),...(body?{'Content-Type':'application/json'}:{}),...headers},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(60000)});return{status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie')};}
try{
 const owner=await account('owner'),other=await account('other');
 const cookies=[...owner.jar].map(([k,v])=>`${k}=${v}`).join('; ');
 const resume=await fetch(origin+'/sign-in?redirect='+encodeURIComponent('/checkout/pro-annual?offer=annual30-v1'),{headers:{Cookie:cookies},redirect:'manual'});
 check('Sign-in preserves the annual-offer checkout destination',resume.status===307&&new URL(resume.headers.get('location'),origin).href===origin+'/checkout/pro-annual?offer=annual30-v1');
 const unsafe=await fetch(origin+'/sign-in?redirect='+encodeURIComponent('//attacker.invalid'),{headers:{Cookie:cookies},redirect:'manual'});
 check('Sign-in rejects external redirect destinations',new URL(unsafe.headers.get('location'),origin).href===origin+'/dashboard');
 const quote=(await request(null,'/api/annual-offer')).data;check('Offer exposes the correct first-term and renewal prices',quote.quote.firstTermPriceCents===21924&&quote.quote.renewalPriceCents===31320);
 check('Cross-site capture is rejected',(await request(null,'/api/annual-offer','POST',{email:owner.email,source:'timed'},{Origin:'https://attacker.invalid'})).status===403);
 const captured=await request(null,'/api/annual-offer','POST',{email:` ${owner.email.toUpperCase()} `,source:'timed'});check('Anonymous email capture is persisted',captured.status===200&&captured.data.saved);
 check('Offer cookie is HTTP-only',captured.cookie?.includes('HttpOnly'));
 check('Repeated capture is idempotent',(await request(null,'/api/annual-offer','POST',{email:owner.email,source:'invoice'})).status===200&&ok(await db.from('annual_offer_claims').select('id').eq('email',owner.email)).length===1);
 check('Signed-in user cannot reserve another email',(await request(owner,'/api/annual-offer','POST',{email:other.email,source:'paywall'})).status===409);
 check('Another account cannot use the captured offer',(await request(other,'/api/billing','POST',{action:'checkout',plan:'pro-annual',eventKey:randomUUID(),annualOffer:true})).status===409);
 check('Offer cannot apply to a monthly plan',(await request(owner,'/api/billing','POST',{action:'checkout',plan:'pro',eventKey:randomUUID(),annualOffer:true})).status===400);
 const command={action:'checkout',plan:'pro-annual',eventKey:randomUUID(),annualOffer:true,priceCents:1,discountPercent:100};
 const preview=await request(owner,'/api/billing','POST',command);check('Annual offer preview saves',preview.status===200&&!!preview.data.result.recordId);
 const record=ok(await db.from('billing_records').select('*').eq('id',preview.data.result.recordId).single());
 check('Server ignores forged prices and persists the real quote',record.list_price_cents===31320&&record.detail.annualOffer.firstTermPriceCents===21924&&record.detail.annualOffer.discountPercent===30);
 check('Preview never charges',record.charged_cents===0&&record.status==='no_charge');
 check('Preview retry reuses the same record',(await request(owner,'/api/billing','POST',command)).data.result.recordId===record.id);
 const claim=ok(await db.from('annual_offer_claims').select('*').eq('email',owner.email).single());check('Verified checkout binds the claim to the account',claim.user_id===owner.id);
 check('Preview does not consume the single-use offer',claim.status==='reserved'&&!claim.redeemed_at);
 check('Preview does not grant paid membership',ok(await db.from('profiles').select('plan').eq('id',owner.id).single()).plan==='free');
 check('Browser cannot read captured emails',Boolean((await owner.client.from('annual_offer_claims').select('*')).error));
 check('Browser cannot redeem offers directly',Boolean((await owner.client.from('annual_offer_claims').update({status:'redeemed'}).eq('id',claim.id)).error));
 const single=await request(owner,'/api/billing','POST',{action:'checkout',plan:'agreement',eventKey:randomUUID()});check('Original one-time checkout still works',single.status===200);
 const success=await(await fetch(origin+`/checkout/success?record=${single.data.result.recordId}`,{headers:{Cookie:[...owner.jar].map(([k,v])=>`${k}=${v}`).join('; ')}})).text();check('One-time checkout confirmation contains the annual upgrade offer',success.includes('Save 30% on your first annual term.'));
 ok(await db.from('annual_offer_claims').update({status:'redeemed',redeemed_at:new Date().toISOString(),redemption_reference:`qa:${run}`}).eq('id',claim.id));
 check('Redeemed offer is no longer eligible',!(await request(owner,'/api/annual-offer')).data.eligible);
 check('Redeemed offer cannot be applied again',(await request(owner,'/api/billing','POST',{...command,eventKey:randomUUID()})).status===409);
 check('Redeemed offer cannot be reserved again',(await request(owner,'/api/annual-offer','POST',{email:owner.email,source:'checkout-bump'})).status===409);
}catch(error){console.error(error.message);process.exitCode=1;}finally{
 for(const email of emails)ok(await db.from('annual_offer_claims').delete().eq('email',email));
 for(const id of users){const result=await removeDisposableAccount(db,id);check('Disposable offer account removed',!result.error);}
 await mkdir('output/audit',{recursive:true});await writeFile('output/audit/annual-offer-flow-results.json',JSON.stringify({run,origin,checks},null,2));
}
