"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import Image from "next/image";
import { EyeIcon, EyeSlashIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

export default function AdminLoginPage() {
  const router = useRouter();
  const loginMutation = useMutation(api.auth.loginAdmin);
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
      // Store admin in session storage for prototype
      sessionStorage.setItem("ryse-admin-user", JSON.stringify(result));
      router.push("/admin");
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-08 to-neutral-07">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-white/10 rounded-full backdrop-blur">
              <ShieldCheckIcon className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-white mb-2">
            Ryse Admin Portal
          </h1>
          <p className="text-sm text-neutral-03">
            Secure administrator access
          </p>
        </div>

        <Card className="border border-neutral-06 bg-white">
          <CardBody className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                isRequired
                label="Admin Email"
                labelPlacement="inside"
                placeholder="Enter admin email"
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
                placeholder="Enter password"
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
                className="w-full bg-neutral-08 text-white"
                size="lg"
                type="submit"
                isLoading={loading}
              >
                Sign In as Admin
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-neutral-02">
              <p className="text-xs text-neutral-06 text-center">
                Admin Demo Credentials:
                <br />
                sean@rysemarket.com / admin123
                <br />
                joshua@rysemarket.com / admin123
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}