import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { WHATSAPP_NUMBER } from "@/lib/services";

export default function WhatsAppContact() {
  const message = "Hi Tickety! I'd like some help with an event or booking.";

  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Tickety on WhatsApp (opens in a new tab)"
      className="group fixed right-0 top-[60%] z-40 flex min-h-20 w-14 -translate-y-1/2 flex-col items-center justify-center gap-2 rounded-l-[22px] border border-r-0 border-white/30 bg-gradient-to-br from-[#7C3AED] to-[#4C1D95] py-4 text-white shadow-[-4px_8px_30px_rgba(76,29,149,0.22)] transition-[width,box-shadow] duration-200 hover:w-16 hover:shadow-[-6px_10px_36px_rgba(76,29,149,0.32)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-600 sm:min-h-24 sm:w-16 sm:hover:w-[72px]"
    >
      <span className="relative">
        <svg width="27" height="27" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M20.52 3.48A11.9 11.9 0 0 0 12.05 0C5.46 0 .1 5.36.1 11.95c0 2.11.55 4.17 1.6 5.99L0 24l6.23-1.63a11.93 11.93 0 0 0 5.82 1.48h.01C18.65 23.85 24 18.49 24 11.9c0-3.19-1.24-6.19-3.48-8.42ZM12.06 21.83a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-3.7.97.99-3.61-.24-.37a9.88 9.88 0 0 1-1.52-5.28c0-5.48 4.46-9.94 9.94-9.94 2.66 0 5.15 1.04 7.03 2.92a9.87 9.87 0 0 1 2.91 7.03c0 5.48-4.46 9.94-10 9.87Zm5.45-7.44c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15s-.77.97-.94 1.17c-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.09 4.49.71.3 1.27.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.77-.73 2.02-1.44.25-.7.25-1.3.17-1.43-.07-.12-.27-.2-.57-.35Z" />
        </svg>
      </span>
      <span aria-hidden="true" className="text-[8px] font-semibold uppercase tracking-[0.14em] text-white/85">Let’s talk</span>
      <span aria-hidden="true" className="absolute left-0 top-5 h-5 w-[3px] rounded-r-full bg-[#DDF7AE]" />

      <span aria-hidden="true" className="pointer-events-none absolute right-full mr-3 hidden w-60 translate-x-2 rounded-[20px] border border-violet-100 bg-white p-5 text-left text-[#21172F] opacity-0 shadow-[0_12px_40px_rgba(33,23,47,0.12)] transition-[opacity,transform] duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 sm:block">
        <Image src="/images/logo/logos.png" alt="" width={120} height={30} className="h-auto w-[120px]" />
        <span className="mt-4 block font-display text-base font-semibold tracking-[-0.03em]">Good moments start here.</span>
        <span className="mt-1 block text-xs leading-5 text-black/50">Questions about tickets or your next event? Let’s chat.</span>
        <span className="mt-4 flex items-center justify-between border-t border-violet-100 pt-3 text-xs font-semibold text-violet-700">Chat on WhatsApp <ArrowUpRight size={15} /></span>
      </span>
    </a>
  );
}
