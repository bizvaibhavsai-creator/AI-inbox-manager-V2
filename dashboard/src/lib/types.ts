export interface OverviewData {
  total: number;
  by_category: CategoryCounts;
  by_status: StatusCounts;
  avg_response_time_hours: number;
  daily_volumes: DailyVolume[];
  follow_up_stats: FollowUpStats;
}

export interface CategoryCounts {
  interested: number;
  not_interested: number;
  ooo: number;
  unsubscribe: number;
  info_request: number;
  wrong_person: number;
  dnc: number;
}

export interface StatusCounts {
  pending_approval: number;
  approved: number;
  rejected: number;
  sent: number;
  auto_handled: number;
}

export interface DailyVolume {
  date: string;
  count: number;
}

export interface FollowUpStats {
  total: number;
  pending: number;
  sent: number;
  skipped: number;
}

export interface CampaignAnalytics {
  id: number;
  name: string;
  total_replies: number;
  by_category: CategoryCounts;
  interest_rate: number;
  unsubscribe_rate: number;
}

export interface CampaignAnalyticsResponse {
  campaigns: CampaignAnalytics[];
}

export interface Reply {
  id: number;
  lead_email: string;
  lead_name: string;
  lead_company: string;
  subject: string;
  body: string;
  category: string;
  ai_draft: string;
  status: string;
  campaign_name: string;
  created_at: string;
  sent_at: string | null;
}

export interface FollowUp {
  id: number;
  reply_id: number;
  body: string;
  status: string;
  created_at: string;
  sent_at: string | null;
}

export interface ReplyDetail extends Reply {
  follow_ups: FollowUp[];
}

export interface RepliesResponse {
  replies: Reply[];
  total: number;
  page: number;
  per_page: number;
}

export interface Campaign {
  id: number;
  name: string;
  plusvibe_camp_id: string;
  status: string;
  created_at: string;
}

export interface CampaignsResponse {
  campaigns: Campaign[];
}

export type Period = "all" | "today" | "week" | "month";

export interface RepliesParams {
  category?: string;
  status?: string;
  campaign_id?: number;
  search?: string;
  page?: number;
  per_page?: number;
}
