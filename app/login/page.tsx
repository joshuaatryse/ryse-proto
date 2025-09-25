"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { Input } from "@heroui/input";
import { Icon } from "@iconify/react";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const loginMutation = useMutation(api.auth.loginPropertyManager);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await loginMutation({ email, password });
      // Store user in session storage for prototype
      sessionStorage.setItem("ryse-pm-user", JSON.stringify(result));
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-08 via-primary-07 to-primary-06 p-12 flex-col justify-between">
        <div>
          {/* Logo */}
          <div className="mb-16">
            <Image
              src="/ryse-logo-white.svg"
              alt="Ryse"
              width={120}
              height={40}
              className="h-10 w-auto"
            />
          </div>

          {/* Hero Content */}
          <div className="max-w-xl">
            <h1 className="text-5xl lg:text-6xl font-bold text-white mb-8 leading-[1.1] tracking-tight">
              Advance your rent,{" "}
              <span className="text-primary-01">accelerate your growth</span>
            </h1>
            <p className="text-xl text-white/90 mb-12 leading-relaxed">
              Access up to 11 months of rent upfront. Instant liquidity for property managers.
            </p>

            {/* Feature List */}
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon icon="solar:check-circle-bold" className="text-white" width={20} />
                </div>
                <span className="text-white text-lg">Instant approval in minutes</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon icon="solar:check-circle-bold" className="text-white" width={20} />
                </div>
                <span className="text-white text-lg">Up to 11 months rent advance</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon icon="solar:check-circle-bold" className="text-white" width={20} />
                </div>
                <span className="text-white text-lg">2% flat commission rate</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon icon="solar:check-circle-bold" className="text-white" width={20} />
                </div>
                <span className="text-white text-lg">No credit checks required</span>
              </div>
            </div>

            {/* Stats Pills */}
            <div className="flex flex-wrap gap-3 mt-16">
              <div className="bg-white/20 backdrop-blur-md px-5 py-3 rounded-xl border border-white/10">
                <span className="text-white text-base font-semibold">$10M+ Advanced</span>
              </div>
              <div className="bg-white/20 backdrop-blur-md px-5 py-3 rounded-xl border border-white/10">
                <span className="text-white text-base font-semibold">500+ Properties</span>
              </div>
              <div className="bg-white/20 backdrop-blur-md px-5 py-3 rounded-xl border border-white/10">
                <span className="text-white text-base font-semibold">Fast Funding</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-white/50 text-sm">
          © 2025 Ryse. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="mb-8 lg:hidden">
            <Image
              src="/ryse-logo-white.svg"
              alt="Ryse"
              width={100}
              height={32}
              className="h-8 w-auto filter invert"
            />
          </div>

          {/* Form Header */}
          <div className="mb-10">
            <h2 className="text-4xl font-bold text-neutral-09 mb-3">Welcome back</h2>
            <div className="flex items-center gap-2">
              <span className="text-neutral-06 text-base">New to Ryse?</span>
              <Link
                href="/onboarding"
                className="text-primary-06 font-semibold hover:text-primary-07 transition-colors flex items-center gap-1 text-base"
              >
                Create account
                <Icon icon="solar:arrow-right-linear" width={18} />
              </Link>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              isRequired
              label="Email"
              labelPlacement="inside"
              placeholder="you@company.com"
              type="email"
              value={email}
              variant="bordered"
              classNames={{
                inputWrapper: "border-1 border-neutral-03 hover:border-primary-06 focus-within:border-primary-06 h-14 data-[focus=true]:ring-0 data-[focus=true]:ring-offset-0",
                input: "text-base focus:outline-none",
              }}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              isRequired
              label="Password"
              labelPlacement="inside"
              placeholder="Enter your password"
              type={showPassword ? "text" : "password"}
              value={password}
              variant="bordered"
              classNames={{
                inputWrapper: "border-1 border-neutral-03 hover:border-primary-06 focus-within:border-primary-06 h-14 data-[focus=true]:ring-0 data-[focus=true]:ring-offset-0",
                input: "text-base focus:outline-none",
              }}
              endContent={
                <button
                  className="focus:outline-none"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <Icon icon="solar:eye-closed-linear" className="w-5 h-5 text-neutral-06" />
                  ) : (
                    <Icon icon="solar:eye-linear" className="w-5 h-5 text-neutral-06" />
                  )}
                </button>
              }
              onChange={(e) => setPassword(e.target.value)}
            />

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link
                href="#"
                className="text-sm text-primary-06 font-medium hover:text-primary-07 transition-colors"
              >
                Forgot your password?
              </Link>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                className="w-full bg-primary text-white"
                color="primary"
                size="lg"
                isLoading={loading}
                spinner={
                  <svg
                    className="animate-spin h-5 w-5 text-current"
                    fill="none"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      fill="currentColor"
                    />
                  </svg>
                }
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </div>
          </form>

          {/* Footer Links */}
          <div className="mt-8 flex justify-center gap-4 text-xs text-neutral-05">
            <Link href="#" className="hover:text-neutral-07 transition-colors">
              Terms of Service
            </Link>
            <span>•</span>
            <Link href="#" className="hover:text-neutral-07 transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="#" className="hover:text-neutral-07 transition-colors">
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}