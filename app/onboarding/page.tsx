"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { setDemoSession } from "@/lib/demo-auth";

const vendors = ["Cintas", "UniFirst", "ALSCO", "ImageFirst", "Aramark", "G&K Services", "Other / I'm not sure"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    business: "",
    industry: "",
    vendor: "",
    monthlySpend: "",
  });
  const totalSteps = 4;

  const next = () => setStep(s => Math.min(totalSteps, s + 1));
  const back = () => setStep(s => Math.max(1, s - 1));
  const finish = () => {
    setDemoSession();
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-off-white flex flex-col">
      {/* Top bar */}
      <header className="px-6 md:px-8 py-5 border-b border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="no-underline flex flex-col leading-none">
            <span className="font-sans text-[9px] font-semibold tracking-[0.22em] uppercase text-blue">My</span>
            <div className="flex items-baseline">
              <span className="font-serif text-[20px] text-navy">Contract&nbsp;</span>
              <span className="font-serif italic text-[20px] text-blue">Doctors</span>
            </div>
          </Link>
          <div className="font-sans text-xs text-gray-500">
            Step <span className="font-medium text-navy">{step}</span> of {totalSteps}
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="bg-gray-100 h-1">
        <div className="bg-teal h-full transition-all duration-300" style={{ width: `${(step / totalSteps) * 100}%` }} />
      </div>

      {/* Body */}
      <main className="flex-1 px-6 md:px-8 py-10 md:py-16 flex items-start">
        <div className="max-w-xl mx-auto w-full">

          {/* Step 1 — Business name */}
          {step === 1 && (
            <Step
              eyebrow="Let's get you set up"
              title="What's your business?"
              subtitle="We'll use this to personalize your dashboard and tailor recommendations."
            >
              <div className="flex flex-col gap-4">
                <Field
                  label="Business name"
                  placeholder="Acme Restaurant Group"
                  value={data.business}
                  onChange={v => setData({ ...data, business: v })}
                />
                <SelectField
                  label="Industry"
                  value={data.industry}
                  onChange={v => setData({ ...data, industry: v })}
                  options={["Restaurant / Hospitality", "Healthcare", "Manufacturing", "Retail", "Automotive", "Office / Professional services", "Other"]}
                />
              </div>
              <NavRow onNext={next} disabled={!data.business || !data.industry} />
            </Step>
          )}

          {/* Step 2 — Vendor */}
          {step === 2 && (
            <Step
              eyebrow="Your current vendor"
              title="Who provides your uniforms or linens today?"
              subtitle="We'll calibrate our analysis to your specific vendor's contract patterns."
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {vendors.map(v => (
                  <button
                    key={v}
                    onClick={() => setData({ ...data, vendor: v })}
                    className={`text-left p-4 rounded-xl border-2 transition-colors cursor-pointer ${data.vendor === v ? "border-blue bg-blue-pale/50" : "border-gray-200 bg-white hover:border-gray-300"}`}
                  >
                    <span className={`font-sans text-sm ${data.vendor === v ? "text-navy font-medium" : "text-gray-700"}`}>{v}</span>
                  </button>
                ))}
              </div>
              <NavRow onNext={next} onBack={back} disabled={!data.vendor} />
            </Step>
          )}

          {/* Step 3 — Spend */}
          {step === 3 && (
            <Step
              eyebrow="Quick estimate"
              title="Roughly how much do you spend monthly?"
              subtitle="A ballpark is fine — we'll use this to estimate your potential savings."
            >
              <div className="grid grid-cols-2 gap-2">
                {["Under $500", "$500–$1,500", "$1,500–$3,000", "$3,000–$5,000", "$5,000–$10,000", "Over $10,000"].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setData({ ...data, monthlySpend: opt })}
                    className={`p-4 rounded-xl border-2 transition-colors cursor-pointer ${data.monthlySpend === opt ? "border-blue bg-blue-pale/50" : "border-gray-200 bg-white hover:border-gray-300"}`}
                  >
                    <span className={`font-sans text-sm ${data.monthlySpend === opt ? "text-navy font-medium" : "text-gray-700"}`}>{opt}</span>
                  </button>
                ))}
              </div>
              <NavRow onNext={next} onBack={back} disabled={!data.monthlySpend} />
            </Step>
          )}

          {/* Step 4 — All set, prompt to upload */}
          {step === 4 && (
            <Step
              eyebrow="You're ready"
              title={`Welcome, ${data.business || "to your dashboard"}.`}
              subtitle="Here's the fastest path to your first savings recommendation:"
            >
              <div className="flex flex-col gap-3 mb-6">
                <Action title="Upload your first invoice" body="Get an instant free recommendation on your latest bill." href="/invoice" cta="Upload now" primary />
                <Action title="Analyze your contract" body="Get a full clause-by-clause breakdown of your service agreement." href="/agreement" cta="Upload contract" />
                <Action title="Skip and explore the dashboard" body="Get a feel for the platform with our preview data, then come back." onClick={finish} cta="Explore →" />
              </div>
              <div className="text-center mt-4">
                <button onClick={back} className="font-sans text-sm text-gray-500 hover:text-navy bg-transparent border-none cursor-pointer">← back</button>
              </div>
            </Step>
          )}
        </div>
      </main>
    </div>
  );
}

function Step({ eyebrow, title, subtitle, children }: { eyebrow: string; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-8 text-center">
        <span className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-teal block mb-3">{eyebrow}</span>
        <h1 className="font-serif text-navy text-2xl md:text-3xl leading-tight mb-3">{title}</h1>
        {subtitle && <p className="font-sans font-light text-gray-500 leading-relaxed">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function NavRow({ onNext, onBack, disabled }: { onNext: () => void; onBack?: () => void; disabled?: boolean }) {
  return (
    <div className="flex justify-between items-center mt-8">
      {onBack ? (
        <button onClick={onBack} className="font-sans text-sm text-gray-500 hover:text-navy bg-transparent border-none cursor-pointer">← Back</button>
      ) : <span />}
      <button
        onClick={onNext}
        disabled={disabled}
        className="font-sans text-sm font-medium bg-navy text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continue →
      </button>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block font-sans text-xs font-semibold text-gray-700 mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full font-sans text-sm text-navy rounded-lg px-3.5 py-3 border-[1.5px] border-gray-300 outline-none focus:border-blue transition-colors"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="block font-sans text-xs font-semibold text-gray-700 mb-1.5">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full font-sans text-sm text-navy rounded-lg px-3.5 py-3 border-[1.5px] border-gray-300 outline-none focus:border-blue transition-colors bg-white"
      >
        <option value="">Choose one…</option>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Action({ title, body, href, onClick, cta, primary }: { title: string; body: string; href?: string; onClick?: () => void; cta: string; primary?: boolean }) {
  const inner = (
    <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${primary ? "bg-gradient-to-br from-navy to-navy-dark border-navy text-white" : "bg-white border-gray-200 hover:border-blue"}`}>
      <div className="flex-1">
        <div className={`font-sans text-sm font-medium leading-tight ${primary ? "text-white" : "text-navy"}`}>{title}</div>
        <div className={`font-sans text-xs leading-relaxed mt-0.5 ${primary ? "text-white/65" : "text-gray-500"}`}>{body}</div>
      </div>
      <span className={`font-sans text-sm font-medium flex-shrink-0 ${primary ? "text-teal" : "text-blue"}`}>{cta}</span>
    </div>
  );
  if (href) return <Link href={href} className="no-underline">{inner}</Link>;
  return <button onClick={onClick} className="w-full text-left bg-transparent border-none p-0 cursor-pointer">{inner}</button>;
}
