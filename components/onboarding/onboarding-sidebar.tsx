"use client";

import { CheckIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";

interface OnboardingSidebarProps {
  currentStep: number;
  children: React.ReactNode;
}

const steps = [
  "Email Address",
  "Create Password",
  "Personal Information",
  "Company Details",
  "Portfolio Size",
  "Marketing Preference",
  "Terms & Conditions",
  "Welcome",
];

export default function OnboardingSidebar({
  currentStep,
  children,
}: OnboardingSidebarProps) {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <div
        className="w-[480px] p-12 hidden lg:flex flex-col"
        style={{
          background: "linear-gradient(291.85deg, #00269F 2.29%, #070E24 99.99%)",
        }}
      >
        <div className="mb-12">
          <img
            src="/ryse-logo-white.svg"
            alt="Ryse"
            className="h-8 w-auto"
          />
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-white mb-2">
              Welcome to Ryse
            </h2>
            <p className="text-white/80">
              Complete your account setup to start offering rent advances to your property owners.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="space-y-3 mt-8">
            {steps.map((step, index) => {
              const stepNumber = index + 1;
              const isCompleted = stepNumber < currentStep;
              const isCurrent = stepNumber === currentStep;

              return (
                <div
                  key={step}
                  className={clsx(
                    "flex items-center gap-3 p-3 rounded-lg transition-colors",
                    isCurrent && "bg-white/10",
                    isCompleted && "opacity-80"
                  )}
                >
                  <div
                    className={clsx(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                      isCompleted
                        ? "bg-white text-primary-06"
                        : isCurrent
                        ? "bg-white/90 text-primary-06"
                        : "bg-white/20 text-white/60"
                    )}
                  >
                    {isCompleted ? (
                      <CheckIcon className="w-4 h-4" />
                    ) : (
                      stepNumber
                    )}
                  </div>
                  <span
                    className={clsx(
                      "text-sm font-medium",
                      isCurrent || isCompleted
                        ? "text-white"
                        : "text-white/60"
                    )}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Help Button - At Bottom */}
        <div className="mt-auto pt-12">
          <button
            type="button"
            className="text-sm text-white/80 hover:text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-all duration-200"
            onClick={() => window.location.href = 'mailto:support@ryse.com'}
          >
            Need help? Contact support@ryse.com
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-4xl">{children}</div>
      </div>
    </div>
  );
}