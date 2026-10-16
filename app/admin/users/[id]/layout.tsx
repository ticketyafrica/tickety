import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata({ title: 'Admin · Users · Details', noIndex: true });
export default function PageLayout({ children }: { children: React.ReactNode }) { return children; }
