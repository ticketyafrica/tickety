import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata({ title: 'Admin · Events', noIndex: true });
export default function PageLayout({ children }: { children: React.ReactNode }) { return children; }
