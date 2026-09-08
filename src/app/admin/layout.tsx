import { DashboardShell } from '@/components/dashboard/DashboardShell';
export const metadata = { title: 'Business workspace | Alpha Lubricants', robots: { index: false, follow: false } };
export default function AdminLayout({ children }: { children: React.ReactNode }) { return <DashboardShell>{children}</DashboardShell>; }
