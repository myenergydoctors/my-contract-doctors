// Explicit opt-in: creates one disposable moderator; removes all synthetic data afterward.
import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { removeDisposableAccount } from './lib/qa-cleanup.mjs';
nextEnv.loadEnvConfig(process.cwd());
const project='xrchncayomnwcnphrwhx',url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const origin=process.env.REVIEW_AUDIT_ORIGIN||'http://localhost:3004';
if(process.env.REVIEW_AUDIT_PROJECT!==project || process.env.REVIEW_AUDIT_ALLOW_TEMP_ADMIN!=='yes' || new URL(url).hostname!==`${project}.supabase.co` || !['localhost','127.0.0.1'].includes(new URL(origin).hostname))throw new Error('Explicitly authorize the MCD project, localhost origin, and temporary moderator.');
const db=createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const users=[],checks=[];const run=randomUUID();
function ok(result){if(result.error)throw new Error(result.error.message);return result.data;}
function check(name,passed){checks.push({name,passed});console.log(JSON.stringify({name,passed}));if(!passed)throw new Error(name);}
async function account(label,isAdmin=false){
  const email=`account-flow-review-${label}-${run}@example.invalid`,password=randomUUID();
  const user=ok(await db.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{first_name:'Review',last_name:'QA'}})).user;
  users.push(user.id);const jar=new Map();
  const client=createServerClient(url,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:values=>values.forEach(({name,value})=>jar.set(name,value))}});
  ok(await client.auth.signInWithPassword({email,password}));
  if(isAdmin)ok(await db.from('profiles').update({is_admin:true}).eq('id',user.id));
  return{id:user.id,client,jar};
}
async function request(person,path,method='GET',body){
  const response=await fetch(origin+path,{method,headers:{Origin:origin,Cookie:[...person.jar].map(([k,v])=>`${k}=${v}`).join('; '),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(60000)});
  return{status:response.status,data:await response.json()};
}
async function html(path,person){const response=await fetch(origin+path,{headers:person?{Cookie:[...person.jar].map(([k,v])=>`${k}=${v}`).join('; ')}:{},signal:AbortSignal.timeout(60000)});return{status:response.status,body:await response.text()};}
async function current(person){return(await request(person,'/api/reviews/me')).data.review;}
async function moderate(person,review,status,featured=false,reason=null){return request(person,'/api/admin/reviews','PATCH',{id:review.id,status,featured,reason,updatedAt:review.updated_at});}
try{
  const moderator=await account('moderator',true),positive=await account('positive'),negative=await account('negative'),privateUser=await account('private');
  check('Admin moderation page renders',(await html('/dashboard/admin/reviews',moderator)).body.includes('Review moderation'));
  check('Moderator can read the queue',(await request(moderator,'/api/admin/reviews')).status===200);
  for(const person of [positive,negative,privateUser])person.invoice=ok(await db.from('invoice_analyses').insert({user_id:person.id,status:'completed',vendor:'Synthetic moderation QA'}).select('id').single()).id;
  const input=(person,rating,consent=true)=>({analysisId:person.invoice,analysisKind:'invoice',rating,body:`Synthetic QA ${rating}-star review ${run}. This is test feedback only.`,displayName:'Synthetic QA only',publicationConsent:consent});
  for(const [person,rating,consent] of [[positive,5,true],[negative,1,true],[privateUser,5,false]])check(`Submit ${rating}-star ${consent?'public':'private'} feedback`,(await request(person,'/api/reviews/me','POST',input(person,rating,consent))).status===201);
  const pos=await current(positive),neg=await current(negative),priv=await current(privateUser);
  check('Pending reviews stay unpublished',!(await html('/reviews')).body.includes(run));
  check('Rejection requires a content-policy reason',(await moderate(moderator,pos,'rejected')).status===400);
  check('Positive review can be published',(await moderate(moderator,pos,'published')).status===200);
  check('Stale moderation cannot overwrite a newer decision',(await moderate(moderator,pos,'published',true)).status===409);
  check('Selected positive review can be featured',(await moderate(moderator,await current(positive),'published',true)).status===200);
  check('Featured review appears on homepage',(await html('/')).body.includes(input(positive,5).body));
  check('Negative review can be published',(await moderate(moderator,neg,'published')).status===200);
  check('Negative review cannot be featured',(await moderate(moderator,await current(negative),'published',true)).status===400);
  const all=await html('/reviews');
  check('Public reviews include both ratings',all.body.includes(input(positive,5).body)&&all.body.includes(input(negative,1).body));
  // The summary is checked against the database, not assumptions about other genuine reviews.
  const ratings=ok(await db.from('customer_reviews').select('rating').eq('status','published').eq('publication_consent',true));
  const average=(ratings.reduce((sum,row)=>sum+row.rating,0)/ratings.length).toFixed(1);
  check('Overall rating includes every published star rating',all.body.includes(`${average} / 5`));
  check('Private feedback cannot be published',(await moderate(moderator,priv,'published')).status===409);
  check('Private feedback is visible in the private admin queue',(await request(moderator,'/api/admin/reviews?status=private')).data.reviews.some(r=>r.id===priv.id));
  check('Policy-based rejection works',(await moderate(moderator,await current(negative),'rejected',false,'unrelated')).status===200);
  check('Rejected review leaves public page',!(await html('/reviews')).body.includes(input(negative,1).body));
  check('Rejected review can return to pending',(await moderate(moderator,await current(negative),'pending')).status===200);
  check('Negative review can be republished',(await moderate(moderator,await current(negative),'published')).status===200);
  const beforeWithdrawal=await current(positive);
  check('Customer withdraws permission',(await request(positive,'/api/reviews/me','DELETE')).data.review.status==='withdrawn');
  check('Withdrawal removes public review',!(await html('/reviews')).body.includes(input(positive,5).body));
  check('Withdrawal removes homepage testimonial',!(await html('/')).body.includes(input(positive,5).body));
  check('Moderator cannot restore withdrawn review',(await moderate(moderator,beforeWithdrawal,'published',true)).status===409);
  check('Moderation and withdrawal events are recorded',ok(await db.from('customer_review_events').select('id').eq('review_id',pos.id)).length===4);
}catch(error){console.error(error.message);process.exitCode=1;}
finally{
  for(const id of users){const result=await db.from('customer_reviews').delete().eq('user_id',id);if(result.error){console.error(result.error.message);process.exitCode=1;}}
  // Remove the temporary privilege first even if another cleanup step fails.
  for(const id of users){const result=await db.from('profiles').update({is_admin:false}).eq('id',id);if(result.error){console.error(result.error.message);process.exitCode=1;}}
  for(const id of users){const result=await removeDisposableAccount(db,id);check('Disposable moderation account removed',!result.error);}
  await mkdir('output/audit',{recursive:true});await writeFile('output/audit/review-moderation-flow-results.json',JSON.stringify({run,origin,checks},null,2));
}
