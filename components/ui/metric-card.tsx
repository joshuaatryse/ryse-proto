"use client";

import { Card, CardBody } from "@heroui/card";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import clsx from "clsx";

interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  format?: "number" | "currency" | "percentage";
}

export default function MetricCard({ label, value, trend, icon, format = "number" }: MetricCardProps) {
  const formattedValue = () => {
    if (typeof value === "number") {
      switch (format) {
        case "currency":
          return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(value);
        case "percentage":
          return `${value}%`;
        default:
          return new Intl.NumberFormat("en-US").format(value);
      }
    }
    return value;
  };

  return (
    <Card className="border border-neutral-02 hover:shadow-sm transition-shadow">
      <CardBody className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-neutral-07 font-normal mb-2">{label}</p>
            <p className="text-3xl font-semibold text-neutral-08">{formattedValue()}</p>
            {trend && (
              <div className="flex items-center mt-3 gap-1">
                {trend.isPositive ? (
                  <ArrowUpIcon className="w-4 h-4 text-secondary-05" />
                ) : (
                  <ArrowDownIcon className="w-4 h-4 text-danger" />
                )}
                <span
                  className={clsx(
                    "text-sm font-medium",
                    trend.isPositive ? "text-secondary-05" : "text-danger"
                  )}
                >
                  {Math.abs(trend.value)}%
                </span>
                <span className="text-sm text-neutral-06 ml-1">vs last month</span>
              </div>
            )}
          </div>
          {icon && (
            <div className="p-2 bg-primary-01 rounded-lg">
              {icon}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}