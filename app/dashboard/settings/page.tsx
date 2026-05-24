import { mockUser } from "@/lib/mock-data";

export default function SettingsPage() {
  return (
    <div className="max-w-3xl flex flex-col gap-6">

      {/* Profile */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-blue mb-1">Profile</div>
        <h3 className="font-serif text-navy text-xl mb-5">Your information</h3>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-pale text-blue font-sans text-xl font-semibold flex items-center justify-center">
            {mockUser.avatarInitials}
          </div>
          <div>
            <button className="font-sans text-sm font-medium bg-off-white border border-gray-300 text-navy px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              Change photo
            </button>
            <div className="font-sans text-xs text-gray-500 mt-1.5">JPG or PNG, max 2MB</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full name" defaultValue={mockUser.name} />
          <Field label="Email" defaultValue={mockUser.email} type="email" />
          <Field label="Business name" defaultValue={mockUser.businessName} />
          <Field label="Phone" defaultValue="" placeholder="(555) 000-0000" type="tel" />
        </div>
        <div className="mt-5 flex justify-end">
          <button className="font-sans text-sm font-medium bg-navy text-white px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity cursor-pointer">
            Save changes
          </button>
        </div>
      </section>

      {/* Password */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-blue mb-1">Security</div>
        <h3 className="font-serif text-navy text-xl mb-5">Password</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Current password" type="password" />
          <div />
          <Field label="New password" type="password" />
          <Field label="Confirm new password" type="password" />
        </div>
        <div className="mt-5 flex justify-end">
          <button className="font-sans text-sm font-medium bg-navy text-white px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity cursor-pointer">
            Update password
          </button>
        </div>
      </section>

      {/* Notifications */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-blue mb-1">Notifications</div>
        <h3 className="font-serif text-navy text-xl mb-5">Email alerts</h3>
        <div className="flex flex-col gap-4">
          {[
            { label: "New invoice analysis ready", sub: "When an upload finishes processing", on: true },
            { label: "Auto-renewal window opening", sub: "90 days before your contract auto-renews", on: true },
            { label: "Weekly Industry Insights digest", sub: "Pro plan only", on: true },
            { label: "Product updates and new features", sub: "Occasional, no marketing fluff", on: false },
          ].map(n => (
            <label key={n.label} className="flex justify-between items-start gap-4 cursor-pointer">
              <div>
                <div className="font-sans text-sm text-navy">{n.label}</div>
                <div className="font-sans text-xs text-gray-500 mt-0.5">{n.sub}</div>
              </div>
              <div className={`w-11 h-6 rounded-full relative flex-shrink-0 transition-colors ${n.on ? "bg-teal" : "bg-gray-300"}`}>
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${n.on ? "translate-x-[22px]" : "translate-x-0.5"}`} />
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* Danger */}
      <section className="bg-white border-2 border-red/30 rounded-2xl p-6">
        <div className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-red mb-1">Danger zone</div>
        <h3 className="font-serif text-navy text-xl mb-3">Delete account</h3>
        <p className="font-sans font-light text-gray-500 text-sm leading-relaxed mb-5">
          Permanently delete your account and all uploaded contracts, invoices, and analyses. This cannot be undone.
        </p>
        <button className="font-sans text-sm font-medium bg-red text-white px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity cursor-pointer">
          Delete my account
        </button>
      </section>
    </div>
  );
}

function Field({ label, defaultValue, placeholder, type = "text" }: { label: string; defaultValue?: string; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="block font-sans text-xs font-semibold text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full font-sans text-sm text-navy rounded-lg px-3.5 py-2.5 border-[1.5px] border-gray-300 outline-none focus:border-blue transition-colors"
      />
    </div>
  );
}
