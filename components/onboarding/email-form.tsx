"use client";

import { useState, useEffect } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { EnvelopeIcon } from "@heroicons/react/24/outline";

interface EmailFormProps {
  initialEmail?: string;
  onNext: (data: { email: string }) => void;
}

export default function EmailForm({ initialEmail, onNext }: EmailFormProps) {
  const [email, setEmail] = useState(initialEmail || "");

  // Update email when initialEmail prop changes
  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);
  const [error, setError] = useState("");

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    onNext({ email });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary-01 rounded-full">
            <EnvelopeIcon className="w-8 h-8 text-primary-06" />
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-neutral-08 mb-2">
          Welcome to Ryse
        </h1>
        <p className="text-sm text-neutral-06">
          Let's start by entering your email address
        </p>
      </div>

      <div className="space-y-4">
        <Input
          isRequired
          label="Email Address"
          labelPlacement="inside"
          placeholder="you@company.com"
          type="email"
          value={email}
          variant="bordered"
          errorMessage={error}
          isInvalid={!!error}
          classNames={{
            inputWrapper: "border-1 border-neutral-03 hover:border-primary-06 focus-within:border-primary-06",
          }}
          startContent={
            <EnvelopeIcon className="w-5 h-5 text-neutral-05" />
          }
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
        />

        <p className="text-xs text-neutral-06">
          We'll use this email to create your account and send important updates
        </p>
      </div>

      <div className="pt-4">
        <Button
          className="w-full bg-primary text-white"
          color="primary"
          size="lg"
          type="submit"
        >
          Get Started
        </Button>
      </div>

      <div className="text-center">
        <p className="text-sm text-neutral-06">
          Already have an account?{" "}
          <a href="/login" className="text-primary-06 font-medium hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </form>
  );
}