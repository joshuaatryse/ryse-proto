"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./navbar";

interface AppLayoutProps {
  children: React.ReactNode;
  user?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    profileImageUrl?: string;
  };
}

export function AppLayout({ children, user }: AppLayoutProps) {
  const pathname = usePathname();

  // List of public routes that don't require navbar
  const publicRoutes = [
    "/sign-up",
    "/sign-in",
    "/login",
    "/signup",
    "/reset-password",
    "/onboarding",
  ];

  // Check if current route is public
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // For public routes, render without navbar
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // For all other routes, show navbar
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar user={user} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}