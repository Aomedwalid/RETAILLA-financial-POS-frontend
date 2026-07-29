import http, {
  setAccessToken,
  getAccessToken,
  setUnauthorizedHandler,
} from "./axios";

export { setAccessToken, getAccessToken, setUnauthorizedHandler };

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export class ApiError extends Error {
  status: number;
  errorCode?: string;
  details?: unknown;
  validationErrors?: ValidationErrorDetail[];

  constructor(status: number, message: string, errorCode?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errorCode = errorCode;
    this.details = details;
    if (Array.isArray(details)) {
      this.validationErrors = details as ValidationErrorDetail[];
    }
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  params?: Record<string, string | number | boolean | null | undefined>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, params } = options;

  const cleanParams = params
    ? Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== "")
      )
    : undefined;

  try {
    const res = await http({
      url: endpoint,
      method: method as string,
      data: body ?? undefined,
      params: cleanParams,
    });
    return (res.data as { data: T }).data as T;
  } catch (err: unknown) {
    if (err && typeof err === "object" && "isAxiosError" in err) {
      const axiosErr = err as { response?: { status: number; data?: { status?: number; message?: string; error_code?: string; details?: unknown } } };
      if (axiosErr.response) {
        const json = axiosErr.response.data;
        throw new ApiError(
          json?.status || axiosErr.response.status,
          json?.message || "Request failed",
          json?.error_code,
          json?.details
        );
      }
    }
    throw new ApiError(0, "Network error");
  }
}

export const api = {
  get: <T>(endpoint: string, params?: Record<string, string | number | boolean | null | undefined>) =>
    request<T>(endpoint, { params }),
  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: "POST", body }),
  put: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: "PUT", body }),
  patch: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: "PATCH", body }),
  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: "DELETE" }),
};

// ─── API Types ───

export interface BusinessCashPosition {
  total_sales: string;
  total_refunds: string;
  total_expenses: string;
  total_vendor_payments: string;
  business_cash_net: string;
}

export interface NetPositionResponse {
  total_sales: string;
  total_refunds: string;
  total_expenses: string;
  total_vendor_payments: string;
  net_position: string;
}

export interface WorkingCapitalPosition {
  tenant_id: string;
  receivable_from_customers: string;
  payable_to_vendors: string;
  net_working_capital: string;
}

export interface RunwayEstimate {
  operating_cash: string;
  avg_daily_burn: string;
  runway_days: string | null;
}

export interface BreakEvenEstimate {
  avg_daily_fixed_costs: string;
  avg_margin_pct: string;
  break_even_daily_revenue: string | null;
}

export interface PaymentMethodBreakdownItem {
  payment_method: string;
  transaction_count: number;
  total_amount: string;
}

export interface LocationPerformance {
  location_id: string;
  location_name: string;
  total_sales: string;
  total_refunds: string;
  total_expenses: string;
  net_cash_position: string;
}

export interface ProfitAndLoss {
  gross_revenue: string;
  total_refunds: string;
  net_revenue: string;
  total_cogs: string;
  gross_profit: string;
  total_operating_expenses: string;
  net_profit: string;
}

export interface OwnerEquitySummary {
  total_contributions: string;
  total_draws: string;
  net_equity_change: string;
}

export interface StoreOverview {
  total_products: number;
  total_orders: number;
  total_refunds: number;
  total_customers: number;
  total_discounts: number;
  total_promo_codes: number;
  total_team_members: number;
}

export interface DailyCashSummaryItem {
  tenant_id: string;
  location_id: string | null;
  summary_date: string;
  sales: number | null;
  refunds: number | null;
  expenses: number | null;
  vendor_payments: number | null;
  owner_draws: number | null;
  owner_contributions: number | null;
  adjustments: number | null;
  net_change: number | null;
}

export interface ProfitabilityRow {
  group_id: string;
  group_name: string;
  units_sold: number;
  revenue: string;
  cogs: string;
  gross_profit: string;
  margin_pct: string | number;
}

