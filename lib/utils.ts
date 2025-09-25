import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get initials from a name
 * Returns first and last initial (e.g., "John Doe" -> "JD")
 * If only one name, returns first two characters (e.g., "John" -> "JO")
 */
export function getInitials(name: string | undefined | null): string {
  if (!name) return "??";

  const trimmedName = name.trim();
  if (!trimmedName) return "??";

  const parts = trimmedName.split(/\s+/);

  if (parts.length === 1) {
    // Single name: take first two characters
    return parts[0].substring(0, 2).toUpperCase();
  } else {
    // Multiple names: take first character of first and last name
    const firstInitial = parts[0].charAt(0).toUpperCase();
    const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
    return firstInitial + lastInitial;
  }
}

/**
 * Get initials from separate first and last names
 */
export function getInitialsFromNames(
  firstName: string | undefined | null,
  lastName: string | undefined | null
): string {
  const first = firstName?.trim()?.charAt(0)?.toUpperCase() || "";
  const last = lastName?.trim()?.charAt(0)?.toUpperCase() || "";

  if (first && last) {
    return first + last;
  } else if (first) {
    // If only first name, take first two characters
    return (firstName?.trim()?.substring(0, 2) || "").toUpperCase();
  } else if (last) {
    // If only last name, take first two characters
    return (lastName?.trim()?.substring(0, 2) || "").toUpperCase();
  }

  return "??";
}

/**
 * Format currency value
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date to relative time or absolute date
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      if (diffMinutes === 0) {
        return "just now";
      }
      return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
    }
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  } else if (diffDays === 1) {
    return "yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }
}