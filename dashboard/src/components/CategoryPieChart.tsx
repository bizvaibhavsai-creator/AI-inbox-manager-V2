"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CategoryCounts } from "@/lib/types";

interface CategoryPieChartProps {
  data: CategoryCounts;
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
  ooo: "Out of Office",
  unsubscribe: "Unsubscribe",
  info_request: "Info Request",
  wrong_person: "Wrong Person",
  dnc: "DNC",
};

export default function CategoryPieChart({ data }: CategoryPieChartProps) {
  const chartData = Object.entries(data)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({
      name: CATEGORY_LABELS[key] || key,
      value,
      color: CATEGORY_COLORS[key] || "#9CA3AF",
    }));

  return (
    <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
      <h3 className="text-[14px] font-semibold text-text-primary mb-4">
        Replies by Category
      </h3>
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            outerRadius={100}
            innerRadius={55}
            paddingAngle={3}
            dataKey="value"
            nameKey="name"
            strokeWidth={0}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
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
            wrapperStyle={{ color: "#6B7280", fontSize: "12px" }}
            iconType="circle"
            iconSize={8}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
