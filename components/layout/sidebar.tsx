"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import clsx from "clsx";
import {
  HomeIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  MegaphoneIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navigation: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <HomeIcon className="w-5 h-5" /> },
  { label: "Advances", href: "/advances", icon: <BuildingOfficeIcon className="w-5 h-5" /> },
  { label: "Marketing", href: "/marketing", icon: <MegaphoneIcon className="w-5 h-5" /> },
  { label: "Insights", href: "/insights", icon: <ChartBarIcon className="w-5 h-5" /> },
];

const adminNavigation: NavItem[] = [
  { label: "Admin", href: "/admin", icon: <Cog6ToothIcon className="w-5 h-5" /> },
  { label: "Users", href: "/admin/users", icon: <UsersIcon className="w-5 h-5" /> },
];

interface SidebarProps {
  isAdmin?: boolean;
}

export default function Sidebar({ isAdmin = false }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const navItems = isAdmin ? adminNavigation : navigation;

  return (
    <aside
      className={clsx(
        "bg-white border-r border-neutral-02 h-screen flex flex-col transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="h-16 px-4 flex items-center justify-between border-b border-neutral-02">
        {!isCollapsed && (
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/ryse-logo-primary.svg"
              alt="Ryse"
              width={80}
              height={32}
            />
          </Link>
        )}
        <Button
          isIconOnly
          className={clsx(
            "bg-transparent hover:bg-neutral-01",
            isCollapsed && "mx-auto"
          )}
          size="sm"
          onPress={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRightIcon className="w-4 h-4" />
          ) : (
            <ChevronLeftIcon className="w-4 h-4" />
          )}
        </Button>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const linkContent = (
              <Link
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary-01 text-primary-06"
                    : "text-neutral-07 hover:bg-neutral-01",
                  isCollapsed && "justify-center"
                )}
              >
                <div className="flex-shrink-0">
                  {item.icon}
                </div>
                {!isCollapsed && <span className="font-medium">{item.label}</span>}
              </Link>
            );

            return (
              <li key={item.href}>
                {isCollapsed ? (
                  <Tooltip content={item.label} placement="right">
                    {linkContent}
                  </Tooltip>
                ) : (
                  linkContent
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {!isAdmin && (
        <div className="p-4 border-t border-neutral-02">
          <div className={clsx(
            "bg-primary-01 rounded-lg",
            isCollapsed ? "p-2 flex justify-center" : "p-3"
          )}>
            {!isCollapsed ? (
              <>
                <p className="text-sm font-medium text-primary-07 mb-1">Need help?</p>
                <p className="text-xs text-primary-06 mb-3">
                  Contact our support team
                </p>
                <Button
                  className="w-full bg-primary text-white"
                  color="primary"
                  size="sm"
                >
                  Get Support
                </Button>
              </>
            ) : (
              <Tooltip content="Get Support" placement="right">
                <Button
                  isIconOnly
                  className="bg-primary text-white"
                  color="primary"
                  size="md"
                >
                  ?
                </Button>
              </Tooltip>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}