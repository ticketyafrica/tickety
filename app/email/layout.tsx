import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata({ title: "Email", noIndex: true });
export default function SectionLayout({ children }: { children: React.ReactNode }) { return children; }
