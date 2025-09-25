"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { CheckCircleIcon, SparklesIcon, WrenchIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

interface MarketingPreferenceFormProps {
  initialPreference?: "automated" | "diy";
  onNext: (data: { marketingPreference: "automated" | "diy" }) => void;
  onBack: () => void;
}

export default function MarketingPreferenceForm({ initialPreference, onNext, onBack }: MarketingPreferenceFormProps) {
  const [selected, setSelected] = useState<"automated" | "diy" | null>(initialPreference || "automated");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selected) {
      onNext({ marketingPreference: selected });
    }
  };

  const options = [
    {
      id: "automated" as const,
      icon: <SparklesIcon className="w-8 h-8" />,
      title: "Automated Marketing",
      description: "Let Ryse handle everything. We'll automatically send targeted campaigns to your property owners.",
      features: [
        "Professional email templates",
        "Optimized send times",
        "Automated follow-ups",
        "Performance tracking",
      ],
      recommended: true,
    },
    {
      id: "diy" as const,
      icon: <WrenchIcon className="w-8 h-8" />,
      title: "DIY Marketing",
      description: "Take full control. Create and send your own marketing campaigns with our tools.",
      features: [
        "Custom email builder",
        "Manual campaign control",
        "Brand customization",
        "Recipient selection",
      ],
      recommended: false,
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-neutral-08 mb-2">
          Marketing Preference
        </h1>
        <p className="text-sm text-neutral-06">
          Choose how you'd like to market rent advances to your property owners
        </p>
      </div>

      <div className="grid gap-4">
        {options.map((option) => (
          <Card
            key={option.id}
            className={clsx(
              "border cursor-pointer transition-all",
              selected === option.id
                ? "border-primary-05 bg-primary-01"
                : "border-neutral-02 hover:border-neutral-04"
            )}
            isPressable
            onPress={() => setSelected(option.id)}
          >
            <CardBody className="p-5">
              <div className="flex gap-4">
                <div
                  className={clsx(
                    "p-2 rounded-lg h-fit",
                    selected === option.id ? "bg-primary-02" : "bg-neutral-01"
                  )}
                >
                  <div className={selected === option.id ? "text-primary-06" : "text-neutral-06"}>
                    {option.icon}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-medium">{option.title}</h3>
                    {option.recommended && (
                      <span className="px-2 py-0.5 bg-secondary-01 text-secondary-07 text-xs font-medium rounded-full">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-06 mb-3">{option.description}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {option.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-1.5">
                        <CheckCircleIcon
                          className={clsx(
                            "w-4 h-4",
                            selected === option.id ? "text-primary-06" : "text-neutral-05"
                          )}
                        />
                        <span className="text-xs text-neutral-07">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

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
          isDisabled={!selected}
        >
          Continue
        </Button>
      </div>
    </form>
  );
}