"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BrandHero,
  DocumentAccountGate,
  FlowProgress,
  ProcessSection,
} from "@/components/marketing/BrandSections";
import brand from "@/components/marketing/BrandSections.module.css";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]);
type PhoneFile = {
  source: "phone";
  sessionId: string;
  storagePath: string;
  name: string;
  type: string;
  size: number;
};
type AgreementSource = File | PhoneFile;
type Lead = { email: string; businessName: string; marketingConsent: boolean };
type Stage = "landing" | "account" | "upload" | "email" | "analyzing";

export default function AgreementPage() {
  const [stage, setStage] = useState<Stage>("landing");
  const [file, setFile] = useState<AgreementSource | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  useEffect(() => {
    let cancelled = false;
    const requestedStart =
      new URLSearchParams(window.location.search).get("start") === "1";
    if (requestedStart) setStage("account");
    void createClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        if (cancelled) return;
        if (requestedStart) setStage(user ? "upload" : "account");
      })
      .catch(() => {
        if (!cancelled && requestedStart) setStage("account");
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return (
    <main className={brand.page}>
      {stage !== "landing" && stage !== "account" && <FlowNav stage={stage} />}
      {stage === "landing" && <Landing />}
      {stage === "account" && <AccountGate />}
      <div
        className={
          stage !== "landing" && stage !== "account"
            ? brand.workflow
            : undefined
        }
      >
        {stage === "upload" && (
          <UploadStep
            onNext={(value) => {
              setFile(value);
              setStage("email");
            }}
          />
        )}
        {stage === "email" && (
          <EmailStep
            onNext={(value) => {
              setLead(value);
              setStage("analyzing");
            }}
          />
        )}
        {stage === "analyzing" && <AnalyzeStep file={file} lead={lead} />}
      </div>
    </main>
  );
}

function Landing() {
  return (
    <>
      <BrandHero
        eyebrow="The Agreement · Personalized review"
        title={
          <>
            Know the terms.
            <br />
            <em>Own your next move.</em>
          </>
        }
        description="Understand the renewal, increase, termination, fee, and replacement language in your actual uniform or linen service agreement. See what deserves your attention before your next vendor conversation."
        image="bakery"
        caption="The service is familiar. The terms deserve a closer look."
        actions={
          <>
            <a href="/agreement?start=1" className={brand.primary}>
              Upload my agreement <span aria-hidden="true">↗</span>
            </a>
            <a href="#agreement-details" className={brand.secondary}>
              What we review ↓
            </a>
          </>
        }
        note="One free clause preview · $49 full review · Pro for ongoing monitoring"
      />
      <section id="agreement-details" className={brand.featureSection}>
        <div className={`${brand.container} ${brand.featureLayout}`}>
          <div className={brand.featurePhoto}>
            <Image
              src="/images/home/uniforms.webp"
              alt=""
              fill
              sizes="(max-width: 760px) 100vw, 45vw"
            />
            <span>
              Your service agreement sets the rules behind every delivery,
              rental, and recurring fee.
            </span>
          </div>
          <div className={brand.featureText}>
            <p className={brand.eyebrow}>The details that shape your options</p>
            <h2>
              Not just the signature.
              <br />
              <em>Everything around it.</em>
            </h2>
            <p>
              We help you read the language that can affect your costs,
              commitments, and ability to make a change.
            </p>
            <ul className={brand.featureRows}>
              {[
                "Automatic renewal and notice deadlines",
                "Price increases and minimum commitments",
                "Termination charges and dispute terms",
                "Replacement, service fee, and exclusivity language",
              ].map((text, index) => (
                <li key={text}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {text}
                </li>
              ))}
            </ul>
            <a href="/agreement?start=1" className={brand.textLink}>
              Bring your agreement →
            </a>
          </div>
        </div>
      </section>
      <ProcessSection
        eyebrow="The whole service relationship"
        title={
          <>
            The agreement sets the rules.
            <br />
            <em>The invoices tell the story.</em>
          </>
        }
        description="Read the contract, check what was billed, and keep the record together as your service relationship changes."
        steps={[
          {
            title: "Understand the agreement",
            body: "Review your obligations, renewal deadlines, fee language, and potential negotiation points.",
          },
          {
            title: "Connect the invoices",
            body: "Compare actual rates, quantities, surcharges, credits, and replacement charges with the contract.",
          },
          {
            title: "Keep a clearer record",
            body: "Pro monitoring brings future invoices and agreement details into an ongoing review.",
          },
        ]}
      />
      <section className={brand.assurance}>
        <div className={brand.container}>
          <span aria-hidden="true">↗</span>
          <div>
            <h2>
              A better-informed
              <br />
              <em>vendor conversation.</em>
            </h2>
            <p>
              Start with a clause preview. Choose the depth of review that fits
              your business.
            </p>
          </div>
          <Link href="/pricing" className={brand.textLink}>
            Compare your options →
          </Link>
        </div>
      </section>
    </>
  );
}

function FlowNav({ stage }: { stage: Stage }) {
  const active = stage === "upload" ? 0 : stage === "email" ? 1 : 2;
  return <FlowProgress active={active} title="Your agreement review" />;
}

function AccountGate() {
  return <DocumentAccountGate kind="agreement" />;
}

function UploadStep({ onNext }: { onNext: (file: AgreementSource) => void }) {
  const [method, setMethod] = useState<"desktop" | "phone">("desktop");
  const [file, setFile] = useState<AgreementSource | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  function choose(candidate?: File) {
    setError("");
    if (!candidate) return;
    if (
      !ALLOWED_TYPES.has(candidate.type) ||
      candidate.size < 1 ||
      candidate.size > MAX_BYTES
    ) {
      setError(
        "Choose a PDF, JPG, PNG, WEBP, or HEIC file smaller than 25 MB.",
      );
      return;
    }
    setFile(candidate);
    if (candidate.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => setPreview(String(event.target?.result || ""));
      reader.readAsDataURL(candidate);
    } else setPreview("pdf");
  }
  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <div className="text-center">
        <div className="font-sans text-[11px] font-semibold uppercase tracking-wider text-teal">
          Your actual agreement
        </div>
        <h1 className="mt-2 font-serif text-4xl text-navy">
          Upload every page.
        </h1>
        <p className="mx-auto mt-3 max-w-xl font-sans text-sm leading-6 text-gray-600">
          A complete PDF is best. Clear photos also work when all legal language
          is readable.
        </p>
      </div>
      <div className="mt-8 flex rounded-xl bg-gray-100 p-1">
        {(
          [
            ["desktop", "Upload from this device"],
            ["phone", "Scan with phone"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              setMethod(key);
              setFile(null);
              setPreview(null);
              setError("");
            }}
            className={`flex-1 rounded-lg px-4 py-3 font-sans text-sm ${method === key ? "bg-white text-navy shadow-sm" : "text-gray-500"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {method === "desktop" ? (
        <div
          onClick={() => !file && inputRef.current?.click()}
          className="mt-5 cursor-pointer rounded-2xl border-2 border-dashed border-gray-300 bg-white p-10 text-center"
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(event) => choose(event.currentTarget.files?.[0])}
          />
          {!file ? (
            <>
              <div className="font-serif text-xl text-navy">
                Choose an agreement PDF or photo
              </div>
              <p className="mt-2 font-sans text-xs text-gray-500">
                Up to 25 MB
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto mb-3 flex max-h-40 justify-center">
                {preview && preview !== "pdf" ? (
                  <Image
                    src={preview}
                    alt="Selected agreement"
                    width={500}
                    height={600}
                    unoptimized
                    className="max-h-40 w-auto rounded-lg object-contain"
                  />
                ) : (
                  <div className="rounded-lg bg-navy p-6 font-sans text-white">
                    PDF
                  </div>
                )}
              </div>
              <div className="font-sans text-sm text-navy">{file.name}</div>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  setFile(null);
                  setPreview(null);
                }}
                className="mt-2 font-sans text-xs text-gray-500 underline"
              >
                Remove
              </button>
            </>
          )}
        </div>
      ) : (
        <PhoneHandoff onReady={setFile} onError={setError} />
      )}
      {error && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-red/30 bg-red-light p-3 font-sans text-sm text-red"
        >
          {error}
        </div>
      )}
      <button
        disabled={!file}
        onClick={() => file && onNext(file)}
        className="mt-5 w-full rounded-lg bg-teal px-5 py-3.5 font-sans text-sm font-semibold text-white disabled:opacity-40"
      >
        Continue →
      </button>
    </div>
  );
}

function PhoneHandoff({
  onReady,
  onError,
}: {
  onReady: (file: PhoneFile | null) => void;
  onError: (error: string) => void;
}) {
  const [session, setSession] = useState<{
    sessionId: string;
    token: string;
    uploadUrl: string;
  } | null>(null);
  const [status, setStatus] = useState("Creating a secure phone link…");
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;
    void fetch("/api/agreements/upload-sessions", { method: "POST" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(data?.error || "Phone upload could not be started.");
        if (cancelled) return;
        setSession(data);
        setStatus("Scan this code, then photograph or choose the agreement.");
        timer = setInterval(async () => {
          try {
            const response = await fetch(
              `/api/agreements/upload-sessions/${data.sessionId}`,
              { headers: { "x-upload-token": data.token }, cache: "no-store" },
            );
            const result = await response.json();
            if (!response.ok)
              throw new Error(
                result?.error || "Could not check the phone upload.",
              );
            if (result.status === "uploaded" && result.file?.storagePath) {
              if (timer) clearInterval(timer);
              setStatus(
                `${result.file.name || "Agreement"} arrived from your phone.`,
              );
              onReady({
                source: "phone",
                sessionId: data.sessionId,
                storagePath: result.file.storagePath,
                name: result.file.name || "agreement",
                type: result.file.type || "application/octet-stream",
                size: result.file.size || 0,
              });
            } else if (result.status === "uploading")
              setStatus("Your phone is sending the agreement…");
            else if (
              result.status === "expired" ||
              result.status === "failed"
            ) {
              if (timer) clearInterval(timer);
              setStatus(
                "This phone link is no longer available. Switch tabs and try again.",
              );
            }
          } catch (caught) {
            if (timer) clearInterval(timer);
            onError(
              caught instanceof Error
                ? caught.message
                : "Could not check the phone upload.",
            );
          }
        }, 1500);
      })
      .catch((caught) => {
        if (!cancelled)
          onError(
            caught instanceof Error
              ? caught.message
              : "Phone upload could not be started.",
          );
      });
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [onError, onReady]);
  return (
    <div className="mt-5 flex min-h-72 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue bg-blue-pale p-7 text-center">
      {session ? (
        <>
          <div className="rounded-xl bg-white p-3">
            <QRCodeSVG value={session.uploadUrl} size={170} />
          </div>
          <div className="mt-4 font-serif text-xl text-navy">
            Use your phone camera
          </div>
          <p
            aria-live="polite"
            className="mt-2 max-w-md font-sans text-sm text-gray-600"
          >
            {status}
          </p>
          <a
            href={session.uploadUrl}
            className="mt-2 font-sans text-xs text-blue"
          >
            Open upload on this device
          </a>
        </>
      ) : (
        <p className="font-sans text-sm text-gray-500">{status}</p>
      )}
    </div>
  );
}

function EmailStep({ onNext }: { onNext: (lead: Lead) => void }) {
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    void supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user || cancelled) return;
      setEmail(user.email || "");
      const { data } = await supabase
        .from("profiles")
        .select("business_name")
        .eq("id", user.id)
        .maybeSingle();
      if (!cancelled && data?.business_name)
        setBusinessName(data.business_name);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const valid = /^\S+@\S+\.\S+$/.test(email.trim());
  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <div className="font-sans text-[11px] font-semibold uppercase tracking-wider text-teal">
        Before analysis
      </div>
      <h1 className="mt-2 font-serif text-4xl text-navy">
        Connect this agreement to your account.
      </h1>
      <p className="mt-3 font-sans text-sm leading-6 text-gray-600">
        We associate this email with the agreement, its finding categories, and
        any matching invoices.
      </p>
      <label className="mt-7 block font-sans text-xs font-semibold text-navy">
        Email for this result
      </label>
      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 font-sans"
      />
      <label className="mt-5 block font-sans text-xs font-semibold text-navy">
        Business name{" "}
        <span className="font-normal text-gray-500">(optional)</span>
      </label>
      <input
        value={businessName}
        onChange={(event) => setBusinessName(event.target.value)}
        className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 font-sans"
      />
      <label className="mt-5 flex gap-3 font-sans text-sm leading-5 text-gray-600">
        <input
          type="checkbox"
          checked={marketingConsent}
          onChange={(event) => setMarketingConsent(event.target.checked)}
          className="mt-1"
        />
        Send relevant agreement and invoice-monitoring tips based on this
        result. Optional.
      </label>
      <button
        disabled={!valid}
        onClick={() =>
          onNext({
            email: email.trim().toLowerCase(),
            businessName: businessName.trim(),
            marketingConsent,
          })
        }
        className="mt-7 w-full rounded-lg bg-teal px-5 py-3.5 font-sans text-sm font-semibold text-white disabled:opacity-40"
      >
        Analyze my agreement →
      </button>
    </div>
  );
}

function AnalyzeStep({
  file,
  lead,
}: {
  file: AgreementSource | null;
  lead: Lead | null;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("Uploading your agreement…");
  const [error, setError] = useState("");
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void (async () => {
      try {
        if (!file || !lead)
          throw new Error("Choose the agreement and email again.");
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.replace("/sign-in?redirect=%2Fagreement");
          return;
        }
        let path: string;
        let sessionId: string | undefined;
        if (file instanceof File) {
          const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          path = `${user.id}/agreement-${Date.now()}-${safe}`;
          const { error } = await supabase.storage
            .from("invoices")
            .upload(path, file, { contentType: file.type, upsert: false });
          if (error) throw error;
        } else {
          path = file.storagePath;
          sessionId = file.sessionId;
        }
        setMessage("Reading every page and identifying legal language…");
        const response = await fetch("/api/analyze-agreement", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storage_path: path,
            bucket: "invoices",
            upload_session_id: sessionId,
          }),
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(
            data?.message ||
              data?.reason ||
              data?.error ||
              "Agreement analysis failed.",
          );
        setMessage("Saving your result and preparing the clause review…");
        const leadResponse = await fetch(
          `/api/agreements/${data.agreement_id}/lead`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(lead),
          },
        );
        if (!leadResponse.ok)
          throw new Error(
            "The agreement was analyzed, but its email record could not be saved.",
          );
        router.push(`/dashboard/agreements/${data.agreement_id}`);
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Agreement analysis failed.",
        );
      }
    })();
  }, [file, lead, router]);
  if (error)
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <h1 className="font-serif text-3xl text-navy">
          We could not complete this agreement review.
        </h1>
        <p className="mt-3 font-sans text-sm leading-6 text-gray-600">
          {error}
        </p>
        <Link
          href="/agreement"
          className="mt-6 inline-block rounded-lg bg-navy px-5 py-3 font-sans text-sm text-white no-underline"
        >
          Try again
        </Link>
      </div>
    );
  return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 animate-pulse items-center justify-center rounded-2xl bg-navy text-3xl text-white">
        §
      </div>
      <h1 className="font-serif text-3xl text-navy">
        Analyzing your agreement…
      </h1>
      <p aria-live="polite" className="mt-3 font-sans text-sm text-gray-600">
        {message}
      </p>
      <p className="mt-8 font-sans text-xs leading-5 text-gray-500">
        We do not claim an overpayment from contract language alone. Invoice
        evidence is needed to quantify what was actually billed.
      </p>
    </div>
  );
}
