"use client";

import { usePathname } from "next/navigation";

import SiteNavigation from "@/components/layout/SiteNavigation";
import Footer from "@/components/layout/Footer";

export default function ConditionalSiteChrome({
  footer = false,
}: {
  footer?: boolean;
}) {
  const pathname = usePathname();

  /*
   * Staff pages have their own navigation/header.
   *
   * This includes:
   * /staff/check-in
   * /staff/check-in/[eventId]
   * /staff/invite/[token]
   */
  const isStaffRoute = pathname?.startsWith("/staff");

  if (isStaffRoute || pathname === "/admin" || pathname.startsWith("/admin/")) {
    return null;
  }

  return footer ? <Footer /> : <SiteNavigation />;
}