export interface BudgetStatusItem {
  category: string;
  monthly_limit: string;
  actual_spent: string;
  remaining: string;
  exceeded: boolean;
}

export interface Budget {
  id: string;
  category: string;
  monthly_limit: string;
  notes?: string;
  active: boolean;
  created_at: string;
}

export interface BudgetCreateRequest {
  category: string;
  monthly_limit: number;
  notes?: string;
}

export interface AnomalyThresholds {
  refund_rate_alert_multiplier: number;
  discount_usage_alert_multiplier: number;
  reconciliation_discrepancy_alert_threshold: number;
}

export interface AnomalyThresholdsUpdate {
  refund_rate_alert_multiplier?: number;
  discount_usage_alert_multiplier?: number;
  reconciliation_discrepancy_alert_threshold?: number;
}

export interface CustomerCreditRisk {
  customer_id: string;
  customer_name: string;
  current_debt: string;
  total_charges: string;
  total_payments: string;
  avg_payment_delay_days: number | null;
  late_payment_rate: number | null;
  risk_tier: string;
}

export interface DebtDriftCheckItem {
  customer_id: string;
  tenant_id: string;
  customer_name: string;
  recorded_debt_column: string;
  computed_debt_from_events: string;
  drift: string;
}

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
  discrepancy_flag: string;
  notes: string | null;
  created_at: string;
}

export interface CashierRefundAnomaly {
  user_id: string;
  user_email?: string;
  refund_count: number;
  order_count: number;
  refund_rate: string;
  tenant_avg_refund_rate: string;
  is_refund_anomaly: boolean;
}

export interface CashierDiscountAnomaly {
  user_id: string;
  user_email?: string;
  order_count: number;
  discount_usage_count: number;
  discount_rate: string;
  tenant_avg_discount_rate: string;
  is_discount_anomaly: boolean;
}

// ─── Auth Types ───

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: AuthUser;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  tenant_id: string;
  full_name?: string;
  permissions?: string[];
  tenant_name?: string;
  avatar?: string;
}

export interface RegisterWithTokenRequest {
  token: string;
  email: string;
  password: string;
}

export interface RegisterWithTokenResponse {
  id: string;
  email: string;
  role: string;
  tenant_id: string | null;
  created_at: string;
}

export interface RefreshResponse {
  access_token: string;
  user?: AuthUser;
}

// ─── Reports API ───

