"use client";

import { useState } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import GooglePlacesAutocomplete from "./google-places-autocomplete";

interface CompanyDetailsFormProps {
  initialData?: {
    company?: string;
    companyAddress?: {
      street: string;
      unit?: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
      fullAddress: string;
    };
  };
  onNext: (data: { company: string; companyAddress: any }) => void;
  onBack: () => void;
}

const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
];

export default function CompanyDetailsForm({ initialData, onNext, onBack }: CompanyDetailsFormProps) {
  const [company, setCompany] = useState(initialData?.company || "");
  const [address, setAddress] = useState({
    street: initialData?.companyAddress?.street || "",
    unit: initialData?.companyAddress?.unit || "",
    city: initialData?.companyAddress?.city || "",
    state: initialData?.companyAddress?.state || "",
    zipCode: initialData?.companyAddress?.zipCode || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullAddress = `${address.street}${address.unit ? `, ${address.unit}` : ''}, ${address.city}, ${address.state} ${address.zipCode}`;
    const addressData = {
      ...address,
      fullAddress,
      country: "United States",
    };
    if (company && address.street && address.city && address.state && address.zipCode) {
      onNext({ company, companyAddress: addressData });
    }
  };

  const handleAddressSelect = (selectedAddress: any) => {
    // Pre-fill all address fields from autocomplete
    if (selectedAddress) {
      setAddress({
        street: selectedAddress.street || "",
        unit: "", // User can manually add unit after autocomplete
        city: selectedAddress.city || "",
        state: selectedAddress.state || "",
        zipCode: selectedAddress.zipCode || "",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-neutral-08 mb-2">
          Company Details
        </h1>
        <p className="text-sm text-neutral-06">
          Tell us about your property management company
        </p>
      </div>

      <Input
        isRequired
        label="Company Name"
        labelPlacement="inside"
        placeholder="Enter your company name"
        value={company}
        variant="bordered"
        classNames={{
          inputWrapper: "border-1 border-neutral-03 hover:border-primary-06 focus-within:border-primary-06",
        }}
        onChange={(e) => setCompany(e.target.value)}
      />

      <div className="space-y-4">
        <label className="text-sm font-medium text-neutral-08">Company Address</label>

        <GooglePlacesAutocomplete
          onAddressSelect={handleAddressSelect}
          value={address.street}
        />

        <Input
          label="Unit/Suite/Apt (Optional)"
          labelPlacement="inside"
          placeholder="Suite 100"
          value={address.unit}
          variant="bordered"
          classNames={{
            inputWrapper: "border-1 border-neutral-03 hover:border-primary-06 focus-within:border-primary-06",
          }}
          onChange={(e) => setAddress({ ...address, unit: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            isRequired
            label="City"
            labelPlacement="inside"
            placeholder="San Francisco"
            value={address.city}
            variant="bordered"
            classNames={{
              inputWrapper: "border-1 border-neutral-03 hover:border-primary-06 focus-within:border-primary-06",
            }}
            onChange={(e) => setAddress({ ...address, city: e.target.value })}
          />

          <Select
            isRequired
            label="State"
            placeholder="Select state"
            selectedKeys={address.state ? [address.state] : []}
            variant="bordered"
            classNames={{
              trigger: "border-1 border-neutral-03 hover:border-primary-06 focus-within:border-primary-06",
            }}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as string;
              setAddress({ ...address, state: selected });
            }}
          >
            {US_STATES.map((state) => (
              <SelectItem key={state.value}>
                {state.label}
              </SelectItem>
            ))}
          </Select>
        </div>

        <Input
          isRequired
          label="ZIP Code"
          labelPlacement="inside"
          placeholder="94103"
          value={address.zipCode}
          variant="bordered"
          maxLength={10}
          classNames={{
            inputWrapper: "border-1 border-neutral-03 hover:border-primary-06 focus-within:border-primary-06",
          }}
          onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
        />
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
          isDisabled={!company || !address.street || !address.city || !address.state || !address.zipCode}
        >
          Continue
        </Button>
      </div>
    </form>
  );
}