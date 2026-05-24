import { mockUser } from "@/lib/mock-data";

const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    cadence: "forever",
    description: "Get one free recommendation per invoice. Best for testing the waters.",
    features: [
      "1 free recommendation per invoice",
      "Upload 1 invoice/month",
      "No contract analysis",
      "No industry insights",
    ],
  },
  {
    id: "agreement",
    name: "Agreement",
    price: "$49",
    cadence: "one-time per agreement",
    description: "Full personalized analysis of one specific contract.",
    features: [
      "One full contract analysis",
      "Clause-by-clause breakdown",
      "Negotiation email drafts",
      "Lifetime access to that analysis",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$49",
    cadence: "per month",
    description: "For businesses serious about controlling their service spend.",
    features: [
      "Unlimited invoice analyses",
      "Unlimited contract analyses",
      "Industry Insights dashboard",
      "Priority dispute letter generation",
      "Quarterly contract review reminders",
    ],
    highlighted: true,
  },
];

export default function BillingPage() {
  return (
    <div className="max-w-6xl">

      {/* Current plan */}
      <section className="bg-gradient-to-br from-navy to-navy-dark text-white rounded-2xl p-6 md:p-8 mb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <div className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-blue-light mb-2">Current plan</div>
            <div className="font-serif text-3xl md:text-4xl capitalize mb-1">{mockUser.plan}</div>
            <div className="font-sans font-light text-white/65 text-sm">Member since {new Date(mockUser.joinedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</div>
          </div>
          <div className="flex gap-3">
            <button className="font-sans text-sm font-medium bg-white/10 border border-white/20 text-white px-4 py-2.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer">
              View invoices
            </button>
            <button className="font-sans text-sm font-medium bg-red text-white px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity cursor-pointer">
              Cancel plan
            </button>
          </div>
        </div>
      </section>

      {/* Plans */}
      <div className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-blue mb-4">Available plans</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map(plan => (
          <div
            key={plan.id}
            className={`relative rounded-2xl p-6 flex flex-col ${plan.highlighted ? "border-2 border-teal bg-white shadow-xl scale-100 md:scale-105" : "border border-gray-200 bg-white"}`}
          >
            {plan.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal text-white font-sans text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full">
                Recommended
              </div>
            )}
            {mockUser.plan === plan.id && (
              <div className="absolute top-4 right-4 bg-blue-pale text-blue font-sans text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded">
                Current
              </div>
            )}

            <h3 className="font-serif text-navy text-2xl mb-1">{plan.name}</h3>
            <div className="mb-3">
              <span className="font-serif text-navy text-3xl">{plan.price}</span>
              <span className="font-sans font-light text-gray-500 text-sm ml-2">{plan.cadence}</span>
            </div>
            <p className="font-sans font-light text-gray-500 text-sm leading-relaxed mb-5">{plan.description}</p>
            <ul className="flex flex-col gap-2 mb-6 flex-1">
              {plan.features.map(f => (
                <li key={f} className="flex gap-2 items-start font-sans text-sm text-navy">
                  <span className={`text-base leading-tight flex-shrink-0 ${plan.highlighted ? "text-teal" : "text-blue"}`}>✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              disabled={mockUser.plan === plan.id}
              className={`font-sans text-sm font-medium px-5 py-3 rounded-lg cursor-pointer transition-all ${
                mockUser.plan === plan.id
                  ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                  : plan.highlighted
                  ? "bg-teal text-white hover:opacity-90"
                  : "bg-navy text-white hover:opacity-90"
              }`}
            >
              {mockUser.plan === plan.id ? "Current plan" : `Switch to ${plan.name}`}
            </button>
          </div>
        ))}
      </div>

      {/* Billing history */}
      <section className="mt-10">
        <div className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-blue mb-3">Billing history</div>
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {[
            { date: "Apr 14, 2026", desc: "Pro plan — monthly", amount: "$49.00", status: "Paid" },
            { date: "Mar 14, 2026", desc: "Pro plan — monthly", amount: "$49.00", status: "Paid" },
            { date: "Feb 14, 2026", desc: "Pro plan — monthly", amount: "$49.00", status: "Paid" },
            { date: "Jan 14, 2026", desc: "Pro plan — monthly", amount: "$49.00", status: "Paid" },
          ].map((row, i) => (
            <div key={i} className="flex justify-between items-center px-5 py-3 border-b last:border-b-0 border-gray-100">
              <div>
                <div className="font-sans text-sm text-navy">{row.desc}</div>
                <div className="font-sans text-xs text-gray-500 mt-0.5">{row.date}</div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-sans text-[10px] font-semibold uppercase tracking-wider bg-teal-light text-teal px-2 py-1 rounded">{row.status}</span>
                <span className="font-serif text-navy">{row.amount}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
