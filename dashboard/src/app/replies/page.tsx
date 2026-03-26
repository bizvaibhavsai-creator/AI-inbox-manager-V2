"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight, User, Building2, Tag } from "lucide-react";
import { getReplies, getReplyById } from "@/lib/api";
import { Reply, ReplyDetail } from "@/lib/types";

const CATEGORY_COLORS: Record<string, string> = {
  interested: "bg-emerald-50 text-emerald-600",
  not_interested: "bg-red-50 text-red-500",
  ooo: "bg-amber-50 text-amber-600",
  unsubscribe: "bg-orange-50 text-orange-500",
  info_request: "bg-violet-50 text-violet-600",
  wrong_person: "bg-gray-100 text-text-secondary",
  dnc: "bg-rose-50 text-rose-600",
};

const STATUS_COLORS: Record<string, string> = {
  pending_approval: "bg-amber-50 text-amber-600",
  approved: "bg-[#E8EAFF] text-accent",
  rejected: "bg-red-50 text-red-500",
  sent: "bg-emerald-50 text-emerald-600",
  auto_handled: "bg-gray-100 text-text-secondary",
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

const STATUS_LABELS: Record<string, string> = {
  pending_approval: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  sent: "Sent",
  auto_handled: "Auto",
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function RepliesPage() {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ReplyDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const perPage = 50;

  const fetchReplies = useCallback(() => {
    setLoading(true);
    setError(null);
    getReplies({
      page,
      per_page: perPage,
      search: search || undefined,
      category: categoryFilter || undefined,
      status: statusFilter || undefined,
    })
      .then((res) => {
        setReplies(res.replies);
        setTotal(res.total);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, search, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchReplies();
  }, [fetchReplies]);

  useEffect(() => {
    if (selectedId === null) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    getReplyById(selectedId)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  const totalPages = Math.ceil(total / perPage);

  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  return (
    <div className="flex h-[calc(100vh-64px)] gap-0 overflow-hidden -m-8 rounded-xl">
      {/* Left Panel */}
      <div className="w-2/5 border-r border-border flex flex-col bg-card">
        {/* Search & Filters */}
        <div className="p-4 border-b border-border space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-text-primary text-[13px] placeholder-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-[12px] focus:outline-none focus:border-accent"
            >
              <option value="">All Categories</option>
              <option value="interested">Interested</option>
              <option value="not_interested">Not Interested</option>
              <option value="ooo">Out of Office</option>
              <option value="unsubscribe">Unsubscribe</option>
              <option value="info_request">Info Request</option>
              <option value="wrong_person">Wrong Person</option>
              <option value="dnc">DNC</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-[12px] focus:outline-none focus:border-accent"
            >
              <option value="">All Statuses</option>
              <option value="pending_approval">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="sent">Sent</option>
              <option value="auto_handled">Auto Handled</option>
            </select>
          </div>
        </div>

        {/* Reply List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-text-muted text-[13px]">Loading replies...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-red-500 text-[13px]">{error}</p>
            </div>
          ) : replies.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-text-muted text-[13px]">No replies found</p>
            </div>
          ) : (
            replies.map((reply) => (
              <div
                key={reply.id}
                onClick={() => setSelectedId(reply.id)}
                className={`px-4 py-3 border-b border-border/50 cursor-pointer transition-all ${
                  selectedId === reply.id
                    ? "bg-accent-light border-l-2 border-l-accent"
                    : "hover:bg-surface"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-text-primary truncate">
                      {reply.lead_name || reply.lead_email}
                    </p>
                    <p className="text-[11px] text-text-muted truncate">
                      {reply.lead_email}
                    </p>
                  </div>
                  <span className="text-[11px] text-text-muted whitespace-nowrap">
                    {timeAgo(reply.created_at)}
                  </span>
                </div>
                <p className="text-[11px] text-text-secondary mt-1 truncate">
                  {reply.subject}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[reply.category] || "bg-gray-100 text-text-secondary"}`}>
                    {CATEGORY_LABELS[reply.category] || reply.category}
                  </span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[reply.status] || "bg-gray-100 text-text-secondary"}`}>
                    {STATUS_LABELS[reply.status] || reply.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between">
            <span className="text-[11px] text-text-muted">{total} replies</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="p-1 rounded hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 text-text-secondary" />
              </button>
              <span className="text-[11px] text-text-secondary">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="p-1 rounded hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4 text-text-secondary" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel */}
      <div className="w-3/5 overflow-y-auto bg-surface p-6">
        {selectedId === null ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-text-muted text-[14px]">Select a reply to view details</p>
              <p className="text-text-muted text-[12px] mt-1">Click on any reply in the list</p>
            </div>
          </div>
        ) : detailLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-text-muted text-[13px]">Loading...</p>
          </div>
        ) : detail ? (
          <div className="space-y-5 max-w-3xl">
            {/* Lead Info */}
            <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-accent-light">
                      <User className="w-4 h-4 text-accent" />
                    </div>
                    <h2 className="text-[16px] font-semibold text-text-primary">
                      {detail.lead_name || "Unknown"}
                    </h2>
                  </div>
                  <p className="text-[13px] text-text-secondary ml-9">{detail.lead_email}</p>
                  {detail.lead_company && (
                    <div className="flex items-center gap-2 ml-9">
                      <Building2 className="w-3.5 h-3.5 text-text-muted" />
                      <p className="text-[12px] text-text-secondary">{detail.lead_company}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${CATEGORY_COLORS[detail.category] || "bg-gray-100 text-text-secondary"}`}>
                    {CATEGORY_LABELS[detail.category] || detail.category}
                  </span>
                  <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[detail.status] || "bg-gray-100 text-text-secondary"}`}>
                    {STATUS_LABELS[detail.status] || detail.status}
                  </span>
                </div>
              </div>

              {detail.campaign_name && (
                <div className="mt-4 flex items-center gap-2 ml-9">
                  <Tag className="w-3.5 h-3.5 text-accent" />
                  <span className="text-[12px] text-accent bg-accent-light px-2.5 py-0.5 rounded-full font-medium">
                    {detail.campaign_name}
                  </span>
                </div>
              )}
            </div>

            {/* Subject */}
            <div className="px-1">
              <h3 className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-1">Subject</h3>
              <p className="text-[14px] text-text-primary">{detail.subject}</p>
            </div>

            {/* Original Reply */}
            <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
              <h3 className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-3">Original Reply</h3>
              <div className="text-[13px] text-text-secondary whitespace-pre-wrap leading-relaxed">
                {detail.body}
              </div>
            </div>

            {/* AI Draft */}
            {detail.ai_draft && (
              <div className="bg-card rounded-xl p-6 border border-accent/20 shadow-sm">
                <h3 className="text-[11px] font-medium text-accent uppercase tracking-wider mb-3">AI Draft Response</h3>
                <div className="text-[13px] text-text-secondary whitespace-pre-wrap leading-relaxed">
                  {detail.ai_draft}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
              <div className="grid grid-cols-2 gap-4 text-[13px]">
                <div>
                  <p className="text-[11px] text-text-muted uppercase tracking-wider mb-1">Received</p>
                  <p className="text-text-primary">{new Date(detail.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[11px] text-text-muted uppercase tracking-wider mb-1">Sent</p>
                  <p className="text-text-primary">
                    {detail.sent_at ? new Date(detail.sent_at).toLocaleString() : "Not sent yet"}
                  </p>
                </div>
              </div>
            </div>

            {/* Follow-ups */}
            {detail.follow_ups && detail.follow_ups.length > 0 && (
              <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
                <h3 className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-4">
                  Follow-ups ({detail.follow_ups.length})
                </h3>
                <div className="space-y-4">
                  {detail.follow_ups.map((fu, idx) => (
                    <div key={fu.id} className="border-l-2 border-border pl-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] text-text-muted">#{idx + 1}</span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[fu.status] || "bg-gray-100 text-text-secondary"}`}>
                          {STATUS_LABELS[fu.status] || fu.status}
                        </span>
                      </div>
                      {fu.body && (
                        <p className="text-[12px] text-text-secondary whitespace-pre-wrap">{fu.body}</p>
                      )}
                      <p className="text-[11px] text-text-muted mt-1">
                        {new Date(fu.created_at).toLocaleDateString()}
                        {fu.sent_at && ` · Sent: ${new Date(fu.sent_at).toLocaleDateString()}`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-red-500 text-[13px]">Failed to load reply details</p>
          </div>
        )}
      </div>
    </div>
  );
}
