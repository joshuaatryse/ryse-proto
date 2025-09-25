"use client";

import { Button } from "@heroui/button";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-08">{title}</h1>
        {description && (
          <p className="text-sm text-neutral-06 mt-1">{description}</p>
        )}
      </div>
      {actions && (
        <div className="mt-4 sm:mt-0 flex gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}