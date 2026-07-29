export interface StoreCreditBalance {
  customer_id: string;
  customer_name: string;
  balance: number;
}

export interface StoreCreditBalanceItem {
  customer_id: string;
  customer_name: string;
  balance: number | string;
}

export interface StoreCreditBalancesPaginatedResponse {
  items: StoreCreditBalanceItem[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface StoreCreditLedgerEntry {
  id: string;
  entry_type: string;
  amount: number;
  reference_table: string | null;
  reference_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface StoreCreditSummary {
  total_issued: string;
  total_redeemed: string;
  net_credit: string;
  total_transactions: number;
  issued_count: number;
  redeemed_count: number;
  expired_count: number;
  adjustment_count: number;
}

export interface StoreCreditOverview {
  summary: StoreCreditSummary;
  ledger: StoreCreditLedgerEntry[];
}

export interface StoreCreditIssueRequest {
  amount: number;
  reference_table?: string;
  reference_id?: string;
  notes?: string;
}

export interface StoreCreditRedeemRequest {
  amount: number;
  reference_table?: string;
  reference_id?: string;
  notes?: string;
}

// ───── Pool Types ─────

export interface PoolBalance {
  balance: string;
}

export interface PoolLedgerEntry {
  id: string;
  entry_type: "DEPOSIT" | "WITHDRAWAL" | "CREDIT_ISSUED" | "CREDIT_RETURNED";
  amount: string;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface PoolSummary {
  current_balance: string;
  total_deposits: string;
  total_withdrawals: string;
  total_issued_to_customers: string;
  total_returned_from_customers: string;
  net_flow: string;
  deposit_count: number;
  withdrawal_count: number;
  issued_count: number;
  returned_count: number;
}

export interface PoolOverview {
  pool: PoolBalance;
  summary: PoolSummary;
  ledger: PoolLedgerEntry[];
}

export interface PoolDepositRequest {
  amount: number;
  notes?: string;
}

export interface PoolWithdrawRequest {
  amount: number;
  notes?: string;
}

export interface PoolIssueToCustomerRequest {
  customer_id: string;
  amount: number;
  notes?: string;
}

export interface PoolReturnFromCustomerRequest {
  customer_id: string;
  amount: number;
  notes?: string;
}
