"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { CampaignAnalytics } from "@/lib/types";

interface CampaignTableProps {
  campaigns: CampaignAnalytics[];
}

type SortKey =
  | "name"
  | "total_replies"
  | "interested"
  | "not_interested"
  | "ooo"
  | "info_request"
  | "unsubscribe"
  | "interest_rate"
  | "unsubscribe_rate";

type SortDir = "asc" | "desc";

function getValue(campaign: CampaignAnalytics, key: SortKey): number | string {
  switch (key) {
    case "name":
      return campaign.name;
    case "total_replies":
      return campaign.total_replies;
    case "interested":
      return campaign.by_category.interested;
    case "not_interested":
      return campaign.by_category.not_interested;
    case "ooo":
      return campaign.by_category.ooo;
    case "info_request":
      return campaign.by_category.info_request;
    case "unsubscribe":
      return campaign.by_category.unsubscribe;
    case "interest_rate":
      return campaign.interest_rate;
    case "unsubscribe_rate":
      return campaign.unsubscribe_rate;
    default:
      return 0;
  }
}

const columns: { key: SortKey; label: string }[] = [
  { key: "name", label: "Campaign Name" },
  { key: "total_replies", label: "Total" },
  { key: "interested", label: "Interested" },
  { key: "not_interested", label: "Not Interested" },
  { key: "ooo", label: "OOO" },
  { key: "info_request", label: "Info Request" },
  { key: "unsubscribe", label: "Unsubscribe" },
  { key: "interest_rate", label: "Interest Rate" },
  { key: "unsubscribe_rate", label: "Unsub Rate" },
];

export default function CampaignTable({ campaigns }: CampaignTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("total_replies");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sorted = [...campaigns].sort((a, b) => {
    const aVal = getValue(a, sortKey);
    const bVal = getValue(b, sortKey);
    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortDir === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    return sortDir === "asc"
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number);
  });

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-[14px] font-semibold text-text-primary">Campaign Details</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-4 py-3 text-left text-text-muted font-medium text-[11px] uppercase tracking-wider cursor-pointer hover:text-text-primary transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key &&
                      (sortDir === "asc" ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ))}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((campaign) => (
              <tr
                key={campaign.id}
                className="border-b border-border/50 hover:bg-surface transition-colors"
              >
                <td className="px-4 py-3 text-text-primary font-medium">
                  {campaign.name}
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {campaign.total_replies}
                </td>
                <td className="px-4 py-3 text-emerald-600 font-medium">
                  {campaign.by_category.interested}
                </td>
                <td className="px-4 py-3 text-red-500">
                  {campaign.by_category.not_interested}
                </td>
                <td className="px-4 py-3 text-amber-500">
                  {campaign.by_category.ooo}
                </td>
                <td className="px-4 py-3 text-violet-600">
                  {campaign.by_category.info_request}
                </td>
                <td className="px-4 py-3 text-orange-500">
                  {campaign.by_category.unsubscribe}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-[12px] font-medium px-2 py-0.5 rounded-full ${
                      campaign.interest_rate >= 0.2
                        ? "bg-emerald-50 text-emerald-600"
                        : campaign.interest_rate >= 0.1
                        ? "bg-amber-50 text-amber-600"
                        : "bg-red-50 text-red-500"
                    }`}
                  >
                    {(campaign.interest_rate * 100).toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-[12px] font-medium px-2 py-0.5 rounded-full ${
                      campaign.unsubscribe_rate > 0.05
                        ? "bg-red-50 text-red-500"
                        : "bg-gray-50 text-text-secondary"
                    }`}
                  >
                    {(campaign.unsubscribe_rate * 100).toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-8 text-center text-text-muted"
                >
                  No campaigns found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
