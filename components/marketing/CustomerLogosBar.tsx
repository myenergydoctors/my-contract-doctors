// Mock customer category bar — used under the homepage hero to signal traction
// without making vendor-specific claims. Replace with real customer logos when
// available + signed.

import { SITE } from "@/lib/site";

const CATEGORIES = [
  { label: "Restaurants",   icon: "🍴" },
  { label: "Healthcare",    icon: "✚" },
  { label: "Manufacturing", icon: "⚙" },
  { label: "Retail",        icon: "▣" },
  { label: "Hospitality",   icon: "✦" },
  { label: "Automotive",    icon: "◐" },
];

export default function CustomerLogosBar() {
  return (
    <section className="bg-white border-y border-gray-200 px-6 md:px-8 py-8 md:py-10">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-5">
          <span className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-gray-500">
            Trusted by small businesses across
          </span>
        </div>
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 md:gap-x-12">
          {CATEGORIES.map(({ label, icon }) => (
            <div key={label} className="flex items-center gap-2 font-sans text-gray-400 hover:text-navy transition-colors">
              <span className="text-xl leading-none">{icon}</span>
              <span className="font-serif text-base md:text-lg">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
