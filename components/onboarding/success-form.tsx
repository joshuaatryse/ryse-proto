"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import confetti from "canvas-confetti";

export default function SuccessForm() {
  const router = useRouter();

  useEffect(() => {
    // Trigger confetti animation
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#335ADB", "#33D9B7", "#6E33DB"],
    });
  }, []);

  return (
    <div className="text-center space-y-6 max-w-lg mx-auto">
      <div className="flex justify-center">
        <div className="p-4 bg-secondary-01 rounded-full">
          <CheckCircleIcon className="w-16 h-16 text-secondary-06" />
        </div>
      </div>

      <div className="space-y-3">
        <h1 className="text-3xl font-semibold text-neutral-08">
          Welcome to Ryse!
        </h1>
        <p className="text-base text-neutral-07">
          Your account is all set up and ready to transform how you manage rent advances
        </p>
      </div>

      <div className="bg-neutral-01 border border-neutral-02 p-6 rounded-lg space-y-4 text-left">
        <p className="text-base font-medium text-neutral-08">
          What you can do now:
        </p>
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-start gap-3">
            <CheckCircleIcon className="w-5 h-5 text-secondary-06 mt-0.5 flex-shrink-0" />
            <span className="text-base text-neutral-07">Sync your properties from Rent Manager</span>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircleIcon className="w-5 h-5 text-secondary-06 mt-0.5 flex-shrink-0" />
            <span className="text-base text-neutral-07">Request instant rent advances for property owners</span>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircleIcon className="w-5 h-5 text-secondary-06 mt-0.5 flex-shrink-0" />
            <span className="text-base text-neutral-07">Launch automated marketing campaigns</span>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircleIcon className="w-5 h-5 text-secondary-06 mt-0.5 flex-shrink-0" />
            <span className="text-base text-neutral-07">Track your commissions and performance</span>
          </div>
        </div>
      </div>

      <div className="pt-2 space-y-3">
        <Button
          className="w-full bg-primary text-white font-medium"
          size="lg"
          onPress={() => router.push("/dashboard")}
        >
          Go to Dashboard
        </Button>
        <Button
          className="w-full"
          variant="light"
          size="md"
          onPress={() => router.push("/")}
        >
          Back to Home
        </Button>
      </div>
    </div>
  );
}