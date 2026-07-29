export interface UserResponse {
  id: string;
  email: string;
  role: "ADMIN" | "CASHIER";
  tenant_id: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  role: "ADMIN" | "CASHIER";
}
