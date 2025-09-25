"use client";

import { useState } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

interface PasswordFormProps {
  email: string;
  initialPassword?: string;
  onNext: (data: { password: string }) => void;
  onBack?: () => void;
}

export default function PasswordForm({ email, initialPassword, onNext, onBack }: PasswordFormProps) {
  const [password, setPassword] = useState(initialPassword || "");
  const [confirmPassword, setConfirmPassword] = useState(initialPassword || "");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onNext({ password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-08 mb-2">
          Create your account
        </h1>
        <p className="text-sm text-neutral-06">
          Set up a secure password for your Ryse account
        </p>
      </div>

      <Input
        isDisabled
        label="Email"
        labelPlacement="inside"
        value={email}
        variant="bordered"
        classNames={{
          inputWrapper: "border-1 border-neutral-03",
        }}
      />

      <Input
        isRequired
        label="Password"
        labelPlacement="inside"
        placeholder="Enter your password"
        type={showPassword ? "text" : "password"}
        value={password}
        variant="bordered"
        errorMessage={errors.password}
        isInvalid={!!errors.password}
        classNames={{
          inputWrapper: "border-1 border-neutral-03 hover:border-primary-06 focus-within:border-primary-06",
        }}
        endContent={
          <button
            className="focus:outline-none"
            type="button"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeSlashIcon className="w-5 h-5 text-neutral-06" />
            ) : (
              <EyeIcon className="w-5 h-5 text-neutral-06" />
            )}
          </button>
        }
        onChange={(e) => {
          setPassword(e.target.value);
          setErrors({ ...errors, password: undefined });
        }}
      />

      <Input
        isRequired
        label="Confirm Password"
        labelPlacement="inside"
        placeholder="Confirm your password"
        type={showConfirmPassword ? "text" : "password"}
        value={confirmPassword}
        variant="bordered"
        errorMessage={errors.confirmPassword}
        isInvalid={!!errors.confirmPassword}
        classNames={{
          inputWrapper: "border-1 border-neutral-03 hover:border-primary-06 focus-within:border-primary-06",
        }}
        endContent={
          <button
            className="focus:outline-none"
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeSlashIcon className="w-5 h-5 text-neutral-06" />
            ) : (
              <EyeIcon className="w-5 h-5 text-neutral-06" />
            )}
          </button>
        }
        onChange={(e) => {
          setConfirmPassword(e.target.value);
          setErrors({ ...errors, confirmPassword: undefined });
        }}
      />

      <div className="flex gap-3 pt-4">
        {onBack && (
          <Button
            className="flex-1 border-neutral-03"
            size="lg"
            variant="bordered"
            onPress={onBack}
            type="button"
          >
            Back
          </Button>
        )}
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