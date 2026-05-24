import Link from "next/link";

type Module = {
  id: string;
  name: string;
  description: string;
  status: "active" | "available" | "coming-soon";
  sister?: boolean;
  icon: string;
  accent: string;
  url?: string;       // external link for "available" modules
  cta?: string;       // button label for "available" modules
};

const modules: Module[] = [
  {
    id: "uniform",
    name: "Uniform & Linen Contracts",
    description: "Analyze and optimize uniform, linen, mat, and facility service agreements from Cintas, UniFirst, ALSCO, and more.",
    status: "active",
    icon: "▤",
    accent: "from-teal to-blue",
  },
  {
    id: "energy",
    name: "Commercial Energy",
    description: "Audit your electricity and natural gas bills, find rate misalignments, and benchmark against competitive suppliers.",
    status: "available",
    sister: true,
    icon: "◬",
    accent: "from-amber-500 to-red",
    url: "https://myenergydoctors.com",
    cta: "Visit My Energy Doctors →",
  },
  {
    id: "fleet-fuel",
    name: "Fleet Fueling Services",
    description: "Fleet fuel cards with nationwide discounts, online tracking, and security controls. No card or annual fees on the small-business option — backed by 60+ years of combined fuel-industry experience.",
    status: "available",
    sister: true,
    icon: "⬢",
    accent: "from-amber-600 to-amber-800",
    url: "https://360fuelcard.com",
    cta: "Visit 360 Fuel Card →",
  },
  {
    id: "marketing",
    name: "Marketing Services",
    description: "Web design, branding, and digital marketing for small businesses ready to look like the leaders they're becoming. Our sister agency builds sites that do the selling for you.",
    status: "available",
    sister: true,
    icon: "✦",
    accent: "from-blue-light to-navy",
    url: "https://oscwebdesign.com",
    cta: "Visit OSC Web Design →",
  },
  {
    id: "telecom",
    name: "Telecom & Internet",
    description: "Comb through your business phone, fiber, and managed services bills for over-billing, unused lines, and rate creep.",
    status: "coming-soon",
    icon: "◫",
    accent: "from-blue to-blue-mid",
  },
  {
    id: "waste",
    name: "Waste & Recycling",
    description: "Decode your waste hauler invoices — fuel surcharges, environmental fees, and overage charges are rarely audited.",
    status: "coming-soon",
    icon: "◉",
    accent: "from-navy to-blue-mid",
  },
  {
    id: "merchant",
    name: "Merchant Services",
    description: "Audit credit card processing fees, interchange downgrades, and statement padding from your payment processor.",
    status: "coming-soon",
    icon: "◐",
    accent: "from-blue-light to-teal",
  },
  {
    id: "insurance",
    name: "Commercial Insurance",
    description: "Have us review your policy renewals for coverage gaps, double-billing, and overlooked discounts.",
    status: "coming-soon",
    icon: "▥",
    accent: "from-red to-amber-600",
  },
  {
    id: "shipping",
    name: "Shipping & Logistics",
    description: "Audit your FedEx, UPS, and freight invoices for late-delivery refunds, dimensional weight games, and accessorial surcharges most businesses never claim back.",
    status: "coming-soon",
    icon: "▰",
    accent: "from-gray-500 to-navy-dark",
  },
];

export default function ModulesPage() {
  return (
    <div className="max-w-6xl">

      {/* Header */}
      <div className="mb-8">
        <p className="font-sans font-light text-gray-500 leading-relaxed max-w-3xl">
          My Contract Doctors started with uniform agreements, but we're applying the same approach to every recurring business expense. Activate the modules that match your spend.
        </p>
      </div>

      {/* Modules grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {modules.map(m => (
          <div key={m.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col">
            <div className={`h-2 bg-gradient-to-r ${m.accent}`} />
            <div className="p-6 flex flex-col flex-1">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${m.accent} flex items-center justify-center text-white text-xl`}>{m.icon}</div>
                <ModuleBadge status={m.status} sister={m.sister} />
              </div>
              <h3 className="font-serif text-navy text-lg leading-tight mb-2">{m.name}</h3>
              <p className="font-sans font-light text-gray-500 text-sm leading-relaxed mb-5 flex-1">{m.description}</p>
              {m.status === "active" && (
                <Link href="/dashboard" className="font-sans text-sm font-medium bg-navy text-white px-4 py-2.5 rounded-lg no-underline text-center hover:opacity-90 transition-opacity">
                  Open module
                </Link>
              )}
              {m.status === "available" && m.url && (
                <a href={m.url} target="_blank" rel="noopener noreferrer" className="font-sans text-sm font-medium bg-teal text-white px-4 py-2.5 rounded-lg no-underline text-center hover:opacity-90 transition-opacity">
                  {m.cta || "Visit site →"}
                </a>
              )}
              {m.status === "coming-soon" && (
                <button className="font-sans text-sm font-medium bg-off-white border border-gray-200 text-gray-500 px-4 py-2.5 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  Notify me when ready
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ModuleBadge({ status, sister }: { status: string; sister?: boolean }) {
  if (status === "active") return <span className="font-sans text-[10px] font-semibold uppercase tracking-wider bg-teal-light text-teal px-2 py-1 rounded">Active</span>;
  if (sister) return <span className="font-sans text-[10px] font-semibold uppercase tracking-wider bg-blue-pale text-blue px-2 py-1 rounded">Sister site</span>;
  return <span className="font-sans text-[10px] font-semibold uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-1 rounded">Coming soon</span>;
}
