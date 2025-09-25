"use client";

import { useState } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";

interface BasicInfoFormProps {
  initialData?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  onNext: (data: { firstName: string; lastName: string; phone: string }) => void;
  onBack: () => void;
}

export default function BasicInfoForm({ initialData, onNext, onBack }: BasicInfoFormProps) {
  const [firstName, setFirstName] = useState(initialData?.firstName || "");
  const [lastName, setLastName] = useState(initialData?.lastName || "");
  const [phone, setPhone] = useState(initialData?.phone || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ firstName, lastName, phone });
  };

  const formatPhoneNumber = (value: string) => {
    const phoneNumber = value.replace(/[^\d]/g, "");
    const phoneNumberLength = phoneNumber.length;

    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 7) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-08 mb-2">
          Personal Information
        </h1>
        <p className="text-sm text-neutral-06">
          Tell us a bit about yourself
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          isRequired
          label="First Name"
          labelPlacement="inside"
          placeholder="Enter your first name"
          value={firstName}
          variant="bordered"
          classNames={{
            inputWrapper: "border-1 border-neutral-03 hover:border-primary-06 focus-within:border-primary-06",
          }}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <Input
          isRequired
          label="Last Name"
          labelPlacement="inside"
          placeholder="Enter your last name"
          value={lastName}
          variant="bordered"
          classNames={{
            inputWrapper: "border-1 border-neutral-03 hover:border-primary-06 focus-within:border-primary-06",
          }}
          onChange={(e) => setLastName(e.target.value)}
        />
      </div>

      <Input
        isRequired
        label="Phone Number"
        labelPlacement="inside"
        placeholder="(555) 123-4567"
        type="tel"
        value={phone}
        variant="bordered"
        classNames={{
          inputWrapper: "border-1 border-neutral-03 hover:border-primary-06 focus-within:border-primary-06",
        }}
        onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
      />

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
        >
          Continue
        </Button>
      </div>
    </form>
  );
}