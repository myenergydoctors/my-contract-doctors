"use client";
import { useState } from "react";
import Link from "next/link";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Please enter a valid email";
    if (!form.message.trim()) e.message = "Please include a message";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setServerError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      setSubmitted(true);
    } catch {
      setServerError("Something went wrong. Please try again or email us directly.");
    } finally {
      setLoading(false);
    }
  };

  const faqs = [
    { q: "Which vendors do you work with?", a: "We work with all major uniform and linen service providers including Cintas, UniFirst, ALSCO, ImageFirst, Aramark, G&K Services, and more. The clause patterns are similar across all vendors." },
    { q: "Do I need to upload my contract to get started?", a: "No — The Demystifier requires no upload at all. You can start learning about your agreement rights immediately. Uploading your contract is only required for The Agreement personalized analysis." },
    { q: "Is my contract information kept private?", a: "Yes. Your uploaded documents are encrypted in transit and at rest, are never sold or shared with third parties, and are used only to generate your analysis." },
    { q: "What if I don't have a digital copy of my agreement?", a: "No problem — use our QR code mobile upload feature to photograph your paper agreement with your phone and it'll be linked to your session automatically." },
  ];

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-dark to-navy pt-24 pb-18 px-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
        <div className="max-w-2xl mx-auto text-center relative z-10" style={{ padding: "64px 0 48px" }}>
          <span className="font-sans text-[11px] font-semibold tracking-[0.16em] uppercase text-teal block mb-4">Get in touch</span>
          <h1 className="font-serif text-white leading-tight mb-5" style={{ fontSize: "clamp(32px,4.5vw,50px)" }}>
            We're on your side.<br />
            <em className="italic text-blue-light">Ask us anything.</em>
          </h1>
          <p className="font-sans font-light text-white/70 leading-relaxed text-lg">Have a question about your contract, our products, or how we can help? We'd love to hear from you.</p>
        </div>
      </section>

      {/* Main */}
      <section className="px-8 py-20 bg-off-white">
        <div className="max-w-5xl mx-auto grid gap-16" style={{ gridTemplateColumns: "1fr 1fr" }}>

          {/* Form */}
          <div>
            <span className="font-sans text-[11px] font-semibold tracking-[0.16em] uppercase text-blue block mb-3">Send us a message</span>
            <h2 className="font-serif text-navy leading-tight mb-2" style={{ fontSize: 32 }}>How can we help?</h2>
            <p className="font-sans font-light text-gray-500 leading-relaxed text-sm mb-8">Fill out the form and one of our contract specialists will get back to you within one business day.</p>

            {!submitted ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-8">
                {serverError && (
                  <div className="bg-red-light border border-red text-red font-sans text-sm rounded-lg p-3 mb-5">{serverError}</div>
                )}

                <div className="grid gap-5 mb-5" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <div>
                    <label className="font-sans text-xs font-semibold text-gray-700 block mb-1.5">Full name *</label>
                    <input
                      type="text" placeholder="Jane Smith" value={form.name} onChange={set("name")}
                      className="w-full font-sans text-sm text-navy rounded-lg px-3.5 py-3 outline-none transition-colors"
                      style={{ border: `1.5px solid ${errors.name ? "#DC2626" : "#CBD5E1"}` }}
                      onFocus={e => e.target.style.borderColor = "#3D80C8"}
                      onBlur={e => e.target.style.borderColor = errors.name ? "#DC2626" : "#CBD5E1"}
                    />
                    {errors.name && <p className="font-sans text-[11px] text-red mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="font-sans text-xs font-semibold text-gray-700 block mb-1.5">Phone number</label>
                    <input
                      type="tel" placeholder="(555) 000-0000" value={form.phone} onChange={set("phone")}
                      className="w-full font-sans text-sm text-navy rounded-lg px-3.5 py-3 outline-none transition-colors"
                      style={{ border: "1.5px solid #CBD5E1" }}
                      onFocus={e => e.target.style.borderColor = "#3D80C8"}
                      onBlur={e => e.target.style.borderColor = "#CBD5E1"}
                    />
                  </div>
                </div>

                <div className="mb-5">
                  <label className="font-sans text-xs font-semibold text-gray-700 block mb-1.5">Email address *</label>
                  <input
                    type="email" placeholder="jane@yourbusiness.com" value={form.email} onChange={set("email")}
                    className="w-full font-sans text-sm text-navy rounded-lg px-3.5 py-3 outline-none transition-colors"
                    style={{ border: `1.5px solid ${errors.email ? "#DC2626" : "#CBD5E1"}` }}
                    onFocus={e => e.target.style.borderColor = "#3D80C8"}
                    onBlur={e => e.target.style.borderColor = errors.email ? "#DC2626" : "#CBD5E1"}
                  />
                  {errors.email && <p className="font-sans text-[11px] text-red mt-1">{errors.email}</p>}
                </div>

                <div className="mb-6">
                  <label className="font-sans text-xs font-semibold text-gray-700 block mb-1.5">How can we help? *</label>
                  <textarea
                    placeholder="Tell us about your situation — which vendor you use, what you're trying to understand, or any questions you have about your agreement or invoice..."
                    value={form.message} onChange={set("message")} rows={5}
                    className="w-full font-sans text-sm text-navy rounded-lg px-3.5 py-3 outline-none transition-colors resize-y leading-relaxed"
                    style={{ border: `1.5px solid ${errors.message ? "#DC2626" : "#CBD5E1"}` }}
                    onFocus={e => e.target.style.borderColor = "#3D80C8"}
                    onBlur={e => e.target.style.borderColor = errors.message ? "#DC2626" : "#CBD5E1"}
                  />
                  {errors.message && <p className="font-sans text-[11px] text-red mt-1">{errors.message}</p>}
                </div>

                <button
                  onClick={handleSubmit} disabled={loading}
                  className="w-full py-3.5 bg-teal text-white font-sans text-[15px] font-medium rounded-lg transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ boxShadow: "0 4px 20px rgba(23,168,130,0.3)" }}
                >
                  {loading ? "Sending..." : "Send Message →"}
                </button>
                <p className="font-sans text-[11px] text-gray-500 text-center mt-3">We typically respond within one business day.</p>
              </div>
            ) : (
              <div className="bg-white border-2 border-teal rounded-2xl p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-teal-light flex items-center justify-center mx-auto mb-5 text-3xl">✓</div>
                <h3 className="font-serif text-navy mb-3" style={{ fontSize: 26 }}>Message received!</h3>
                <p className="font-sans font-light text-gray-500 leading-relaxed text-sm mb-6">
                  Thank you, {form.name.split(" ")[0]}. We'll be in touch at <strong>{form.email}</strong> within one business day.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setForm({ name: "", email: "", phone: "", message: "" }); setErrors({}); }}
                  className="font-sans text-sm text-gray-700 border border-gray-300 rounded-lg px-5 py-2.5 hover:bg-gray-100 transition-colors"
                >
                  Send another message
                </button>
              </div>
            )}
          </div>

          {/* Right column */}
          <div>
            <span className="font-sans text-[11px] font-semibold tracking-[0.16em] uppercase text-blue block mb-3">Contact information</span>
            <h2 className="font-serif text-navy leading-tight mb-8" style={{ fontSize: 32 }}>Reach us directly</h2>

            {/* Contact cards */}
            <div className="flex flex-col gap-3.5 mb-10">
              {[
                { icon: "📞", label: "Phone", value: "(XXX) XXX-XXXX", sub: "Monday–Friday, 9am–5pm EST" },
                { icon: "✉️", label: "Email", value: "hello@mycontractdoctors.com", sub: "We respond within one business day" },
                { icon: "🕐", label: "Hours", value: "Mon–Fri: 9am – 5pm EST", sub: "Closed weekends and major holidays" },
              ].map(({ icon, label, value, sub }) => (
                <div key={label} className="bg-white border border-gray-200 rounded-2xl p-5 flex gap-4 items-start">
                  <div className="w-11 h-11 rounded-xl bg-blue-pale flex items-center justify-center text-xl flex-shrink-0">{icon}</div>
                  <div>
                    <div className="font-sans text-[11px] font-semibold tracking-[0.1em] uppercase text-gray-500 mb-1">{label}</div>
                    <div className="font-serif text-navy mb-1" style={{ fontSize: 18 }}>{value}</div>
                    <div className="font-sans font-light text-gray-500 text-xs">{sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* FAQ */}
            <div className="font-sans text-[11px] font-semibold tracking-[0.16em] uppercase text-blue mb-4">Common questions</div>
            <div className="flex flex-col">
              {faqs.map(({ q, a }) => <FAQItem key={q} q={q} a={a} />)}
            </div>

            {/* Sister company */}
            <div className="mt-8 rounded-2xl p-6 flex gap-4 items-center" style={{ background: "linear-gradient(135deg,#0C2D54,#153D6B)" }}>
              <div className="flex-1">
                <div className="font-sans text-[11px] font-semibold tracking-[0.1em] uppercase text-blue-light mb-1">Sister company</div>
                <div className="font-serif text-white mb-1" style={{ fontSize: 18 }}>My Energy Doctors</div>
                <div className="font-sans font-light text-white/60 text-sm leading-relaxed">Save 15–30% on your commercial energy bills. Same trusted team, different expertise.</div>
              </div>
              <a href="https://myenergydoctors.com" target="_blank" rel="noopener noreferrer"
                className="font-sans text-sm font-medium text-white no-underline flex-shrink-0 whitespace-nowrap px-4 py-2.5 rounded-lg transition-colors"
                style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}>
                Visit Site →
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-200">
      <button onClick={() => setOpen(o => !o)} className="w-full bg-transparent border-none py-4 flex justify-between items-center cursor-pointer gap-3">
        <span className="font-sans text-sm font-medium text-navy text-left leading-snug">{q}</span>
        <span className="text-blue text-lg flex-shrink-0 leading-none transition-transform duration-200" style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}>+</span>
      </button>
      {open && <div className="font-sans font-light text-gray-500 text-sm leading-relaxed pb-4">{a}</div>}
    </div>
  );
}