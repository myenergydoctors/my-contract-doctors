import { getPlan } from "@/lib/checkout-plans";
import {
  annualOfferQuote,
  money,
  type OfferSource,
} from "@/lib/annual-offer/domain";
import AnnualOfferButton from "./AnnualOfferButton";
export default function AnnualUpgradeOffer({
  source,
  invoice,
  agreement,
}: {
  source: OfferSource;
  invoice?: string;
  agreement?: string;
}) {
  const quote = annualOfferQuote(getPlan("pro-annual")!.priceCents);
  return (
    <aside className="my-6 rounded-2xl border border-teal/25 bg-teal-light p-5 text-left text-navy">
      <p className="font-sans text-xs font-semibold uppercase tracking-wider text-teal">
        Get the complete Pro membership
      </p>
      <h3 className="mt-2 font-serif text-2xl">
        Save 30% on your first annual term.
      </h3>
      <p className="mt-3 font-sans text-sm leading-6 text-gray-700">
        Choose ongoing monitoring and Pro’s invoice and agreement allowances for{" "}
        {money(quote.firstTermPriceCents)} for the first year, instead of{" "}
        {money(quote.listPriceCents)}. Subsequent years are at the then-current
        full price.
      </p>
      <AnnualOfferButton
        source={source}
        invoice={invoice}
        agreement={agreement}
        className="mt-4 rounded-lg bg-navy px-5 py-3 font-sans text-sm font-semibold text-white"
      >
        Yes, show my annual offer →
      </AnnualOfferButton>
      <p className="mt-3 font-sans text-xs leading-5 text-gray-500">
        Optional upgrade. Your original one-time or monthly option remains
        available. No-charge checkout preview.
      </p>
    </aside>
  );
}
