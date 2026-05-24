import Link from "next/link";

export default function AuthShell({ children, eyebrow, title, subtitle }: { children: React.ReactNode; eyebrow: string; title: React.ReactNode; subtitle?: string }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-off-white">

      {/* Brand side */}
      <aside className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-navy-dark to-navy text-white p-12 w-[44%]">
        <Link href="/" className="no-underline flex flex-col leading-none">
          <span className="font-sans text-[10px] font-semibold tracking-[0.22em] uppercase text-blue-light">My</span>
          <div className="flex items-baseline">
            <span className="font-serif text-[24px] text-white">Contract&nbsp;</span>
            <span className="font-serif italic text-[24px] text-blue-light">Doctors</span>
          </div>
        </Link>

        <div className="max-w-md">
          <div className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-teal mb-3">Our promise</div>
          <h2 className="font-serif text-4xl leading-tight mb-5">We're on your side. <em className="italic text-blue-light">Not the vendor's.</em></h2>
          <p className="font-sans font-light text-white/70 leading-relaxed">
            Every uniform and linen agreement we've ever reviewed had at least one clause built to drain the customer. We help businesses spot them and push back — with data.
          </p>
        </div>

        <div className="font-sans text-xs text-white/40">
          © 2026 My Contract Doctors · A sister of <a href="https://myenergydoctors.com" className="text-white/60 hover:text-white">My Energy Doctors</a>
        </div>
      </aside>

      {/* Form side */}
      <main className="flex-1 flex flex-col px-6 md:px-12 py-8 lg:py-12">

        {/* Mobile brand */}
        <Link href="/" className="lg:hidden no-underline flex flex-col leading-none mb-12">
          <span className="font-sans text-[9px] font-semibold tracking-[0.22em] uppercase text-blue-light">My</span>
          <div className="flex items-baseline">
            <span className="font-serif text-[20px] text-navy">Contract&nbsp;</span>
            <span className="font-serif italic text-[20px] text-blue">Doctors</span>
          </div>
        </Link>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-teal mb-3">{eyebrow}</div>
            <h1 className="font-serif text-navy text-3xl md:text-4xl leading-tight mb-2">{title}</h1>
            {subtitle && <p className="font-sans font-light text-gray-500 leading-relaxed mb-8">{subtitle}</p>}
            {!subtitle && <div className="mb-8" />}
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
