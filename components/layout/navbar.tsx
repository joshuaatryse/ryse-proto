"use client";

import React from "react";
import Image from "next/image";
import {
  Navbar as HeroUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
} from "@heroui/navbar";
import { Link } from "@heroui/link";
import { Button } from "@heroui/button";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Avatar } from "@heroui/avatar";
import { Chip } from "@heroui/chip";
import { cn } from "@heroui/theme";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { getInitialsFromNames } from "@/lib/utils";
import { Badge } from "@heroui/badge";
import { Icon } from "@iconify/react";

// Admin menu items
const adminMenuItems = [
  { name: "Dashboard", href: "/admin" },
  { name: "Property Managers", href: "/admin/managers" },
  { name: "Advance Requests", href: "/admin/advances" },
  { name: "Analytics", href: "/admin/analytics" },
  { name: "Settings", href: "/admin/settings" },
];

// Property Manager menu items
const propertyManagerMenuItems = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Advances", href: "/advances" },
  { name: "Marketing", href: "/marketing" },
  { name: "Insights", href: "/insights" },
];

interface NavbarProps {
  user?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    profileImageUrl?: string;
  };
}

export const Navbar = ({ user }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  // Determine which menu items to use based on user role
  const isAdmin = user?.role === "Admin";
  const menuItems = isAdmin ? adminMenuItems : propertyManagerMenuItems;
  const dashboardTitle = isAdmin ? "Ryse Admin" : "Ryse Property Manager";

  const handleSignOut = () => {
    // TODO: Implement sign out
    router.push("/");
  };

  return (
    <HeroUINavbar
      isBordered
      classNames={{
        base: cn("border-default-100", {
          "bg-default-200/50 dark:bg-default-100/50": isMenuOpen,
        }),
        wrapper: "max-w-[1600px] px-4 sm:px-6 lg:px-8 mx-auto w-full",
        item: "hidden md:flex",
      }}
      height="80px"
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
    >
      <NavbarMenuToggle className="text-default-400 md:hidden" />

      <NavbarBrand>
        <div className="flex items-center">
          <Image
            src="/ryse-logo-primary.svg"
            alt="Ryse"
            width={120}
            height={38}
            className="h-9 w-auto"
            priority
          />
        </div>
      </NavbarBrand>

      <NavbarContent
        className="hidden h-11 gap-6 rounded-full border-small border-default-200/20 bg-background/60 px-4 shadow-medium backdrop-blur-md backdrop-saturate-150 dark:bg-default-100/50 md:flex"
        justify="center"
      >
        {menuItems.map((item) => (
          <NavbarItem key={item.name}>
            <Link
              className={cn(
                "px-3 py-1 rounded-md transition-colors",
                pathname === item.href
                  ? "bg-primary-01 text-primary-06"
                  : "text-default-500 hover:text-default-700",
              )}
              href={item.href}
              size="sm"
            >
              {item.name}
            </Link>
          </NavbarItem>
        ))}
      </NavbarContent>

      <NavbarContent justify="end">
        <NavbarItem className="ml-2 !flex gap-2">
          {user ? (
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Button
                  className="h-auto py-2 px-3 bg-neutral-01 hover:bg-neutral-02 transition-none"
                  startContent={
                    <Avatar
                      className="w-10 h-10 bg-secondary-02"
                      name={user.profileImageUrl ? undefined : getInitialsFromNames(user.firstName, user.lastName)}
                      radius="sm"
                      size="sm"
                      src={user.profileImageUrl}
                    />
                  }
                  variant="flat"
                >
                  <div className="flex flex-col items-start gap-1">
                    {user.role && (
                      <Chip
                        className="bg-primary-01 text-primary-06 h-5 px-2"
                        size="sm"
                      >
                        {user.role}
                      </Chip>
                    )}
                    <span className="text-small font-medium">
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName.charAt(0)}.`
                        : user.firstName || "Admin"}
                    </span>
                  </div>
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="User menu actions"
                variant="flat"
                onAction={(key) => {
                  const basePath = isAdmin ? "/admin" : "";
                  switch (key) {
                    case "dashboard":
                      router.push(isAdmin ? "/admin" : "/dashboard");
                      break;
                    case "my-profile":
                      router.push(`${basePath}/profile`);
                      break;
                    case "settings":
                      router.push(`${basePath}/settings`);
                      break;
                    case "help":
                      router.push(`${basePath}/help`);
                      break;
                    case "theme":
                      setTheme(theme === "dark" ? "light" : "dark");
                      break;
                    case "logout":
                      handleSignOut();
                      break;
                  }
                }}
              >
                <DropdownItem key="user-info" className="h-14 gap-2" textValue="User Info">
                  <p className="font-medium">Signed in as</p>
                  <p className="font-medium">{user.email || "Admin"}</p>
                </DropdownItem>
                <DropdownItem key="dashboard" textValue="Dashboard">Dashboard</DropdownItem>
                <DropdownItem key="my-profile" textValue="My Profile">My Profile</DropdownItem>
                <DropdownItem key="settings" textValue="Settings">Settings</DropdownItem>
                <DropdownItem key="help" textValue="Help & Feedback">Help & Feedback</DropdownItem>
                <DropdownItem key="theme" textValue="Theme">
                  <div className="flex items-center justify-between w-full">
                    <span>Theme</span>
                    <span className="text-default-400">
                      {theme === "dark" ? "Dark" : "Light"}
                    </span>
                  </div>
                </DropdownItem>
                <DropdownItem
                  key="logout"
                  className="text-danger data-[hover=true]:bg-danger-50 data-[hover=true]:text-danger"
                  textValue="Log Out"
                >
                  Log Out
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          ) : (
            <div className="flex gap-2">
              <Button as={Link} href="/sign-in" size="sm" variant="light">
                Sign In
              </Button>
              <Button
                as={Link}
                color="primary"
                href="/sign-up"
                size="sm"
                variant="flat"
              >
                Get Started
              </Button>
            </div>
          )}
        </NavbarItem>
      </NavbarContent>

      <NavbarMenu
        className="top-[calc(var(--navbar-height)_-_1px)] max-h-[70vh] bg-default-200/50 pt-6 shadow-medium backdrop-blur-md backdrop-saturate-150 dark:bg-default-100/50"
        motionProps={{
          initial: { opacity: 0, y: -20 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -20 },
          transition: {
            ease: "easeInOut",
            duration: 0.2,
          },
        }}
      >
        {menuItems.map((item, index) => (
          <NavbarMenuItem key={`${item.name}-${index}`}>
            <Link
              className={cn(
                "w-full px-3 py-2 rounded-md transition-colors",
                pathname === item.href
                  ? "bg-primary-01 text-primary-06"
                  : "text-default-500 hover:text-default-700",
              )}
              href={item.href}
              size="md"
            >
              {item.name}
            </Link>
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
    </HeroUINavbar>
  );
};