export const reportsApi = {
  businessCashPosition: (params?: Record<string, string | number | boolean | null | undefined>) =>
    api.get<BusinessCashPosition>("/api/reports/business-cash-position", params),

  netPosition: (params?: Record<string, string | number | boolean | null | undefined>) =>
    api.get<NetPositionResponse>("/api/reports/net-position", params),

  profitAndLoss: (params?: Record<string, string | number | boolean | null | undefined>) =>
    api.get<ProfitAndLoss>("/api/reports/profit-and-loss", params),

  ownerEquity: (params?: Record<string, string | number | boolean | null | undefined>) =>
    api.get<OwnerEquitySummary>("/api/reports/owner-equity", params),

  workingCapital: () =>
    api.get<WorkingCapitalPosition>("/api/reports/working-capital"),

  overview: (params?: Record<string, string | number | boolean | null | undefined>) =>
    api.get<StoreOverview>("/api/reports/overview", params),

  dailySummary: (params?: Record<string, string | number | boolean | null | undefined>) =>
    api.get<DailyCashSummaryItem[]>("/api/reports/daily-summary", params),

  paymentMethods: (params?: Record<string, string | number | boolean | null | undefined>) =>
    api.get<PaymentMethodBreakdownItem[]>("/api/reports/payment-methods", params),

  profitability: (params?: Record<string, string | number | boolean | null | undefined>) =>
    api.get<ProfitabilityRow[]>("/api/reports/profitability", params),

  runway: (lookbackDays?: number) =>
    api.get<RunwayEstimate>("/api/reports/runway", { lookback_days: lookbackDays ?? 30 }),

  breakEven: (lookbackDays?: number) =>
    api.get<BreakEvenEstimate>("/api/reports/break-even", { lookback_days: lookbackDays ?? 30 }),

  locations: () =>
    api.get<LocationPerformance[]>("/api/reports/locations"),

  listBudgets: () =>
    api.get<Budget[]>("/api/reports/budgets"),

  budgetStatus: (monthStart: string) =>
    api.get<BudgetStatusItem[]>("/api/reports/budgets/status", { month_start: monthStart }),

  createBudget: (body: BudgetCreateRequest) =>
    api.post<Budget>("/api/reports/budgets", body),

  deleteBudget: (budgetId: string) =>
    api.delete<void>(`/api/reports/budgets/${budgetId}`),

  refundAnomalies: (params?: Record<string, string | number | boolean | null | undefined>) =>
    api.get<CashierRefundAnomaly[]>("/api/reports/anomalies/refunds", params),

  discountAnomalies: (params?: Record<string, string | number | boolean | null | undefined>) =>
    api.get<CashierDiscountAnomaly[]>("/api/reports/anomalies/discounts", params),

  getAnomalyThresholds: () =>
    api.get<AnomalyThresholds>("/api/reports/settings/anomaly-thresholds"),

  updateAnomalyThresholds: (body: AnomalyThresholdsUpdate) =>
    api.patch<AnomalyThresholds>("/api/reports/settings/anomaly-thresholds", body),

  customerCreditRisk: (customerId?: string) => {
    const params = customerId ? { customer_id: customerId } : undefined;
    return api.get<CustomerCreditRisk[]>("/api/reports/customer-credit-risk", params);
  },

  customerDebtDriftCheck: () =>
    api.get<DebtDriftCheckItem[]>("/api/reports/customer-debt-drift-check"),

  createReconciliation: (locationId: string, body: ReconciliationCreateRequest) =>
    api.post<ReconciliationSummaryItem>(`/api/reports/locations/${locationId}/reconciliations`, body),

  getReconciliations: (locationId: string) =>
    api.get<ReconciliationSummaryItem[]>(`/api/reports/locations/${locationId}/reconciliations`),
};

// ─── External Transaction Matching Types ───

export interface ExternalTransaction {
  id: string;
  tenant_id: string;
  source: string;
  amount: string;
  transaction_date: string;
  description: string | null;
  match_status: "UNMATCHED" | "AUTO_MATCHED" | "MANUALLY_MATCHED" | "NO_MATCH_FOUND";
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

// ─── Reconciliation API ───

export const reconciliationApi = {
  createExternalTransaction: (body: ExternalTransactionCreate) =>
    api.post<ExternalTransaction>("/api/reconciliation/external-transactions", body),

  listExternalTransactions: (status?: string) =>
    api.get<ExternalTransaction[]>("/api/reconciliation/external-transactions", status ? { status } : undefined),

  deleteExternalTransaction: (transactionId: string) =>
    api.delete<void>(`/api/reconciliation/external-transactions/${transactionId}`),

  runMatching: (dateToleranceDays?: number) =>
    api.post<MatchResult[]>(`/api/reconciliation/run-matching?date_tolerance_days=${dateToleranceDays ?? 1}`),

  manualMatch: (transactionId: string, body: ManualMatchRequest) =>
    api.post<{ status: string; ledger_entry_id: string }>(`/api/reconciliation/external-transactions/${transactionId}/manual-match`, body),

  listUnmatched: () =>
    api.get<UnmatchedReconciliationItem[]>("/api/reconciliation/unmatched"),
};

// ─── Auth API ───

export const authApi = {
  login: (body: LoginRequest) =>
    api.post<LoginResponse>("/api/auth/login", body),

  registerWithToken: (body: RegisterWithTokenRequest) =>
    api.post<RegisterWithTokenResponse>("/api/auth/register-with-token", body),

  refresh: () =>
    api.post<RefreshResponse>("/api/auth/refresh"),

  logout: () =>
    api.post<void>("/api/auth/logout"),
};
