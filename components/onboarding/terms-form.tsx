"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Checkbox } from "@heroui/checkbox";
import { Card, CardBody } from "@heroui/card";
import { Link } from "@heroui/link";

interface TermsFormProps {
  initialAccepted?: boolean;
  onNext: (data: { termsAccepted: boolean }) => void;
  onBack: () => void;
}

export default function TermsForm({ initialAccepted, onNext, onBack }: TermsFormProps) {
  const [accepted, setAccepted] = useState(initialAccepted || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accepted) {
      onNext({ termsAccepted: true });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-08 mb-2">
          Terms & Conditions
        </h1>
        <p className="text-sm text-neutral-06">
          Please review and accept our terms to continue
        </p>
      </div>

      <Card className="border border-neutral-02">
        <CardBody className="p-6 space-y-4">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-neutral-08">Key Terms:</h3>
            <ul className="space-y-2 text-sm text-neutral-07">
              <li className="flex items-start">
                <span className="text-primary-06 mr-2">•</span>
                <span>2% commission on all rent advances disbursed through the platform</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-06 mr-2">•</span>
                <span>Advances are subject to approval based on property and owner verification</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-06 mr-2">•</span>
                <span>Property managers maintain full control over advance requests</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-06 mr-2">•</span>
                <span>All data is encrypted and securely stored in compliance with industry standards</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-06 mr-2">•</span>
                <span>You can cancel your account at any time with no penalties</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-neutral-02">
            <p className="text-xs text-neutral-08">
              By accepting, you agree to the full{" "}
              <Link href="#" size="sm" className="text-primary-06">
                Terms of Service
              </Link>
              {" "}and{" "}
              <Link href="#" size="sm" className="text-primary-06">
                Privacy Policy
              </Link>
            </p>
          </div>
        </CardBody>
      </Card>

      <Checkbox
        isSelected={accepted}
        onValueChange={setAccepted}
        classNames={{
          label: "text-sm",
        }}
      >
        I have read and agree to the Terms & Conditions and Privacy Policy
      </Checkbox>

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
          isDisabled={!accepted}
        >
          Complete Setup
        </Button>
      </div>
    </form>
  );
}