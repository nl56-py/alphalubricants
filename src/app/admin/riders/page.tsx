import Link from 'next/link';
import { ResourceManager } from '@/components/dashboard/ResourceManager';
export default function RidersPage() { return <><p>Public rider photos and biographies are managed in <Link href="/admin/content">Website content ? Rider profiles</Link>. This section manages rider sign-in accounts and sales access.</p><ResourceManager resource="riders" /></>; }
