"use client";

import { useState, useEffect } from "react";
import {
  Mail,
  ThumbsUp,
  ThumbsDown,
  Clock,
  AlertTriangle,
  HelpCircle,
  Hourglass,
  Send,
} from "lucide-react";
import { getOverview } from "@/lib/api";
import { OverviewData, Period } from "@/lib/types";
import KPICard from "@/components/KPICard";
import PeriodFilter from "@/components/PeriodFilter";
import CategoryPieChart from "@/components/CategoryPieChart";
import TimelineChart from "@/components/TimelineChart";

export default function OverviewPage() {
  const [period, setPeriod] = useState<Period>("all");
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getOverview(period)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-text-muted text-[14px]">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-500 text-[15px] mb-2">Failed to load data</p>
          <p className="text-text-muted text-[13px]">{error}</p>
          <p className="text-text-muted text-[11px] mt-4">
            Make sure the API server is running on{" "}
            {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}
          </p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[20px] font-semibold text-text-primary">Overview</h1>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Replies" value={data.total} color="blue" icon={Mail} />
        <KPICard title="Interested" value={data.by_category.interested} color="green" icon={ThumbsUp} />
        <KPICard title="Not Interested" value={data.by_category.not_interested} color="red" icon={ThumbsDown} />
        <KPICard title="Out of Office" value={data.by_category.ooo} color="yellow" icon={Clock} />
        <KPICard title="Unsubscribe" value={data.by_category.unsubscribe} color="orange" icon={AlertTriangle} />
        <KPICard title="Info Request" value={data.by_category.info_request} color="purple" icon={HelpCircle} />
        <KPICard title="Pending Approval" value={data.by_status.pending_approval} color="amber" icon={Hourglass} />
        <KPICard title="Sent" value={data.by_status.sent} color="teal" icon={Send} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryPieChart data={data.by_category} />
        <TimelineChart data={data.daily_volumes} />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Time */}
        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
          <h3 className="text-[14px] font-semibold text-text-primary mb-4">
            Avg Response Time
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-semibold text-accent">
              {data.avg_response_time_hours.toFixed(1)}
            </span>
            <span className="text-[14px] text-text-muted">hours</span>
          </div>
          <p className="text-[12px] text-text-muted mt-2">
            Average time to process and respond to incoming replies
          </p>
        </div>

        {/* Follow-up Stats */}
        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
          <h3 className="text-[14px] font-semibold text-text-primary mb-4">
            Follow-up Stats
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-semibold text-text-primary">
                {data.follow_up_stats.total}
              </p>
              <p className="text-[12px] text-text-muted">Total</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-amber-500">
                {data.follow_up_stats.pending}
              </p>
              <p className="text-[12px] text-text-muted">Pending</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-emerald-600">
                {data.follow_up_stats.sent}
              </p>
              <p className="text-[12px] text-text-muted">Sent</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-text-muted">
                {data.follow_up_stats.skipped}
              </p>
              <p className="text-[12px] text-text-muted">Skipped</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
