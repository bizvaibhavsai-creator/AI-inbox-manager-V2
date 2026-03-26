import {
  OverviewData,
  CampaignAnalyticsResponse,
  RepliesResponse,
  ReplyDetail,
  CampaignsResponse,
  Period,
  RepliesParams,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function getOverview(period: Period = "all"): Promise<OverviewData> {
  return fetchJSON<OverviewData>(`${BASE_URL}/api/analytics/overview?period=${period}`);
}

export async function getCampaignAnalytics(): Promise<CampaignAnalyticsResponse> {
  return fetchJSON<CampaignAnalyticsResponse>(`${BASE_URL}/api/analytics/campaigns`);
}

export async function getReplies(params: RepliesParams = {}): Promise<RepliesResponse> {
  const searchParams = new URLSearchParams();
  if (params.category) searchParams.set("category", params.category);
  if (params.status) searchParams.set("status", params.status);
  if (params.campaign_id) searchParams.set("campaign_id", String(params.campaign_id));
  if (params.search) searchParams.set("search", params.search);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.per_page) searchParams.set("per_page", String(params.per_page));

  const qs = searchParams.toString();
  return fetchJSON<RepliesResponse>(`${BASE_URL}/api/replies${qs ? `?${qs}` : ""}`);
}

export async function getReplyById(id: number): Promise<ReplyDetail> {
  return fetchJSON<ReplyDetail>(`${BASE_URL}/api/replies/${id}`);
}

export async function getCampaigns(): Promise<CampaignsResponse> {
  return fetchJSON<CampaignsResponse>(`${BASE_URL}/api/campaigns`);
}
