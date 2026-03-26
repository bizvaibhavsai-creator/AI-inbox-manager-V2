"use client";

import { Period } from "@/lib/types";

interface PeriodFilterProps {
  value: Period;
  onChange: (period: Period) => void;
}

const options: { label: string; value: Period }[] = [
  { label: "All Time", value: "all" },
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
];

export default function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  return (
    <div className="flex bg-card rounded-lg border border-border p-1 shadow-sm">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-4 py-1.5 text-[12px] font-medium rounded-md transition-all ${
            value === opt.value
              ? "bg-accent text-white shadow-sm"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
