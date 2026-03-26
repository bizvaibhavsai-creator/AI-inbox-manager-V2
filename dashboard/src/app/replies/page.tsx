"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Send,
  AlertTriangle,
  X,
  User,
  Building2,
  Clock,
  Filter,
} from "lucide-react";
import { getReplies, getReplyById } from "@/lib/api";
import { Reply, ReplyDetail } from "@/lib/types";

const CATEGORY_COLORS: Record<string, string> = {
  interested: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  not_interested: "bg-red-50 text-red-600 border border-red-200",
  ooo: "bg-amber-50 text-amber-700 border border-amber-200",
  unsubscribe: "bg-orange-50 text-orange-600 border border-orange-200",
  info_request: "bg-violet-50 text-violet-700 border border-violet-200",
  wrong_person: "bg-gray-50 text-gray-600 border border-gray-200",
  dnc: "bg-rose-50 text-rose-600 border border-rose-200",
};

const STATUS_COLORS: Record<string, string> = {
  pending_approval: "bg-amber-50 text-amber-700 border border-amber-200",
  approved: "bg-[#E8EAFF] text-[#0814fa] border border-[#c7caff]",
  rejected: "bg-red-50 text-red-600 border border-red-200",
  sent: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  auto_handled: "bg-gray-50 text-gray-600 border border-gray-200",
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

const NAV_ITEMS = [
  { key: "", label: "Inbox", icon: Inbox },
  { key: "sent", label: "Sent", icon: Send },
  { key: "auto_handled", label: "Auto Handled", icon: AlertTriangle },
];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [navFilter, setNavFilter] = useState("");

  const perPage = 50;

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchReplies = useCallback(() => {
    setLoading(true);
    setError(null);
    const statusParam = navFilter === "sent" ? "sent" : navFilter === "auto_handled" ? "auto_handled" : statusFilter || undefined;
    getReplies({
      page,
      per_page: perPage,
      search: search || undefined,
      category: categoryFilter || undefined,
      status: statusParam,
    })
      .then((res) => { setReplies(res.replies); setTotal(res.total); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, search, categoryFilter, statusFilter, navFilter]);

  useEffect(() => { fetchReplies(); }, [fetchReplies]);

  useEffect(() => {
    if (selectedId === null) { setDetail(null); return; }
    setDetailLoading(true);
    getReplyById(selectedId)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="flex gap-0 -m-8 min-h-screen">
      {/* Left Filter Sidebar */}
      <div className="w-52 bg-card border-r border-border p-5 flex flex-col gap-6 shrink-0">
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = navFilter === item.key;
            return (
              <button
                key={item.key}
                onClick={() => { setNavFilter(item.key); setStatusFilter(""); setPage(1); }}
                className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                  isActive ? "bg-accent-light text-accent" : "text-text-secondary hover:text-text-primary hover:bg-surface"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Filters</span>
          </div>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
              <input
                type="text"
                placeholder="Search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-[12px] placeholder-text-muted focus:outline-none focus:border-accent"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-[12px] focus:outline-none focus:border-accent"
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
            {navFilter === "" && (
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-[12px] focus:outline-none focus:border-accent"
              >
                <option value="">All Statuses</option>
                <option value="pending_approval">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="sent">Sent</option>
                <option value="auto_handled">Auto Handled</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 py-6 px-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-[20px] font-semibold text-text-primary">Master Inbox</h1>
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-text-muted">{total} replies</span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <span className="text-[12px] text-text-secondary">Page {page} of {totalPages}</span>
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="p-1 rounded hover:bg-surface disabled:opacity-30">
                  <ChevronLeft className="w-4 h-4 text-text-secondary" />
                </button>
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="p-1 rounded hover:bg-surface disabled:opacity-30">
                  <ChevronRight className="w-4 h-4 text-text-secondary" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
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
            <div>
              {replies.map((reply, idx) => (
                <div
                  key={reply.id}
                  onClick={() => setSelectedId(reply.id)}
                  className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-all hover:bg-surface ${
                    idx !== replies.length - 1 ? "border-b border-border/50" : ""
                  }`}
                >
                  <div className="w-48 shrink-0">
                    <p className="text-[13px] font-medium text-text-primary truncate">
                      {reply.lead_name || reply.lead_email}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 w-40 shrink-0">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[reply.category] || "bg-gray-50 text-gray-600"}`}>
                      {CATEGORY_LABELS[reply.category] || reply.category}
                    </span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[reply.status] || "bg-gray-50 text-gray-600"}`}>
                      {STATUS_LABELS[reply.status] || reply.status}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 truncate">
                    <span className="text-[13px] text-text-primary font-medium">{reply.subject}</span>
                    <span className="text-[13px] text-text-muted ml-2">
                      — {reply.body?.slice(0, 80)}{reply.body && reply.body.length > 80 ? "..." : ""}
                    </span>
                  </div>

                  <div className="w-20 text-right shrink-0">
                    <span className="text-[12px] text-text-muted">{formatDate(reply.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedId(null)} />
          <div className="relative bg-card rounded-2xl shadow-xl border border-border w-full max-w-2xl max-h-[85vh] overflow-y-auto mx-4">
            <button onClick={() => setSelectedId(null)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-surface text-text-muted hover:text-text-primary transition-colors">
              <X className="w-5 h-5" />
            </button>
            {detailLoading ? (
              <div className="flex items-center justify-center h-60">
                <p className="text-text-muted text-[13px]">Loading...</p>
              </div>
            ) : detail ? (
              <div className="p-6 space-y-5">
                <div className="pr-8">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 rounded-md bg-accent-light">
                      <User className="w-4 h-4 text-accent" />
                    </div>
                    <h2 className="text-[17px] font-semibold text-text-primary">{detail.lead_name || "Unknown"}</h2>
                  </div>
                  <p className="text-[13px] text-text-secondary ml-9">{detail.lead_email}</p>
                  {detail.lead_company && (
                    <div className="flex items-center gap-2 ml-9 mt-1">
                      <Building2 className="w-3.5 h-3.5 text-text-muted" />
                      <span className="text-[12px] text-text-secondary">{detail.lead_company}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-3 ml-9 flex-wrap">
                    <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${CATEGORY_COLORS[detail.category] || ""}`}>
                      {CATEGORY_LABELS[detail.category] || detail.category}
                    </span>
                    <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${STATUS_COLORS[detail.status] || ""}`}>
                      {STATUS_LABELS[detail.status] || detail.status}
                    </span>
                    {detail.campaign_name && (
                      <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-accent-light text-accent border border-[#c7caff]">
                        {detail.campaign_name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-surface rounded-xl px-4 py-3">
                  <p className="text-[11px] text-text-muted uppercase tracking-wider mb-1">Subject</p>
                  <p className="text-[14px] text-text-primary font-medium">{detail.subject}</p>
                </div>

                <div>
                  <p className="text-[11px] text-text-muted uppercase tracking-wider mb-2 px-1">Original Reply</p>
                  <div className="bg-surface rounded-xl px-4 py-4 text-[13px] text-text-secondary whitespace-pre-wrap leading-relaxed">{detail.body}</div>
                </div>

                {detail.ai_draft && (
                  <div>
                    <p className="text-[11px] text-accent uppercase tracking-wider mb-2 px-1 font-medium">AI Draft Response</p>
                    <div className="bg-accent-light/50 border border-accent/15 rounded-xl px-4 py-4 text-[13px] text-text-secondary whitespace-pre-wrap leading-relaxed">{detail.ai_draft}</div>
                  </div>
                )}

                <div className="flex gap-6 text-[12px] px-1">
                  <div>
                    <span className="text-text-muted">Received: </span>
                    <span className="text-text-primary">{new Date(detail.created_at).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-text-muted">Sent: </span>
                    <span className="text-text-primary">{detail.sent_at ? new Date(detail.sent_at).toLocaleString() : "Not sent yet"}</span>
                  </div>
                </div>

                {detail.follow_ups && detail.follow_ups.length > 0 && (
                  <div>
                    <p className="text-[11px] text-text-muted uppercase tracking-wider mb-2 px-1">Follow-ups ({detail.follow_ups.length})</p>
                    <div className="space-y-2">
                      {detail.follow_ups.map((fu, idx) => (
                        <div key={fu.id} className="bg-surface rounded-lg px-4 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] text-text-muted">#{idx + 1}</span>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[fu.status] || ""}`}>
                              {STATUS_LABELS[fu.status] || fu.status}
                            </span>
                            {fu.body && <span className="text-[12px] text-text-secondary truncate max-w-xs">{fu.body}</span>}
                          </div>
                          <span className="text-[11px] text-text-muted">{new Date(fu.created_at).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40">
                <p className="text-red-500 text-[13px]">Failed to load details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
