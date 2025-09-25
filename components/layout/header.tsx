"use client";

import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { BellIcon } from "@heroicons/react/24/outline";
import StatusBadge from "@/components/ui/status-badge";
import { getInitials } from "@/lib/utils";

interface HeaderProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  integrationStatus?: "enabled" | "disabled";
}

export default function Header({ user, integrationStatus }: HeaderProps) {
  const mockUser = user || {
    name: "John Smith",
    email: "john@propertymanagement.com",
  };

  return (
    <header className="bg-white border-b border-neutral-02 h-16 flex items-center">
      <div className="w-full max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {integrationStatus && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-06">Rent Manager:</span>
                <StatusBadge status={integrationStatus} />
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
          <Button
            isIconOnly
            className="bg-transparent hover:bg-neutral-01"
            size="sm"
          >
            <BellIcon className="w-5 h-5" />
          </Button>

          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button
                className="bg-transparent p-0 min-w-0"
                variant="light"
              >
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-neutral-08">
                      {mockUser.name}
                    </p>
                    <p className="text-xs text-neutral-06">
                      {mockUser.email}
                    </p>
                  </div>
                  <Avatar
                    className="w-10 h-10 text-small"
                    name={mockUser.avatar ? undefined : getInitials(mockUser.name)}
                    src={mockUser.avatar}
                  />
                </div>
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="User menu">
              <DropdownItem key="profile">Profile Settings</DropdownItem>
              <DropdownItem key="company">Company Settings</DropdownItem>
              <DropdownItem key="integration">Integration Settings</DropdownItem>
              <DropdownItem key="billing">Billing</DropdownItem>
              <DropdownItem key="logout" className="text-danger" color="danger">
                Sign Out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
    </div>
    </header>
  );
}