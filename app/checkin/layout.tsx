import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata({ title: 'Ticket Check-in', noIndex: true });
export default function PageLayout({ children }: { children: React.ReactNode }) { return children; }
