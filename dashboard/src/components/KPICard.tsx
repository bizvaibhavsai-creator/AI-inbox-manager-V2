"use client";

import { type LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: number;
  color: string;
  icon: LucideIcon;
}

const colorMap: Record<string, { icon: string; bg: string }> = {
  blue:   { icon: "text-[#0814fa]", bg: "bg-[#E8EAFF]" },
  green:  { icon: "text-emerald-600", bg: "bg-emerald-50" },
  red:    { icon: "text-red-500", bg: "bg-red-50" },
  yellow: { icon: "text-amber-500", bg: "bg-amber-50" },
  orange: { icon: "text-orange-500", bg: "bg-orange-50" },
  purple: { icon: "text-violet-600", bg: "bg-violet-50" },
  amber:  { icon: "text-amber-600", bg: "bg-amber-50" },
  teal:   { icon: "text-teal-600", bg: "bg-teal-50" },
};

export default function KPICard({ title, value, color, icon: Icon }: KPICardProps) {
  const colors = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-card rounded-xl p-5 border border-border shadow-sm flex items-center gap-4">
      <div className={`p-2.5 rounded-lg ${colors.bg}`}>
        <Icon className={`w-5 h-5 ${colors.icon}`} />
      </div>
      <div>
        <p className="text-2xl font-semibold text-text-primary">{value.toLocaleString()}</p>
        <p className="text-[12px] text-text-muted mt-0.5">{title}</p>
      </div>
    </div>
  );
}
