"use client";

import clsx from "clsx";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

export default function Container({ children, className, size = "xl" }: ContainerProps) {
  return (
    <div
      className={clsx(
        "mx-auto px-6",
        {
          "max-w-3xl": size === "sm",
          "max-w-5xl": size === "md",
          "max-w-6xl": size === "lg",
          "max-w-7xl": size === "xl",
          "w-full": size === "full",
        },
        className
      )}
    >
      {children}
    </div>
  );
}