"use client";

import { useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/features/users/api";
import type { UserResponse, PaginatedResponse } from "@/features/users/types";
import UsersTable from "@/features/users/components/UsersTable";
import CreateUserModal from "@/features/users/components/CreateUserModal";
import DeleteUserDialog from "@/features/users/components/DeleteUserDialog";
import { useTranslation } from "react-i18next";

export default function TeamPage() {
  const { t } = useTranslation();
  const { user, accessToken } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const size = 10;

  const [modal, setModal] = useState<{ type: "none" } | { type: "create" } | { type: "delete"; user: UserResponse }>({
    type: "none",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["users", page],
    queryFn: () => usersApi.list({ page, size }),
    enabled: !!accessToken,
  });

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`?${params.toString()}`, { scroll: false });
  }

  function handleCreated() {
    setModal({ type: "none" });
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    router.push(`?${params.toString()}`, { scroll: false });
  }

  function handleDeleted() {
    setModal({ type: "none" });
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    router.push(`?${params.toString()}`, { scroll: false });
  }

  const users = data?.items ?? [];

  return (
    <div className="p-container-margin flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface">{t("team.title")}</h2>
          <p className="text-on-surface-variant mt-1 text-sm">
            {t("team.provisionedDate")}
          </p>
        </div>
        <button
          onClick={() => setModal({ type: "create" })}
          className="bg-primary-container text-on-primary-container hover:opacity-90 transition-all px-4 py-2 rounded-xl flex items-center gap-2 font-body-md"
        >
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          {t("team.provisionNewUser")}
        </button>
      </div>

      {/* Info Banner */}
      <div className="mb-6 bg-surface-container/50 border border-outline-variant/30 rounded-xl p-4 flex items-start gap-4">
        <span className="material-symbols-outlined text-primary mt-0.5">info</span>
        <div>
          <h4 className="font-headline-sm text-[14px] text-on-surface">{t("team.accessRole")}</h4>
          <p className="font-body-md text-on-surface-variant text-[13px]">
            {t("team.deleteWarning")}
          </p>
        </div>
      </div>

      {/* Users Table */}
      <UsersTable
        users={users}
        loading={isLoading}
        page={page}
        pages={data?.pages ?? 1}
        total={data?.total ?? 0}
        size={size}
        currentUserId={user?.id ?? ""}
        onPageChange={handlePageChange}
        onDelete={(u) => setModal({ type: "delete", user: u })}
      />

      {/* Modals */}
      {modal.type === "create" && <CreateUserModal onClose={() => setModal({ type: "none" })} onCreated={handleCreated} />}
      {modal.type === "delete" && (
        <DeleteUserDialog user={modal.user} onClose={() => setModal({ type: "none" })} onDeleted={handleDeleted} />
      )}
    </div>
  );
}
