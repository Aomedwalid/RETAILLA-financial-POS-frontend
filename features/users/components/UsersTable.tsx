"use client";

import { useTranslation } from "react-i18next";
import type { UserResponse } from "../types";

interface UsersTableProps {
  users: UserResponse[];
  loading: boolean;
  page: number;
  pages: number;
  total: number;
  size: number;
  currentUserId: string;
  onPageChange: (page: number) => void;
  onDelete: (user: UserResponse) => void;
}

function formatDate(raw: string) {
  return new Date(raw).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function UsersTable({
  users,
  loading,
  page,
  pages,
  total,
  size,
  currentUserId,
  onPageChange,
  onDelete,
}: UsersTableProps) {
  const { t } = useTranslation();
  return (
    <div className="bg-surface-container-low rounded-xl border border-outline-variant overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-surface-container-high/50 border-b border-outline-variant">
            <th className="px-card-padding py-4 font-label-caps text-label-caps text-outline">{t("team.email")}</th>
            <th className="px-card-padding py-4 font-label-caps text-label-caps text-outline">{t("team.role")}</th>
            <th className="px-card-padding py-4 font-label-caps text-label-caps text-outline">{t("team.provisionedDate")}</th>
            <th className="px-card-padding py-4 font-label-caps text-label-caps text-outline text-right">{t("team.actions")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                {Array.from({ length: 4 }).map((_, j) => (
                  <td key={j} className="px-card-padding py-4">
                    <div className="h-4 w-3/4 rounded bg-surface-container-highest/60" />
                  </td>
                ))}
              </tr>
            ))
          ) : users.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-card-padding py-16 text-center">
                <span className="material-symbols-outlined text-[40px] text-outline mb-2">group</span>
                <p className="text-on-surface-variant">{t("team.noMembers")}</p>
              </td>
            </tr>
          ) : (
            users.map((u) => {
              const initials = u.email
                .split("@")[0]
                .split(/[._]/)
                .map((w) => w[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
              const isSelf = u.id === currentUserId;
              const isAdmin = u.role === "ADMIN";

              return (
                <tr key={u.id} className="hover:bg-surface-variant/10 transition-colors">
                  <td className="px-card-padding py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded flex items-center justify-center font-bold text-[12px] ${
                          isAdmin
                            ? "bg-primary-container/20 text-primary"
                            : "bg-surface-container-highest text-on-surface-variant"
                        }`}
                      >
                        {initials}
                      </div>
                      <span className="font-body-md text-on-surface">
                        {u.email}
                        {isSelf && (
                          <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-on-surface-variant ml-2">
                            {t("team.you")}
                          </span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-card-padding py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        isAdmin
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-secondary/10 text-secondary border-secondary/20"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-card-padding py-3 font-data-table text-on-surface-variant tabular-nums text-sm">
                    {formatDate(u.created_at)}
                  </td>
                  <td className="px-card-padding py-3 text-right">
                    {isSelf ? (
                      <button
                        disabled
                        className="text-on-surface-variant opacity-30 cursor-not-allowed group relative"
                        title={t("user.cannotDeleteSelfTooltip")}
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onDelete(u)}
                        className="text-on-surface-variant hover:text-error transition-colors"
                        title={t("user.deleteUserTooltip")}
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {pages > 1 && (
        <div className="px-card-padding py-4 bg-surface-container-high/30 flex justify-between items-center">
          <p className="text-body-md text-on-surface-variant">
            {t("common.showing")}{" "}
            <span className="text-on-surface font-semibold">
              {Math.min((page - 1) * size + 1, total)}-{Math.min(page * size, total)}
            </span>{" "}
            {t("common.of")} <span className="text-on-surface font-semibold">{total}</span> {t("common.items")}
          </p>
          <div className="flex items-center gap-4">
            <span className="text-body-md text-on-surface-variant">
              {t("common.page")} {page} {t("common.of")} {pages}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="w-8 h-8 flex items-center justify-center rounded bg-surface-variant/20 text-outline disabled:opacity-30 hover:bg-surface-variant/40 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                const start = Math.max(1, page - 2);
                const p = start + i;
                if (p > pages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                      p === page
                        ? "bg-primary-container text-on-primary-container"
                        : "bg-surface-variant/20 hover:bg-surface-variant/40"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= pages}
                className="w-8 h-8 flex items-center justify-center rounded bg-surface-variant/20 text-outline disabled:opacity-30 hover:bg-surface-variant/40 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
