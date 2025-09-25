"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import confetti from "canvas-confetti";

export default function SuccessForm() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Trigger confetti animation
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#335ADB", "#33D9B7", "#6E33DB"],
    });

    // Start countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/dashboard");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className="p-4 bg-secondary-01 rounded-full">
          <CheckCircleIcon className="w-16 h-16 text-secondary-06" />
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-neutral-08 mb-2">
          Welcome to Ryse!
        </h1>
        <p className="text-lg text-neutral-06">
          Your account is all set up and ready to go
        </p>
      </div>

      <div className="space-y-4 py-4">
        <p className="text-sm text-neutral-07">
          You can now:
        </p>
        <ul className="text-sm text-neutral-06 space-y-2">
          <li>✓ Sync your properties from Rent Manager</li>
          <li>✓ Request rent advances for property owners</li>
          <li>✓ Send marketing campaigns to owners</li>
          <li>✓ Track commissions and performance</li>
        </ul>
      </div>

      <div className="pt-4">
        <Button
          className="w-full bg-primary text-white"
          color="primary"
          size="lg"
          onPress={() => router.push("/dashboard")}
        >
          Go to Dashboard
        </Button>
        <p className="text-xs text-neutral-06 mt-3">
          Redirecting in {countdown} seconds...
        </p>
      </div>
    </div>
  );
}