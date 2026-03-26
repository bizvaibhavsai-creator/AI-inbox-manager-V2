"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CampaignAnalytics } from "@/lib/types";

interface CampaignBarChartProps {
  campaigns: CampaignAnalytics[];
}

const CATEGORY_COLORS: Record<string, string> = {
  interested: "#059669",
  not_interested: "#EF4444",
  ooo: "#F59E0B",
  unsubscribe: "#F97316",
  info_request: "#7C3AED",
  wrong_person: "#9CA3AF",
  dnc: "#E11D48",
};

const CATEGORY_LABELS: Record<string, string> = {
  interested: "Interested",
  not_interested: "Not Interested",
  ooo: "OOO",
  unsubscribe: "Unsubscribe",
  info_request: "Info Request",
  wrong_person: "Wrong Person",
  dnc: "DNC",
};

export default function CampaignBarChart({ campaigns }: CampaignBarChartProps) {
  const chartData = campaigns.map((c) => ({
    name: c.name.length > 20 ? c.name.slice(0, 20) + "..." : c.name,
    interested: c.by_category.interested,
    not_interested: c.by_category.not_interested,
    ooo: c.by_category.ooo,
    unsubscribe: c.by_category.unsubscribe,
    info_request: c.by_category.info_request,
    wrong_person: c.by_category.wrong_person,
    dnc: c.by_category.dnc,
  }));

  const categories = Object.keys(CATEGORY_COLORS);

  return (
    <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
      <h3 className="text-[14px] font-semibold text-text-primary mb-4">
        Campaign Category Breakdown
      </h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="name"
            stroke="#9CA3AF"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            angle={-30}
            textAnchor="end"
            height={80}
          />
          <YAxis
            stroke="#9CA3AF"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: "10px",
              color: "#111827",
              fontSize: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
          />
          <Legend
            wrapperStyle={{ color: "#6B7280", fontSize: "11px" }}
            iconSize={8}
          />
          {categories.map((cat) => (
            <Bar
              key={cat}
              dataKey={cat}
              stackId="a"
              fill={CATEGORY_COLORS[cat]}
              name={CATEGORY_LABELS[cat]}
              radius={cat === "dnc" ? [3, 3, 0, 0] : undefined}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
