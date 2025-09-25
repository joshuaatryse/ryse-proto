"use client";

import { Button } from "@heroui/button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {icon && (
        <div className="p-3 bg-primary-01 rounded-full mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-neutral-08 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-neutral-06 max-w-sm mb-6">{description}</p>
      )}
      {action && (
        <Button
          className="bg-primary text-white"
          color="primary"
          size="md"
          onPress={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}