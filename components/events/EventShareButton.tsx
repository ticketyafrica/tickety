"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  Facebook,
  Link2,
  MoreHorizontal,
  Share2,
  X,
} from "lucide-react";

type EventShareButtonProps = {
  eventTitle: string;
};

export default function EventShareButton({
  eventTitle,
}: EventShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function getEventUrl() {
    return window.location.origin + window.location.pathname;
  }

  function getShareText() {
    return `Check out ${eventTitle} on Tickety!`;
  }

  useEffect(() => {
    if (!open) return;

    function handleOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function copyLink() {
    const url = getEventUrl();

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";

        document.body.appendChild(textarea);
        textarea.select();

        const successful = document.execCommand("copy");
        document.body.removeChild(textarea);

        if (!successful) {
          throw new Error("Unable to copy");
        }
      }

      setCopied(true);
      setError("");

      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        setCopied(false);
      }, 2500);
    } catch {
      setError("Unable to copy. Please try again.");
    }
  }

  function shareWhatsApp() {
    const text = `${getShareText()}\n${getEventUrl()}`;

    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function shareFacebook() {
    const url = getEventUrl();

    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function shareX() {
    const url = getEventUrl();

    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        getShareText()
      )}&url=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function shareNative() {
    if (!navigator.share) {
      setError("More sharing options aren't available on this device.");
      return;
    }

    try {
      await navigator.share({
        title: eventTitle,
        text: getShareText(),
        url: getEventUrl(),
      });

      setOpen(false);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }

      setError("Unable to open sharing options.");
    }
  }

  return (
    <div ref={containerRef} className="relative shrink-0">
      {/* Existing share icon */}
      <button
        type="button"
        onClick={() => {
          setOpen((current) => !current);
          setError("");
        }}
        aria-label="Share event"
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-white transition-all duration-200 ${
          open
            ? "border-violet-200 bg-violet-50 text-violet-600"
            : "border-zinc-200 text-zinc-500 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600"
        }`}
      >
        <Share2
          aria-hidden="true"
          className="h-4 w-4"
          strokeWidth={1.8}
        />
      </button>

      {/* Share popover */}
      {open && (
        <div
          role="dialog"
          aria-label="Share this event"
          className="absolute right-0 top-full z-50 mt-3 w-[min(320px,calc(100vw-32px))] origin-top-right rounded-[22px] border border-zinc-200 bg-white p-5 text-zinc-950 shadow-[0_20px_70px_rgba(24,24,27,0.16)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[15px] font-semibold tracking-[-0.03em]">
                Share this event
              </p>

              <p className="mt-1 text-[11px] leading-5 text-zinc-400">
                Good experiences are better shared.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close sharing options"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-colors hover:bg-zinc-200"
            >
              <X size={14} />
            </button>
          </div>

          {/* Social platforms */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={shareWhatsApp}
              className="group flex flex-col items-center gap-2"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E9F9EF] text-[#16A34A] transition-transform group-hover:-translate-y-1">
                <WhatsAppIcon />
              </span>

              <span className="text-[10px] font-medium text-zinc-600">
                WhatsApp
              </span>
            </button>

            <button
              type="button"
              onClick={shareFacebook}
              className="group flex flex-col items-center gap-2"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF3FF] text-[#1877F2] transition-transform group-hover:-translate-y-1">
                <Facebook size={20} />
              </span>

              <span className="text-[10px] font-medium text-zinc-600">
                Facebook
              </span>
            </button>

            <button
              type="button"
              onClick={shareX}
              className="group flex flex-col items-center gap-2"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-900 transition-transform group-hover:-translate-y-1">
                <XBrandIcon />
              </span>

              <span className="text-[10px] font-medium text-zinc-600">
                X
              </span>
            </button>
          </div>

          {/* Divider */}
          <div className="my-5 h-px bg-zinc-100" />

          {/* Copy link */}
          <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-400">
            Event link
          </p>

          <button
            type="button"
            onClick={copyLink}
            className={`flex w-full items-center justify-between gap-3 rounded-[13px] border px-3.5 py-3 text-left transition-colors ${
              copied
                ? "border-green-200 bg-green-50"
                : "border-zinc-200 bg-[#FAFAFA] hover:border-violet-200"
            }`}
          >
            <span className="flex min-w-0 items-center gap-2">
              <Link2
                size={15}
                className={copied ? "text-green-600" : "shrink-0 text-zinc-400"}
              />

              <span className="truncate text-[11px] font-medium text-zinc-600">
                {copied ? "Link copied!" : "Copy event link"}
              </span>
            </span>

            {copied ? (
              <Check size={16} className="shrink-0 text-green-600" />
            ) : (
              <Copy size={15} className="shrink-0 text-zinc-500" />
            )}
          </button>

          {/* Native share */}
          <button
            type="button"
            onClick={shareNative}
            className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-[12px] bg-[#111014] px-4 text-xs font-semibold text-white transition-colors hover:bg-violet-700"
          >
            <MoreHorizontal size={17} />
            More sharing options
          </button>

          {error && (
            <p role="alert" className="mt-3 text-xs text-red-600">
              {error}
            </p>
          )}

          <span className="sr-only" role="status">
            {copied ? "Event link copied to clipboard" : ""}
          </span>
        </div>
      )}
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20.3 11.8a8.3 8.3 0 0 1-12.1 7.4L3.5 20.5l1.3-4.5a8.3 8.3 0 1 1 15.5-4.2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 8.3c-.4-.8-.8-.7-1.1-.7-.4 0-.9.5-.9 1.3 0 .9.8 2.5 2.1 3.8 1.4 1.3 3 2.1 4.3 2.3.8.1 1.7-.2 2.1-.8.3-.4.3-.9.2-1.1l-2.2-1c-.2-.1-.4 0-.5.2l-.8 1c-1.4-.5-2.5-1.6-3.1-3l.9-.7c.2-.2.3-.4.2-.6l-1.2-2.3Z"
        fill="currentColor"
      />
    </svg>
  );
}

function XBrandIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="19"
      height="19"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.6 5.5 22H2.3l7.3-8.5L1.9 2h6.5l4.5 6.8L18.9 2Zm-1.1 18h1.7L7.5 3.9H5.7L17.8 20Z" />
    </svg>
  );
}
