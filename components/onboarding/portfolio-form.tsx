"use client";

import { useState } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { BuildingOfficeIcon, CurrencyDollarIcon, InformationCircleIcon } from "@heroicons/react/24/outline";

interface PortfolioFormProps {
  initialData?: {
    propertiesManaged?: number;
    averageRent?: number;
  };
  onNext: (data: { propertiesManaged: number; averageRent: number }) => void;
  onBack: () => void;
}

export default function PortfolioForm({ initialData, onNext, onBack }: PortfolioFormProps) {
  const [propertiesManaged, setPropertiesManaged] = useState(initialData?.propertiesManaged?.toString() || "");
  const [averageRent, setAverageRent] = useState(initialData?.averageRent ? `$${initialData.averageRent}` : "");

  // Calculation constants
  const MAX_MONTHS_ADVANCE = 11;
  const ADVANCE_RATE = 0.9; // 90%
  const COMMISSION_RATE = 0.02; // 2%

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({
      propertiesManaged: parseInt(propertiesManaged),
      averageRent: parseInt(averageRent.replace(/[^0-9]/g, "")),
    });
  };

  const formatCurrency = (value: string) => {
    const number = value.replace(/[^0-9]/g, "");
    if (number) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(parseInt(number));
    }
    return "";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-neutral-08 mb-2">
          Portfolio Size
        </h1>
        <p className="text-sm text-neutral-06">
          Help us understand the size of your property portfolio
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <Input
            isRequired
            label="Number of Properties Managed"
            labelPlacement="inside"
            placeholder="e.g., 50"
            type="number"
            value={propertiesManaged}
            variant="bordered"
            startContent={<BuildingOfficeIcon className="w-5 h-5 text-neutral-05" />}
            classNames={{
              inputWrapper: "border-1 border-neutral-03 hover:border-primary-06 focus-within:border-primary-06",
            }}
            onChange={(e) => setPropertiesManaged(e.target.value)}
          />
          <p className="text-xs text-neutral-06 mt-1 ml-1">
            Total number of rental properties you currently manage
          </p>
        </div>

        <div>
          <Input
            isRequired
            label="Average Monthly Rent"
            labelPlacement="inside"
            placeholder="e.g., $2,500"
            value={averageRent}
            variant="bordered"
            startContent={<CurrencyDollarIcon className="w-5 h-5 text-neutral-05" />}
            classNames={{
              inputWrapper: "border-1 border-neutral-03 hover:border-primary-06 focus-within:border-primary-06",
            }}
            onChange={(e) => setAverageRent(formatCurrency(e.target.value))}
          />
          <p className="text-xs text-neutral-06 mt-1 ml-1">
            Average monthly rent across your portfolio
          </p>
        </div>
      </div>

      {propertiesManaged && averageRent && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Total Advance Card */}
          <div className="p-6 bg-primary-01 rounded-lg border border-primary-03 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <p className="text-sm text-primary-08">Total Potential Advance</p>
              <Tooltip
                content={
                  <div className="p-3 space-y-2">
                    <p className="text-xs font-medium mb-2">Calculation Breakdown</p>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between gap-4">
                        <span>{propertiesManaged} properties</span>
                        <span className="font-medium">{propertiesManaged}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span>Monthly rent</span>
                        <span className="font-medium">{formatCurrency(averageRent.replace(/[^0-9]/g, ""))}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span>Max advance</span>
                        <span className="font-medium">× 11 months</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span>Advance rate</span>
                        <span className="font-medium">× 90%</span>
                      </div>
                    </div>
                  </div>
                }
                placement="top"
                className="max-w-xs"
              >
                <button type="button" className="text-primary-08 hover:text-primary-09">
                  <InformationCircleIcon className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>
            <p className="text-2xl md:text-3xl font-medium text-primary-08">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(
                parseInt(propertiesManaged) *
                parseInt(averageRent.replace(/[^0-9]/g, "")) *
                MAX_MONTHS_ADVANCE *
                ADVANCE_RATE
              )}
            </p>
            <p className="text-xs text-primary-07 mt-2">
              Maximum advance capacity
            </p>
          </div>

          {/* Monthly Commission Card */}
          <div className="p-6 bg-secondary-01 rounded-lg border border-secondary-08 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <p className="text-sm text-secondary-08">Potential Monthly Commission</p>
              <Tooltip
                content={
                  <div className="p-3 space-y-2">
                    <p className="text-xs font-medium mb-2">Commission Calculation</p>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between gap-4">
                        <span>{propertiesManaged} properties</span>
                        <span className="font-medium">{propertiesManaged}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span>Avg monthly rent</span>
                        <span className="font-medium">{formatCurrency(averageRent.replace(/[^0-9]/g, ""))}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span>Total monthly rent</span>
                        <span className="font-medium">
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }).format(
                            parseInt(propertiesManaged) * parseInt(averageRent.replace(/[^0-9]/g, ""))
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span>Commission rate</span>
                        <span className="font-medium">× 2%</span>
                      </div>
                    </div>
                    <div className="pt-2 mt-2 border-t border-neutral-03">
                      <p className="text-xs font-medium">Note:</p>
                      <p className="text-xs mt-1">Commission is calculated on total lease rent, not the advance amount.</p>
                    </div>
                  </div>
                }
                placement="top"
                className="max-w-xs"
              >
                <button type="button" className="text-secondary-08 hover:text-secondary-08">
                  <InformationCircleIcon className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-secondary-08">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(
                parseInt(propertiesManaged) *
                parseInt(averageRent.replace(/[^0-9]/g, "")) *
                COMMISSION_RATE
              )}
            </p>
            <p className="text-xs text-secondary-08 mt-2">
              Monthly earnings potential
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button
          className="flex-1 border-neutral-03"
          size="lg"
          variant="bordered"
          onPress={onBack}
        >
          Back
        </Button>
        <Button
          className="flex-1 bg-primary text-white"
          color="primary"
          size="lg"
          type="submit"
          isDisabled={!propertiesManaged || !averageRent}
        >
          Continue
        </Button>
      </div>
    </form>
  );
}