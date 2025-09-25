"use client";

import Sidebar from "./sidebar";
import Header from "./header";

interface DashboardLayoutProps {
  children: React.ReactNode;
  isAdmin?: boolean;
}

export default function DashboardLayout({ children, isAdmin = false }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-neutral-01">
      <Sidebar isAdmin={isAdmin} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header integrationStatus="disabled" />
        <main className="flex-1 overflow-y-auto bg-neutral-01 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}