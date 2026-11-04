"use client";

import { useRef } from "react";

type Props = {
  id: string;
  label: string;
  length: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export default function PayoutPinInput({ id, label, length, value, onChange, disabled }: Props) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  function enterDigits(index: number, text: string) {
    const digits = text.replace(/\D/g, "");
    if (!digits) return;
    const start = Math.min(index, value.length);
    const next = (value.slice(0, start) + digits + value.slice(start + digits.length)).slice(0, length);
    onChange(next);
    inputs.current[Math.min(start + digits.length, length - 1)]?.focus();
  }

  return (
    <fieldset disabled={disabled}>
      <legend className="text-xs font-semibold">{label} ({length} digits)</legend>
      <div className="mt-2 flex gap-2">
        {Array.from({ length }, (_, index) => (
          <input
            key={index}
            id={`${id}-${index + 1}`}
            ref={(element) => { inputs.current[index] = element; }}
            type="password"
            inputMode="numeric"
            autoComplete="off"
            aria-label={`${label}, digit ${index + 1} of ${length}`}
            value={value[index] || ""}
            required
            pattern="[0-9]"
            maxLength={1}
            onChange={(event) => {
              if (event.target.value) enterDigits(index, event.target.value);
              else onChange(value.slice(0, index) + value.slice(index + 1));
            }}
            onFocus={(event) => event.target.select()}
            onPaste={(event) => {
              event.preventDefault();
              enterDigits(index, event.clipboardData.getData("text"));
            }}
            onKeyDown={(event) => {
              if (event.key === "Backspace" && !value[index] && index > 0) {
                event.preventDefault();
                onChange(value.slice(0, index - 1) + value.slice(index));
                inputs.current[index - 1]?.focus();
              } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                event.preventDefault();
                inputs.current[index + (event.key === "ArrowLeft" ? -1 : 1)]?.focus();
              }
            }}
            className="h-12 min-w-0 w-10 rounded-lg border border-black/10 bg-white text-center text-lg outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:opacity-50"
          />
        ))}
      </div>
    </fieldset>
  );
}
