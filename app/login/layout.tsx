import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata({ title: 'Sign In', noIndex: true });
export default function PageLayout({ children }: { children: React.ReactNode }) { return children; }
