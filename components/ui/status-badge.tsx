"use client";

import { Chip } from "@heroui/chip";
import clsx from "clsx";

type StatusType = "success" | "warning" | "danger" | "default" | "primary" | "secondary";

interface StatusBadgeProps {
  status: string;
  type?: StatusType;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const statusConfig: Record<string, { type: StatusType; label: string }> = {
  // Property statuses
  accepted: { type: "success", label: "Accepted" },
  under_review: { type: "warning", label: "Under Review" },
  rejected: { type: "danger", label: "Rejected" },

  // Legacy/Other statuses
  active: { type: "success", label: "Active" },
  inactive: { type: "default", label: "Inactive" },
  pending: { type: "warning", label: "Pending" },
  enabled: { type: "success", label: "Enabled" },
  disabled: { type: "danger", label: "Disabled" },
  requested: { type: "warning", label: "Requested" },
  approved: { type: "primary", label: "Approved" },
  disbursed: { type: "success", label: "Disbursed" },
  repaid: { type: "default", label: "Repaid" },
  declined: { type: "danger", label: "Declined" },
  synced: { type: "success", label: "Synced" },
  not_synced: { type: "warning", label: "Not Synced" },
  error: { type: "danger", label: "Error" },
};

export default function StatusBadge({ status, type, size = "sm", className }: StatusBadgeProps) {
  const config = statusConfig[status.toLowerCase()] || {
    type: type || "default",
    label: status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " "),
  };

  return (
    <Chip
      className={clsx(
        "font-medium",
        {
          "bg-success-50 text-success-700 border-success-200": config.type === "success",
          "bg-warning-50 text-warning-700 border-warning-200": config.type === "warning",
          "bg-danger-50 text-danger-700 border-danger-200": config.type === "danger",
          "bg-primary-01 text-primary-07 border-primary-03": config.type === "primary",
          "bg-secondary-01 text-secondary-07 border-secondary-03": config.type === "secondary",
          "bg-neutral-01 text-neutral-07 border-neutral-03": config.type === "default",
        },
        className
      )}
      size={size}
      variant="flat"
    >
      {config.label}
    </Chip>
  );
}