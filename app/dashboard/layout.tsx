import PortalShell from "@/components/portal/PortalShell";

export const metadata = {
  title: "Dashboard | My Contract Doctors",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell>{children}</PortalShell>;
}
