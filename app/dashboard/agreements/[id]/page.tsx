"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

type EmailTemplate = { subject: string; body: string };
type Finding = {
  id:string;kind:string;title:string;risk:"high"|"medium"|"low";sourcePage:number|null;
  contractText:string;plainEnglish:string;recommendedAction:string;noticeDays:number|null;
  deadline:string|null;estimatedFinancialExposureCents:number|null;emailTemplate:EmailTemplate|null;
};
type AgreementResult = {
  id:string;status:string;reviewStatus:string;vendor:string|null;agreementName:string|null;agreementNumber:string|null;
  effectiveDate:string|null;expirationDate:string|null;renewalDeadline:string|null;renewalNoticeDays:number|null;
  termLength:string|null;autoRenewal:string|null;riskScore:number|null;pageCount:number|null;
  documentQuality:string|null;documentQualityNotes:string|null;findingCount:number;lockedFindingCount:number;
  freeFindingKind:string|null;fullAccess:boolean;findings:Finding[];
  reviewOutline:Array<{id:string;title:string;sourcePage:number|null}>;
  invoiceContext:{totalSavedInvoices:number;sameVendorInvoices:number;floorMatLines:number;monitoringChecks:string[]};
};

export default function AgreementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [agreement,setAgreement]=useState<AgreementResult|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [confirming,setConfirming]=useState(false);
  async function load() {
    const response=await fetch(`/api/agreements/${id}`,{cache:"no-store"});const data=await response.json();
    if(!response.ok)throw new Error(data?.error||"Agreement could not be loaded.");setAgreement(data.agreement);
  }
  useEffect(()=>{let cancelled=false;void load().catch(caught=>{if(!cancelled)setError(caught instanceof Error?caught.message:"Agreement could not be loaded.");}).finally(()=>{if(!cancelled)setLoading(false);});return()=>{cancelled=true;};},[id]); // eslint-disable-line react-hooks/exhaustive-deps
  async function confirm() {setConfirming(true);setError("");try{const response=await fetch(`/api/agreements/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"confirm"})});const data=await response.json();if(!response.ok)throw new Error(data?.error||"Confirmation failed.");await load();}catch(caught){setError(caught instanceof Error?caught.message:"Confirmation failed.");}finally{setConfirming(false);}}
  if(loading)return <div className="py-16 text-center font-sans text-sm text-gray-500">Loading agreement review…</div>;
  if(error&&!agreement)return <div className="py-16 text-center"><h2 className="font-serif text-2xl text-navy">Agreement unavailable</h2><p className="mt-2 font-sans text-sm text-gray-500">{error}</p></div>;
  if(!agreement)return null;
  if(agreement.status==="failed")return <div className="max-w-2xl py-12"><Link href="/dashboard/agreements" className="font-sans text-sm text-blue no-underline">← Back to agreements</Link><div className="mt-5 rounded-2xl border border-red/25 bg-white p-8"><h2 className="font-serif text-2xl text-navy">We could not confirm this was a usable agreement.</h2><p className="mt-3 font-sans text-sm leading-6 text-gray-600">{agreement.documentQualityNotes||"Try a complete, clearer copy."}</p></div></div>;

  return <div className="max-w-6xl pb-16"><Link href="/dashboard/agreements" className="font-sans text-sm text-blue no-underline">← Back to agreements</Link>
    <header className="mt-5 mb-7"><div className="font-sans text-xs text-gray-500">{agreement.vendor||"Vendor not identified"}{agreement.agreementNumber?` · Agreement ${agreement.agreementNumber}`:""}</div><h1 className="mt-1 font-serif text-3xl text-navy">{agreement.agreementName||"Service agreement"}</h1><p className="mt-2 max-w-3xl font-sans text-sm leading-6 text-gray-600">{agreement.termLength||"Term not clearly stated"}{agreement.autoRenewal?` · ${agreement.autoRenewal}`:""}</p></header>
    {error&&<div role="alert" className="mb-5 rounded-lg border border-red/30 bg-red-light p-3 font-sans text-sm text-red">{error}</div>}
    {agreement.reviewStatus!=="confirmed"?<ReviewGate agreement={agreement} onConfirm={confirm} confirming={confirming}/>:<ConfirmedResult agreement={agreement}/>}
  </div>;
}

function ReviewGate({agreement,onConfirm,confirming}:{agreement:AgreementResult;onConfirm:()=>void;confirming:boolean}){
  const [isConfirmed,setIsConfirmed]=useState(false);
  return <><section className="rounded-2xl border border-gray-200 bg-white p-6"><div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-blue">Confirm the extraction</div><h2 className="mt-2 font-serif text-2xl text-navy">We reviewed {agreement.pageCount||"the available"} {agreement.pageCount===1?"page":"pages"} and identified {agreement.findingCount} material {agreement.findingCount===1?"provision":"provisions"}.</h2><p className="mt-3 font-sans text-sm leading-6 text-gray-600">Check that the vendor, agreement title, page count, and section outline match the uploaded file. Findings remain hidden until you confirm this is the correct agreement.</p><div className="mt-5 grid gap-3 sm:grid-cols-3"><Fact label="Document quality" value={agreement.documentQuality||"Not stated"}/><Fact label="Effective date" value={formatDate(agreement.effectiveDate)}/><Fact label="Expiration date" value={formatDate(agreement.expirationDate)}/></div>{agreement.documentQualityNotes&&<div className="mt-4 rounded-lg bg-off-white p-4 font-sans text-xs leading-5 text-gray-600">{agreement.documentQualityNotes}</div>}</section>
    <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-6"><div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-gray-500">Sections detected</div><div className="mt-3 grid gap-2 sm:grid-cols-2">{agreement.reviewOutline.map(item=><div key={item.id} className="rounded-lg border border-gray-200 bg-off-white px-4 py-3 font-sans text-sm text-navy">{item.title}{item.sourcePage?` · page ${item.sourcePage}`:""}</div>)}</div><label className="mt-5 flex items-start gap-3 font-sans text-sm leading-6 text-gray-700"><input type="checkbox" className="mt-1" checked={isConfirmed} onChange={event=>setIsConfirmed(event.target.checked)}/>I confirm this is the agreement I intended to review and the page count and outline look reasonable.</label><button disabled={!isConfirmed||confirming} onClick={onConfirm} className="mt-5 rounded-lg bg-teal px-5 py-3 font-sans text-sm font-semibold text-white disabled:opacity-40">{confirming?"Confirming…":"Confirm and show my free finding →"}</button></section></>;
}

function ConfirmedResult({agreement}:{agreement:AgreementResult}){
  const free=agreement.findings[0]||null;
  return <><section className="rounded-2xl border border-blue/25 bg-blue-pale/35 p-6"><div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-blue">Confirmed agreement review</div><h2 className="mt-1 font-serif text-2xl text-navy">{agreement.findingCount>0?`We found ${agreement.findingCount} ${agreement.findingCount===1?"provision":"provisions"} worth reviewing.`:"We did not find a clause we can responsibly flag from this copy."}</h2><p className="mt-2 font-sans text-sm text-gray-600">{agreement.fullAccess?"Your complete agreement review is available below.":agreement.lockedFindingCount>0?`Your first finding is shown. ${agreement.lockedFindingCount} additional ${agreement.lockedFindingCount===1?"finding is":"findings are"} included in the full review.`:agreement.findingCount>0?"Your available finding is shown below.":"Pro still adds value by reviewing your other agreements and connecting future invoices for ongoing monitoring."}</p></section>
    {agreement.renewalDeadline&&<section className="mt-5 rounded-2xl border border-amber/30 bg-amber/10 p-5"><div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-amber-700">Potential non-renewal deadline</div><div className="mt-1 font-serif text-2xl text-navy">{formatDate(agreement.renewalDeadline)}</div><p className="mt-1 font-sans text-xs leading-5 text-gray-600">Calculated from the extracted expiration date and {agreement.renewalNoticeDays}-day notice period. Verify the delivery method and date in the agreement before relying on it.</p></section>}
    {free?<FindingCard finding={free} free={!agreement.fullAccess}/>:<section className="mt-5 rounded-2xl border border-gray-200 bg-white p-6 font-sans text-sm text-gray-600">We did not extract enough actual clause language for a responsible finding.</section>}
    {agreement.fullAccess&&agreement.findings.length>1&&<section className="mt-8"><div className="mb-3 font-sans text-[11px] font-semibold uppercase tracking-wider text-teal">Complete clause review ({agreement.findings.length})</div><div className="space-y-4">{agreement.findings.slice(1).map(finding=><FindingCard key={finding.id} finding={finding}/>)}</div></section>}
    {!agreement.fullAccess&&<AgreementOffer agreementId={agreement.id} lockedCount={agreement.lockedFindingCount}/>}<InvoiceConnection context={agreement.invoiceContext}/>
    <p className="mt-6 font-sans text-[11px] leading-5 text-gray-500">This is practical contract information, not legal advice. Important deadlines and amendments should be confirmed against the signed agreement and, when appropriate, with counsel.</p>
  </>;
}

function FindingCard({finding,free=false}:{finding:Finding;free?:boolean}){
  return <article className="mt-5 rounded-2xl border-2 border-teal/25 bg-white p-6"><div className="flex flex-wrap items-center justify-between gap-2"><div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-teal">{free?"Your free agreement finding":`${finding.risk} attention`}</div>{finding.sourcePage&&<div className="font-sans text-xs text-gray-500">Page {finding.sourcePage}</div>}</div><h3 className="mt-2 font-serif text-2xl text-navy">{finding.title}</h3><blockquote className="mt-4 border-l-4 border-blue bg-blue-pale/30 p-4 font-sans text-sm italic leading-6 text-gray-700">“{finding.contractText}”</blockquote><div className="mt-4 grid gap-3 md:grid-cols-2"><div className="rounded-xl bg-off-white p-4"><div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-gray-500">What it means</div><p className="mt-1 font-sans text-sm leading-6 text-gray-700">{finding.plainEnglish}</p></div><div className="rounded-xl bg-teal-light/50 p-4"><div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-teal">What to do now</div><p className="mt-1 font-sans text-sm leading-6 text-navy">{finding.recommendedAction}</p></div></div>{finding.emailTemplate?<EmailTemplateBox template={finding.emailTemplate}/>:free&&<div className="mt-4 rounded-xl bg-navy p-4 font-sans text-sm text-white/75">The tailored vendor email for this exact clause is included after purchasing the agreement review or joining Pro.</div>}</article>;
}

function EmailTemplateBox({template}:{template:EmailTemplate}){
  const [copied,setCopied]=useState(false);const copy=async()=>{await navigator.clipboard.writeText(`Subject: ${template.subject}\n\n${template.body}`);setCopied(true);setTimeout(()=>setCopied(false),1600);};
  return <div className="mt-4 rounded-xl border border-blue/25 bg-blue-pale/25 p-4"><div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-blue">Vendor email template</div><div className="mt-2 font-sans text-sm font-semibold text-navy">Subject: {template.subject}</div><pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-6 text-gray-700">{template.body}</pre><button onClick={copy} className="mt-3 rounded-lg bg-navy px-4 py-2 font-sans text-xs font-semibold text-white">{copied?"Copied":"Copy email"}</button></div>;
}

function AgreementOffer({agreementId,lockedCount}:{agreementId:string;lockedCount:number}){
  const hasLocked=lockedCount>0;return <section className="mt-8 rounded-2xl bg-navy p-7 text-white"><div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-teal-light">{hasLocked?`${lockedCount} additional agreement ${lockedCount===1?"finding":"findings"}`:"Keep both documents working together"}</div><h3 className="mt-2 font-serif text-2xl">{hasLocked?"Unlock every clause and the emails to address them.":"Continue with Pro for agreement and invoice monitoring."}</h3><p className="mt-3 max-w-2xl font-sans text-sm leading-6 text-white/70">{hasLocked?"The full review includes every supported clause, plain-English guidance, and a tailored vendor email for each finding.":"Pro connects agreement deadlines and restrictions with future invoice charges, rate changes, fees, and replacements."}</p><div className="mt-5 flex flex-wrap gap-3"><Link href={`/checkout/pro?agreement=${encodeURIComponent(agreementId)}`} className="rounded-lg bg-teal px-5 py-3 font-sans text-sm font-semibold text-white no-underline">Choose Pro — $29/month →</Link>{hasLocked&&<Link href={`/checkout/agreement?agreement=${encodeURIComponent(agreementId)}`} className="rounded-lg border border-white/30 bg-white/10 px-5 py-3 font-sans text-sm text-white no-underline">One agreement — $49</Link>}</div><p className="mt-3 font-sans text-[11px] text-white/50">Checkout is a preview and will not charge or unlock content until payment fulfillment is connected.</p></section>;
}

function InvoiceConnection({context}:{context:AgreementResult["invoiceContext"]}){
  const connected=context.sameVendorInvoices>0;return <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6"><div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-blue">Agreement + invoice</div><h3 className="mt-1 font-serif text-2xl text-navy">{connected?`${context.sameVendorInvoices} saved ${context.sameVendorInvoices===1?"invoice matches":"invoices match"} this vendor.`:"Add an invoice to measure what is actually happening."}</h3><p className="mt-2 font-sans text-sm leading-6 text-gray-600">{connected?"The agreement supplies the rules; the invoices supply the billed rates, quantities, and fees. Pro turns those documents into an ongoing vendor record.":"An agreement alone can identify risky language, but it usually cannot prove an overcharge. Upload an invoice to connect actual billing evidence."}</p>{context.monitoringChecks.length>0&&<div className="mt-4 grid gap-2">{context.monitoringChecks.map(check=><div key={check} className="rounded-lg bg-off-white px-4 py-3 font-sans text-sm text-navy">✓ {check}</div>)}</div>}<Link href="/invoice" className="mt-5 inline-block rounded-lg bg-blue px-5 py-3 font-sans text-sm font-semibold text-white no-underline">{connected?"Upload another invoice →":"Upload an invoice →"}</Link></section>;
}

function Fact({label,value}:{label:string;value:string}){return <div className="rounded-xl bg-off-white p-4"><div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-gray-500">{label}</div><div className="mt-1 font-sans text-sm text-navy">{value}</div></div>;}
function formatDate(value:string|null):string{if(!value)return "Not clearly stated";const parsed=new Date(`${value}T00:00:00`);return Number.isNaN(parsed.getTime())?value:parsed.toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"});}
