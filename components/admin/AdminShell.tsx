"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { Activity, ArrowUpRight, CalendarDays, ChevronRight, Contact, LayoutDashboard, LogOut, Menu, Receipt, ShieldCheck, Users, X } from "lucide-react";
const navigation = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/events", label: "Events", icon: CalendarDays },
  { href: "/admin/orders", label: "Payments & orders", icon: Receipt },
  { href: "/admin/users", label: "People & signups", icon: Users },
  { href: "/admin/contacts", label: "Attendees", icon: Contact },
  { href: "/admin/audit", label: "Activity audit", icon: Activity },
];
export default function AdminShell({ children, name }: { children: React.ReactNode; name: string }) {
  const pathname = usePathname(); const [open, setOpen] = useState(false);
  const current = navigation.find(item => item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href))?.label ?? "Details";
  return <div className="min-h-screen bg-[#F5F5F8] text-[#24202F]">
    {open && <button aria-label="Close navigation" onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-black/40 lg:hidden" />}
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#21152F] p-5 text-white transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex items-center justify-between"><Link href="/admin" onClick={() => setOpen(false)} className="font-display text-2xl font-semibold tracking-[-0.05em]">tickety<span className="text-[#BDA0F5]">.</span><span className="ml-2 rounded-md bg-white/10 px-2 py-1 align-middle font-body text-[9px] uppercase tracking-widest text-white/60">Admin</span></Link><button aria-label="Close menu" onClick={() => setOpen(false)} className="p-2 lg:hidden"><X size={18} /></button></div>
      <p className="mb-4 mt-10 px-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/40">Your control room</p>
      <nav aria-label="Admin navigation" className="space-y-1.5">{navigation.map(item => { const Icon = item.icon; const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href); return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)} className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-xs font-medium transition-colors ${active ? "bg-[#8A5CDC] text-white shadow-lg shadow-black/10" : "text-white/65 hover:bg-white/5 hover:text-white"}`}><Icon size={17} strokeWidth={1.6} />{item.label}{active && <ChevronRight size={14} className="ml-auto" />}</Link>; })}</nav>
      <div className="mt-auto pt-10"><div className="rounded-2xl border border-white/10 bg-white/5 p-4"><ShieldCheck size={20} className="text-[#CBF0A4]" /><p className="mt-3 text-xs font-medium">A clear view of every moment.</p><p className="mt-2 text-[11px] leading-5 text-white/45">Revenue, people and activity, connected in one workspace.</p></div><Link href="/" className="mt-5 flex min-h-11 items-center justify-between px-3 text-xs text-white/60 hover:text-white">Visit public site <ArrowUpRight size={15} /></Link><button onClick={() => signOut({ callbackUrl: "/login" })} className="flex min-h-11 w-full items-center gap-2 px-3 text-xs text-white/60 hover:text-white"><LogOut size={15} /> Sign out</button></div>
    </aside>
    <div className="lg:pl-64"><header className="sticky top-0 z-30 flex h-20 items-center justify-between gap-3 border-b border-[#E6E4EC] bg-white/95 px-5 backdrop-blur-sm sm:px-8"><div className="flex items-center gap-3"><button aria-label="Open admin navigation" aria-expanded={open} onClick={() => setOpen(true)} className="rounded-lg border p-2 lg:hidden"><Menu size={18} /></button><span className="hidden text-xs text-[#9992A5] sm:inline">Workspace</span><ChevronRight size={13} className="hidden text-[#C4BDCD] sm:block" /><span className="text-xs font-semibold">{current}</span></div><div className="flex items-center gap-3"><span className="hidden rounded-full bg-[#F2F9E9] px-3 py-1.5 text-[10px] font-medium text-[#4F6C30] sm:block">Administrator</span><span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-800">{name.slice(0, 1).toUpperCase()}</span><span className="max-w-32 truncate text-xs">{name}</span></div></header><div className="mx-auto max-w-[1600px] p-5 sm:p-8 lg:p-10">{children}</div></div>
  </div>;
}
