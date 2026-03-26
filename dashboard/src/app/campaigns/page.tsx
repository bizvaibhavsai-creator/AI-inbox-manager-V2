"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { getCampaignAnalytics } from "@/lib/api";
import { CampaignAnalytics } from "@/lib/types";
import CampaignBarChart from "@/components/CampaignBarChart";
import CampaignTable from "@/components/CampaignTable";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCampaignAnalytics()
      .then((res) => setCampaigns(res.campaigns))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-text-muted text-[14px]">Loading campaigns...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-500 text-[15px] mb-2">Failed to load campaigns</p>
          <p className="text-text-muted text-[13px]">{error}</p>
        </div>
      </div>
    );
  }

  const bestCampaign = campaigns.length
    ? campaigns.reduce((best, c) =>
        c.interest_rate > best.interest_rate ? c : best
      )
    : null;

  const lowInterest = campaigns.filter((c) => c.interest_rate < 0.1 && c.total_replies >= 5);
  const highUnsub = campaigns.filter((c) => c.unsubscribe_rate > 0.05 && c.total_replies >= 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-[20px] font-semibold text-text-primary">Campaigns</h1>
        <span className="bg-accent-light text-accent text-[12px] font-medium px-3 py-1 rounded-full">
          {campaigns.length} campaigns
        </span>
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {bestCampaign && (
          <div className="bg-card rounded-xl p-5 border border-emerald-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-md bg-emerald-50">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="text-[12px] font-medium text-emerald-600">
                Top Performer
              </h3>
            </div>
            <p className="text-[14px] text-text-primary font-medium truncate">
              {bestCampaign.name}
            </p>
            <p className="text-[12px] text-text-muted mt-1">
              {(bestCampaign.interest_rate * 100).toFixed(1)}% interest rate
            </p>
          </div>
        )}

        <div className="bg-card rounded-xl p-5 border border-amber-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-md bg-amber-50">
              <TrendingDown className="w-4 h-4 text-amber-500" />
            </div>
            <h3 className="text-[12px] font-medium text-amber-600">
              Low Interest (&lt;10%)
            </h3>
          </div>
          {lowInterest.length > 0 ? (
            <div className="space-y-1">
              {lowInterest.slice(0, 3).map((c) => (
                <p key={c.id} className="text-[12px] text-text-secondary truncate">
                  {c.name}{" "}
                  <span className="text-amber-500 font-medium">
                    ({(c.interest_rate * 100).toFixed(1)}%)
                  </span>
                </p>
              ))}
              {lowInterest.length > 3 && (
                <p className="text-[11px] text-text-muted">
                  +{lowInterest.length - 3} more
                </p>
              )}
            </div>
          ) : (
            <p className="text-[12px] text-text-muted">No alerts</p>
          )}
        </div>

        <div className="bg-card rounded-xl p-5 border border-red-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-md bg-red-50">
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <h3 className="text-[12px] font-medium text-red-500">
              High Unsubscribe (&gt;5%)
            </h3>
          </div>
          {highUnsub.length > 0 ? (
            <div className="space-y-1">
              {highUnsub.slice(0, 3).map((c) => (
                <p key={c.id} className="text-[12px] text-text-secondary truncate">
                  {c.name}{" "}
                  <span className="text-red-500 font-medium">
                    ({(c.unsubscribe_rate * 100).toFixed(1)}%)
                  </span>
                </p>
              ))}
              {highUnsub.length > 3 && (
                <p className="text-[11px] text-text-muted">
                  +{highUnsub.length - 3} more
                </p>
              )}
            </div>
          ) : (
            <p className="text-[12px] text-text-muted">No alerts</p>
          )}
        </div>
      </div>

      {campaigns.length > 0 && <CampaignBarChart campaigns={campaigns} />}
      <CampaignTable campaigns={campaigns} />
    </div>
  );
}
