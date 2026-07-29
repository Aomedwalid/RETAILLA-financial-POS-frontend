import { api, ApiError } from "@/lib/api";
import type { UserResponse, PaginatedResponse, CreateUserRequest } from "./types";

function handleError(err: unknown): never {
  if (err instanceof ApiError) throw err;
  throw new ApiError(500, "Network error");
}

export const usersApi = {
  list: (params?: { page?: number; size?: number }) =>
    api.get<PaginatedResponse<UserResponse>>("/api/users", params as Record<string, string | number | boolean | null | undefined>),

  create: (body: CreateUserRequest) =>
    api.post<UserResponse>("/api/users", body),

  delete: (id: string) =>
    api.delete<{ status: number; message: string; data: null }>(`/api/users/${id}`),
};
