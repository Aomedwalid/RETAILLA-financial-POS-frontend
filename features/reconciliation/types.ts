export interface ReconciliationCreateRequest {
  period_start: string;
  period_end: string;
  counted_cash: number;
  notes?: string;
}

export interface ReconciliationSummaryItem {
  id: string;
  location_id: string;
  location_name: string;
  reconciled_by: string;
  period_start: string;
  period_end: string;
  expected_cash: string;
  counted_cash: string;
  discrepancy: string;
  discrepancy_flag: "BALANCED" | "MINOR_DISCREPANCY" | "SIGNIFICANT_DISCREPANCY";
  notes: string | null;
  created_at: string;
}

export type MatchStatus = "UNMATCHED" | "AUTO_MATCHED" | "MANUALLY_MATCHED" | "NO_MATCH_FOUND";

export interface ExternalTransaction {
  id: string;
  tenant_id: string;
  source: string;
  amount: string;
  transaction_date: string;
  description: string | null;
  match_status: MatchStatus;
  matched_ledger_entry_id: string | null;
  matched_by: string | null;
  matched_at: string | null;
  created_by: string;
  created_at: string;
}

export interface ExternalTransactionCreate {
  source: string;
  amount: number;
  transaction_date: string;
  description?: string;
}

export interface ManualMatchRequest {
  ledger_entry_id: string;
}

export interface MatchResult {
  external_transaction_id: string;
  match_result: "AUTO_MATCHED" | "NO_MATCH_FOUND";
  matched_ledger_entry_id: string | null;
}

export interface UnmatchedReconciliationItem {
  id: string;
  tenant_id: string;
  source: string;
  amount: string;
  transaction_date: string;
  description: string | null;
  match_status: "UNMATCHED" | "NO_MATCH_FOUND";
  created_at: string;
}

export interface AnomalyThresholds {
  refund_rate_alert_multiplier: number;
  discount_usage_alert_multiplier: number;
  reconciliation_discrepancy_alert_threshold: number;
}

export interface AnomalyThresholdsUpdate {
  reconciliation_discrepancy_alert_threshold?: number;
  refund_rate_alert_multiplier?: number;
  discount_usage_alert_multiplier?: number;
}
