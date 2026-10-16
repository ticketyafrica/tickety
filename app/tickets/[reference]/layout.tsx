import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata({ title: 'Tickets · Your Tickets', noIndex: true });
export default function PageLayout({ children }: { children: React.ReactNode }) { return children; }
