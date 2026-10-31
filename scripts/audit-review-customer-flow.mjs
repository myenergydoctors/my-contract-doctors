// Opt-in customer-only review checks. No admin grants or public test testimonials.
import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { removeDisposableAccount } from './lib/qa-cleanup.mjs';
nextEnv.loadEnvConfig(process.cwd());
const project='xrchncayomnwcnphrwhx',url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const origin=process.env.REVIEW_AUDIT_ORIGIN||'http://localhost:3004';
if(process.env.REVIEW_AUDIT_PROJECT!==project || new URL(url).hostname!==`${project}.supabase.co` || !['localhost','127.0.0.1'].includes(new URL(origin).hostname))throw new Error('Explicitly select the MCD project and a localhost origin.');
const admin=createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const users=[],checks=[]; const run=randomUUID();
function ok(result){if(result.error)throw new Error(result.error.message);return result.data;}
function check(name,passed){checks.push({name,passed});console.log(JSON.stringify({name,passed}));if(!passed)throw new Error(name);}
async function account(label){
 const email=`account-flow-review-${label}-${run}@example.invalid`,password=randomUUID();
 const user=ok(await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{first_name:'Review',last_name:'QA'}})).user;
 users.push(user.id);const jar=new Map();
 const client=createServerClient(url,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:values=>values.forEach(({name,value})=>jar.set(name,value))}});
 ok(await client.auth.signInWithPassword({email,password}));return {id:user.id,client,jar};
}
async function request(person,path,method='GET',body,extra={}){
 const response=await fetch(origin+path,{method,headers:{Origin:origin,...(person?{Cookie:[...person.jar].map(([k,v])=>`${k}=${v}`).join('; ')}:{}),...(body?{'Content-Type':'application/json'}:{}),...extra},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(60000)});
 return {status:response.status,data:await response.json()};
}
try{
 const owner=await account('owner'),other=await account('other');
 check('Anonymous submissions require sign-in',(await request(null,'/api/reviews/me','POST',{})).status===401);
 check('Non-admin moderation is forbidden',(await request(owner,'/api/admin/reviews')).status===403);
 check('No completed analysis means no eligibility',!(await request(owner,'/api/reviews/me')).data.analysis);
 const invoice=ok(await admin.from('invoice_analyses').insert({user_id:owner.id,status:'completed',vendor:'Synthetic review QA'}).select('id').single()).id;
 const agreement=ok(await admin.from('agreement_analyses').insert({user_id:other.id,status:'completed',vendor:'Synthetic review QA'}).select('id').single()).id;
 const input={analysisId:invoice,analysisKind:'invoice',rating:1,body:`Synthetic QA feedback ${run}. This experience could improve.`,displayName:'Synthetic QA only',publicationConsent:true};
 check('Completed analysis enables review',(await request(owner,'/api/reviews/me')).data.analysis.id===invoice);
 check('Cross-site submission is rejected',(await request(owner,'/api/reviews/me','POST',input,{Origin:'https://attacker.invalid'})).status===403);
 check('Cannot review another customer analysis',(await request(other,'/api/reviews/me','POST',input)).status===403);
 check('Invalid ratings are rejected',(await request(owner,'/api/reviews/me','POST',{...input,rating:6})).status===400);
 const submitted=await request(owner,'/api/reviews/me','POST',input);check('Verified one-star review saves pending',submitted.status===201&&submitted.data.review.status==='pending');
 check('One review per account',(await request(owner,'/api/reviews/me','POST',input)).status===409);
 const html=await(await fetch(origin+'/reviews')).text();check('Pending review does not appear publicly',!html.includes(input.body));
 check('Browser cannot read private review storage',Boolean((await owner.client.from('customer_reviews').select('*')).error));
 check('Browser cannot self-publish',Boolean((await owner.client.from('customer_reviews').update({status:'published'}).eq('id',submitted.data.review.id)).error));
 check('Non-admin moderation write is forbidden',(await request(owner,'/api/admin/reviews','PATCH',{id:submitted.data.review.id,status:'published',featured:false,updatedAt:submitted.data.review.updated_at})).status===403);
 const privateResult=await request(other,'/api/reviews/me','POST',{...input,analysisId:agreement,analysisKind:'agreement',publicationConsent:false});check('Private agreement feedback can be submitted',privateResult.status===201&&!privateResult.data.review.publication_consent);
 check('Customer withdraws publication permission',(await request(owner,'/api/reviews/me','DELETE')).data.review.status==='withdrawn');
 check('Withdrawal audit persists',ok(await admin.from('customer_review_events').select('id').eq('review_id',submitted.data.review.id)).length===2);
}catch(error){console.error(error.message);process.exitCode=1;}
finally{
 for(const id of users)ok(await admin.from('customer_reviews').delete().eq('user_id',id));
 for(const id of users){const result=await removeDisposableAccount(admin,id);check('Disposable customer account removed',!result.error);}
 await mkdir('output/audit',{recursive:true});await writeFile('output/audit/review-customer-flow-results.json',JSON.stringify({run,origin,checks},null,2));
}
