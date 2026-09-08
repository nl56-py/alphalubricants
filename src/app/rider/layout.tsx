import { DashboardShell } from '@/components/dashboard/DashboardShell';
export const metadata = { title: 'Rider workspace | Alpha Lubricants', robots: { index: false, follow: false } };
export default function RiderLayout({ children }: { children: React.ReactNode }) { return <DashboardShell role="RIDER">{children}</DashboardShell>; }
