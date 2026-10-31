import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
// @ts-expect-error Native Node TS tests require explicit extensions.
import { annualOfferQuote,parseOfferCapture,offerCheckoutPath } from "../lib/annual-offer/domain.ts";
// @ts-expect-error Native Node TS tests require explicit extensions.
import { signOfferId,verifyOfferCookie } from "../lib/annual-offer/token.ts";
test("Annual offer discounts the first annual term with integer cents and preserves renewal pricing",()=>{
  assert.deepEqual(annualOfferQuote(34800),{listPriceCents:34800,discountCents:10440,firstTermPriceCents:24360,renewalPriceCents:34800});
  assert.deepEqual(annualOfferQuote(31320),{listPriceCents:31320,discountCents:9396,firstTermPriceCents:21924,renewalPriceCents:31320});
  assert.equal(annualOfferQuote(9999).firstTermPriceCents,6999);
  for(const price of [0,-1,29.5,NaN,Infinity])assert.throws(()=>annualOfferQuote(price));
});
test("Capture validates and normalizes email without treating the offer as newsletter consent",()=>{
  assert.deepEqual(parseOfferCapture({email:" Owner+Offer@Example.COM ",source:"timed",discount:100}),{email:"owner+offer@example.com",source:"timed"});
  for(const input of [null,{}, {email:"a@b.com",source:"forged"},{email:"invalid",source:"timed"},{email:"a\nb@example.com",source:"timed"}])assert.throws(()=>parseOfferCapture(input));
  const path=offerCheckoutPath({invoice:"11111111-1111-4111-8111-111111111111",agreement:"invalid"});
  assert.equal(path,"/checkout/pro-annual?offer=annual30-v1&invoice=11111111-1111-4111-8111-111111111111");
});
test("Offer cookies cannot be forged, modified, or validated with a different signing key",()=>{
  const id="11111111-1111-4111-8111-111111111111",signed=signOfferId(id,"secret-one");
  assert.equal(verifyOfferCookie(signed,"secret-one"),id);
  for(const cookie of [undefined,"",id,signed.replace(id,"22222222-2222-4222-8222-222222222222"),signed+".extra",id+"."+"z".repeat(64)])assert.equal(verifyOfferCookie(cookie,"secret-one"),null);
  assert.equal(verifyOfferCookie(signed,"secret-two"),null);
});
test("Postgres keeps captured emails private and enforces one reservation per email/account and consistent redemption",async()=>{
  const db=new PGlite();
  try{
    await db.exec(`create schema auth; create role anon; create role authenticated; create role service_role bypassrls;
      create table auth.users(id uuid primary key);grant usage on schema public,auth to anon,authenticated,service_role;
      insert into auth.users values('11111111-1111-4111-8111-111111111111');`);
    await db.exec(await readFile(new URL('../supabase/migrations/20261031202330_annual_membership_offer.sql',import.meta.url),'utf8'));
    await db.exec("set role service_role");
    const first=(await db.query<{id:string}>("insert into annual_offer_claims(email,source,user_id) values('owner@example.com','timed','11111111-1111-4111-8111-111111111111') returning id")).rows[0];
    await assert.rejects(db.query("insert into annual_offer_claims(email,source) values('owner@example.com','invoice')"),/unique/);
    await assert.rejects(db.query("insert into annual_offer_claims(email,source,user_id) values('other@example.com','invoice','11111111-1111-4111-8111-111111111111')"),/unique/);
    await assert.rejects(db.query("insert into annual_offer_claims(email,source) values('UPPER@example.com','timed')"),/check constraint/);
    await assert.rejects(db.query(`update annual_offer_claims set status='redeemed' where id='${first.id}'`),/check constraint/);
    await db.exec(`update annual_offer_claims set status='redeemed',redeemed_at=now(),redemption_reference='verified-payment-reference' where id='${first.id}'`);
    for(const role of ['anon','authenticated']){await db.exec(`reset role;set role ${role}`);for(const query of ["select email from annual_offer_claims","insert into annual_offer_claims(email,source) values('new@example.com','timed')","update annual_offer_claims set status='reserved'","delete from annual_offer_claims"]){await assert.rejects(db.query(query),(e:{code?:string})=>e.code==='42501');}}
  }finally{await db.close();}
});
