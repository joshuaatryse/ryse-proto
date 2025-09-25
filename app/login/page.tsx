"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import Image from "next/image";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-01 to-white">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/ryse-logo-primary.svg"
              alt="Ryse"
              width={120}
              height={48}
            />
          </div>
          <h1 className="text-2xl font-semibold text-neutral-08 mb-2">
            Property Manager Portal
          </h1>
          <p className="text-sm text-neutral-06">
            Sign in to manage your rent advances
          </p>
        </div>

        <Card className="border border-neutral-02">
          <CardBody className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                isRequired
                label="Email"
                labelPlacement="inside"
                placeholder="Enter your email"
                type="email"
                value={email}
                variant="bordered"
                classNames={{
                  inputWrapper: "border-1 border-neutral-03",
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
                  inputWrapper: "border-1 border-neutral-03",
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
                onChange={(e) => setPassword(e.target.value)}
              />

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <Button
                className="w-full bg-primary text-white"
                color="primary"
                size="lg"
                type="submit"
                isLoading={loading}
              >
                Sign In
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/onboarding"
                className="text-sm text-primary-06"
              >
                New property manager? Start onboarding
              </Link>
            </div>

            <div className="mt-6 pt-6 border-t border-neutral-02">
              <p className="text-xs text-neutral-06 text-center">
                Demo Credentials:
                <br />
                sarah.johnson@premierproperties.com / password123
                <br />
                michael.chen@urbanrealty.com / password123
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}