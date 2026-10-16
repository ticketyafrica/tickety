import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata({ title: 'Admin · Orders', noIndex: true });
export default function PageLayout({ children }: { children: React.ReactNode }) { return children; }
