import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { format, isValid, parse } from "date-fns";

const MIN_YEAR = 1700;
const MAX_YEAR = new Date().getFullYear() + 5;

function parseISO(value: string): Date | undefined {
  if (!value) return undefined;
  const d = parse(value, "yyyy-MM-dd", new Date());
  return isValid(d) ? d : undefined;
}

export function DatePickerField({
  value,
  onChange,
  ariaLabel,
  placeholder = "Pick a date",
}: {
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const date = parseISO(value);
  const display = date ? format(date, "MMM d, yyyy") : "";

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded border border-slate-300 dark:border-gray-600 bg-slate-50 dark:bg-gray-800 px-2 py-1 text-sm text-left text-slate-700 dark:text-gray-200 hover:border-slate-400 dark:hover:border-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-link dark:focus:ring-blue-400"
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
            className="text-slate-400 dark:text-gray-500 shrink-0"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className={`truncate ${display ? "" : "text-slate-400 dark:text-gray-500"}`}>
            {display || placeholder}
          </span>
        </span>
        {date && (
          <span
            role="button"
            aria-label="Clear date"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onChange("");
              }
            }}
            className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-gray-700 hover:text-slate-700 dark:hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </span>
        )}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 rounded-md border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
          <DayPicker
            mode="single"
            selected={date}
            onSelect={(d) => {
              onChange(d ? format(d, "yyyy-MM-dd") : "");
              setOpen(false);
            }}
            captionLayout="dropdown"
            startMonth={new Date(MIN_YEAR, 0)}
            endMonth={new Date(MAX_YEAR, 11)}
            defaultMonth={date ?? new Date()}
            showOutsideDays
            className="oft-daypicker"
          />
        </div>
      )}
    </div>
  );
}
