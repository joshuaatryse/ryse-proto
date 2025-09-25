"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import AdvanceRequestsTable from "@/components/admin/advance-requests-table";
import AdvanceRequestsCard from "@/components/admin/advance-requests-card";
import { Button } from "@heroui/button";
import { Icon } from "@iconify/react";

export default function AdminAdvancesPage() {
  const [viewMode, setViewMode] = useState<"card" | "table">("table");

  // Mock user data - in production, this would come from auth
  const mockUser = {
    email: "sean.mitchell@rysemarket.com",
    firstName: "Sean",
    lastName: "Mitchell",
    role: "Admin",
  };

  return (
    <AppLayout user={mockUser}>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Advance Requests</h1>
            <p className="text-sm text-neutral-06 mt-1">
              Review and manage all advance requests across property managers
            </p>
          </div>
          <div className="flex gap-2">
            <div className="bg-neutral-01 rounded-lg p-1 flex gap-1">
              <Button
                size="sm"
                variant={viewMode === "card" ? "flat" : "light"}
                className={viewMode === "card" ? "bg-white shadow-sm" : ""}
                onPress={() => setViewMode("card")}
                startContent={<Icon icon="solar:widget-2-linear" width={18} />}
              >
                Card View
              </Button>
              <Button
                size="sm"
                variant={viewMode === "table" ? "flat" : "light"}
                className={viewMode === "table" ? "bg-white shadow-sm" : ""}
                onPress={() => setViewMode("table")}
                startContent={<Icon icon="solar:list-linear" width={18} />}
              >
                Table View
              </Button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        {viewMode === "card" ? (
          <AdvanceRequestsCard />
        ) : (
          <AdvanceRequestsTable />
        )}
      </div>
    </AppLayout>
  );
}