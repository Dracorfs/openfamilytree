import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DayPicker } from "react-day-picker";
import { format, isValid, parse } from "date-fns";
import { useTranslation } from "./LanguageProvider";

const MIN_YEAR = 1700;
const MAX_YEAR = new Date().getFullYear() + 5;
const POPUP_WIDTH = 288;
const POPUP_HEIGHT_EST = 340;
const VIEWPORT_PAD = 8;

function parseISO(value: string): Date | undefined {
  if (!value) return undefined;
  const d = parse(value, "yyyy-MM-dd", new Date());
  return isValid(d) ? d : undefined;
}

type Position = {
  left: number;
  width: number;
  placement: "top" | "bottom";
  top?: number;
  bottom?: number;
};

export function DatePickerField({
  value,
  onChange,
  ariaLabel,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
  placeholder?: string;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Position | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const date = parseISO(value);
  const display = date ? format(date, "MMM d, yyyy") : "";
  const placeholderText = placeholder ?? t("datepicker.pick");

  const updatePosition = useCallback(() => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(POPUP_WIDTH, vw - VIEWPORT_PAD * 2);
    let left = rect.right - width;
    if (left < VIEWPORT_PAD) left = VIEWPORT_PAD;
    if (left + width > vw - VIEWPORT_PAD) left = vw - VIEWPORT_PAD - width;
    const measuredHeight = popRef.current?.offsetHeight ?? POPUP_HEIGHT_EST;
    const spaceBelow = vh - rect.bottom;
    const spaceAbove = rect.top;
    const placement: "top" | "bottom" =
      spaceBelow < measuredHeight + 4 && spaceAbove > spaceBelow ? "top" : "bottom";
    if (placement === "bottom") {
      setPos({ top: rect.bottom + 4, left, width, placement });
    } else {
      // anchor by `bottom` so popup hugs button regardless of measured height
      setPos({ bottom: vh - rect.top + 4, left, width, placement });
    }
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    // remeasure once popup mounts so initial placement uses real height
    const raf = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(raf);
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const el = popRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => updatePosition());
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (buttonRef.current?.contains(t)) return;
      if (popRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onReflow = () => updatePosition();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onReflow);
    window.addEventListener("scroll", onReflow, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onReflow);
      window.removeEventListener("scroll", onReflow, true);
    };
  }, [open, updatePosition]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="group flex w-full items-center justify-between gap-2 rounded-md border border-slate-300 dark:border-gray-600 bg-slate-50 dark:bg-gray-800 px-2.5 py-1.5 text-sm text-left text-slate-700 dark:text-gray-200 hover:border-slate-400 dark:hover:border-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-link/60 dark:focus-visible:ring-blue-400/60 focus-visible:border-brand-link dark:focus-visible:border-blue-400 transition-colors"
      >
        <span className="flex items-center gap-2 min-w-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-slate-400 dark:text-gray-500 group-hover:text-slate-500 dark:group-hover:text-gray-400 shrink-0"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className={`truncate ${display ? "" : "text-slate-400 dark:text-gray-500"}`}>
            {display || placeholderText}
          </span>
        </span>
        {date ? (
          <button
            type="button"
            tabIndex={0}
            aria-label={t("datepicker.clear")}
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-gray-700 hover:text-slate-700 dark:hover:text-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-link/60 dark:focus-visible:ring-blue-400/60"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`shrink-0 text-slate-400 dark:text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        )}
      </button>
      {open && createPortal(
        <div
          ref={popRef}
          role="dialog"
          aria-label={ariaLabel}
          style={{
            position: "fixed",
            top: pos?.top,
            bottom: pos?.bottom,
            left: pos?.left ?? -9999,
            width: pos?.width ?? POPUP_WIDTH,
            zIndex: 1000,
            visibility: pos ? "visible" : "hidden",
          }}
          className="rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl ring-1 ring-black/5 dark:ring-white/5"
        >
          <DayPicker
            mode="single"
            selected={date}
            onSelect={(d) => {
              onChange(d ? format(d, "yyyy-MM-dd") : "");
              setOpen(false);
              buttonRef.current?.focus();
            }}
            captionLayout="dropdown"
            startMonth={new Date(MIN_YEAR, 0)}
            endMonth={new Date(MAX_YEAR, 11)}
            defaultMonth={date ?? new Date()}
            showOutsideDays
            className="oft-daypicker"
          />
        </div>,
        document.body,
      )}
    </div>
  );
}
