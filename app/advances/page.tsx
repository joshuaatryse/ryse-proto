"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Key } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner,
  Chip,
  User,
  Button,
  Tooltip,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Card,
  CardBody,
  Pagination,
  Select,
  SelectItem,
  Checkbox,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { AppLayout } from "@/components/layout/app-layout";
import StatusBadge from "@/components/ui/status-badge";
import AddPropertyTray from "@/components/properties/AddPropertyTray";
import { Id } from "@/convex/_generated/dataModel";
import { getInitials } from "@/lib/utils";
import { parseSmartSearch, applySmartFilters } from "@/lib/smartSearch";

// Column definitions with visibility, order, and fixed widths
const COLUMNS = [
  { key: "select", label: "", visible: true, sortable: false, width: 24 },
  { key: "address", label: "Address", visible: true, sortable: true, width: 250 },
  { key: "owner", label: "Owner", visible: true, sortable: true, width: 250 },
  { key: "propertyType", label: "Type", visible: true, sortable: true, width: 120 },
  { key: "monthlyRent", label: "Monthly Rent", visible: true, sortable: true, width: 120 },
  { key: "status", label: "Lease Status", visible: true, sortable: true, width: 120 },
  { key: "advanceStatus", label: "Advance Status", visible: true, sortable: false, width: 140 },
  { key: "advanceAmount", label: "Amount", visible: true, sortable: true, width: 120 },
  { key: "remainingBalance", label: "Remaining", visible: true, sortable: true, width: 120 },
  { key: "leaseEndDate", label: "Lease End", visible: false, sortable: true, width: 100 },
  { key: "securityDeposit", label: "Security Deposit", visible: false, sortable: true, width: 140 },
  { key: "actions", label: "Actions", visible: true, sortable: false, width: 100 },
];

interface Property {
  _id: Id<"properties">;
  propertyName?: string;
  address: {
    street: string;
    unit?: string;
    city: string;
    state: string;
    zipCode: string;
    fullAddress: string;
  };
  ownerId: Id<"owners">;
  owner: {
    name: string;
    email: string;
    phone?: string;
  } | null;
  propertyType: string;
  monthlyRent: number;
  securityDeposit: number;
  status: "active" | "accepted" | "under_review" | "rejected";
  rejectionReason?: "no_lease" | "lease_ending_soon" | "incomplete_documents" | "property_condition" | "other";
  rejectionNotes?: string;
  hasActiveAdvance: boolean;
  activeAdvanceAmount: number;
  advanceStatus: "requested" | "pending" | "under_review" | "countered" | "denied" | "approved" | "disbursed" | "repaid" | "cancelled" | "expired" | null;
  latestAdvance?: any;
  leaseStartDate?: number;
  leaseEndDate?: number;
  leaseUrl?: string;
  occupancyStatus?: "occupied" | "vacant" | "maintenance";
  ownerSignature?: boolean;
  ownerIsBusinessEntity?: boolean;
}

export default function PropertiesPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"properties" | "advances">("properties");
  const [advanceViewType, setAdvanceViewType] = useState<"active" | "completed">("active");
  const [filterValue, setFilterValue] = useState("");
  const [debouncedFilterValue, setDebouncedFilterValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedOwnerFilter, setSelectedOwnerFilter] = useState<string>("all");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(COLUMNS.filter(col => col.visible).map(col => col.key))
  );
  const [sortDescriptor, setSortDescriptor] = useState<{
    column: string;
    direction: "ascending" | "descending";
  }>({ column: "address", direction: "ascending" });
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [user, setUser] = useState<any>(null);
  const [propertyManagerId, setPropertyManagerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [showSearchHelp, setShowSearchHelp] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { isOpen: isBulkAdvanceOpen, onOpen: onBulkAdvanceOpen, onClose: onBulkAdvanceClose } = useDisclosure();
  const { isOpen: isAddPropertyOpen, onOpen: onAddPropertyOpen, onClose: onAddPropertyClose } = useDisclosure();
  const createBulkAdvances = useMutation(api.advances.createBulkAdvances);

  // Debounce filter value for smoother search
  useEffect(() => {
    if (filterValue !== debouncedFilterValue) {
      setIsSearching(true);
    }

    const timer = setTimeout(() => {
      setDebouncedFilterValue(filterValue);
      setIsSearching(false);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [filterValue]);

  // Handle authentication check
  useEffect(() => {
    const userData = sessionStorage.getItem("ryse-pm-user");
    console.log("Auth check - userData:", userData);
    if (!userData) {
      console.log("No user data found, redirecting to login");
      router.push("/login");
    } else {
      const parsedUser = JSON.parse(userData);
      console.log("User found:", parsedUser);
      setUser(parsedUser);
      setPropertyManagerId(parsedUser.id || parsedUser._id); // Handle both 'id' and '_id'
    }
    setIsLoading(false);
  }, [router]);

  // Fetch properties
  const properties = useQuery(
    api.properties.getPropertiesWithDetails,
    propertyManagerId ? { propertyManagerId: propertyManagerId as Id<"propertyManagers"> } : "skip"
  );

  // Fetch active advances (for advances view - active tab)
  const activeAdvances = useQuery(
    api.advances.getActiveAdvancesByPropertyManager,
    propertyManagerId && viewMode === "advances" && advanceViewType === "active"
      ? { propertyManagerId: propertyManagerId as Id<"propertyManagers"> }
      : "skip"
  );

  // Fetch completed advances (for advances view - completed tab)
  const completedAdvances = useQuery(
    api.advances.getCompletedAdvancesByPropertyManager,
    propertyManagerId && viewMode === "advances" && advanceViewType === "completed"
      ? { propertyManagerId: propertyManagerId as Id<"propertyManagers"> }
      : "skip"
  );

  // Combine advances based on view type
  const advances = viewMode === "advances"
    ? (advanceViewType === "active" ? activeAdvances : completedAdvances)
    : null;

  // Get unique owners for filter dropdown
  const uniqueOwners = useMemo(() => {
    if (!properties) return [];
    const owners = new Map();
    properties.forEach((property: any) => {
      if (property.owner) {
        owners.set(property.owner.email, property.owner.name);
      }
    });
    return Array.from(owners, ([email, name]) => ({ email, name }));
  }, [properties]);

  // Filter and sort data based on view mode
  const filteredAndSortedData = useMemo(() => {
    // Use advances data when in advances view, otherwise use properties
    const dataSource = viewMode === "advances" ? (advances || []) : (properties || []);
    if (!dataSource || dataSource.length === 0) return [];

    let filtered = [...dataSource];

    // Apply smart search filter using debounced value
    if (debouncedFilterValue) {
      const smartFilters = parseSmartSearch(debouncedFilterValue);
      if (smartFilters.length > 0) {
        filtered = applySmartFilters(filtered, smartFilters);
      } else {
        // Fallback to basic text search if no smart filters detected
        const searchValue = debouncedFilterValue.toLowerCase();
        filtered = filtered.filter((item: any) => {
          // Handle different data structures for properties vs advances
          const property = viewMode === "advances" && 'property' in item ? item.property : item;
          const directItem = item;

          return (
            property?.propertyName?.toLowerCase().includes(searchValue) ||
            property?.address?.fullAddress?.toLowerCase().includes(searchValue) ||
            property?.address?.street?.toLowerCase().includes(searchValue) ||
            property?.address?.city?.toLowerCase().includes(searchValue) ||
            property?.address?.state?.toLowerCase().includes(searchValue) ||
            property?.address?.zipCode?.toLowerCase().includes(searchValue) ||
            directItem.owner?.name?.toLowerCase().includes(searchValue) ||
            directItem.owner?.email?.toLowerCase().includes(searchValue) ||
            property?.propertyType?.toLowerCase().includes(searchValue) ||
            directItem.status?.toLowerCase().includes(searchValue) ||
            property?.occupancyStatus?.toLowerCase().includes(searchValue) ||
            (property?.monthlyRent && property.monthlyRent.toString().includes(searchValue)) ||
            (property?.securityDeposit && property.securityDeposit.toString().includes(searchValue))
          );
        });
      }
    }

    // Apply owner filter
    if (selectedOwnerFilter !== "all") {
      filtered = filtered.filter((item) => {
        const owner = viewMode === "advances" ? item.owner : item.owner;
        return owner?.email === selectedOwnerFilter;
      });
    }

    // Apply type filter
    if (selectedTypeFilter !== "all") {
      filtered = filtered.filter((item: any) => {
        const property = viewMode === "advances" && 'property' in item ? item.property : item;
        return property?.propertyType === selectedTypeFilter;
      });
    }

    // Apply status filter
    if (selectedStatusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === selectedStatusFilter);
    }

    // Sort
    if (sortDescriptor.column) {
      filtered.sort((a: any, b: any) => {
        let aValue: any;
        let bValue: any;

        // Handle different column types
        switch (sortDescriptor.column) {
          case "owner":
            aValue = a.owner?.name || "";
            bValue = b.owner?.name || "";
            break;
          case "address":
            aValue = a.address?.fullAddress || "";
            bValue = b.address?.fullAddress || "";
            break;
          case "propertyType":
            aValue = a.propertyType || "";
            bValue = b.propertyType || "";
            break;
          case "monthlyRent":
            aValue = a.monthlyRent || 0;
            bValue = b.monthlyRent || 0;
            break;
          case "securityDeposit":
            aValue = a.securityDeposit || 0;
            bValue = b.securityDeposit || 0;
            break;
          case "status":
            aValue = a.status || "";
            bValue = b.status || "";
            break;
          case "leaseEndDate":
            aValue = a.leaseEndDate || 0;
            bValue = b.leaseEndDate || 0;
            break;
          case "advanceStatus":
            aValue = a.advanceStatus || "";
            bValue = b.advanceStatus || "";
            break;
          case "advanceAmount":
            // For advances view, get amount from the advance itself
            // For properties view, get from latestAdvance
            if (viewMode === "advances") {
              aValue = a.amount || 0;
              bValue = b.amount || 0;
            } else {
              aValue = a.latestAdvance?.amount || 0;
              bValue = b.latestAdvance?.amount || 0;
            }
            break;
          case "remainingBalance":
            if (viewMode === "advances") {
              aValue = a.remainingBalance || a.amount || 0;
              bValue = b.remainingBalance || b.amount || 0;
            } else {
              aValue = a.latestAdvance?.remainingBalance || a.latestAdvance?.amount || 0;
              bValue = b.latestAdvance?.remainingBalance || b.latestAdvance?.amount || 0;
            }
            break;
          default:
            // For any other columns, try to access directly
            aValue = a[sortDescriptor.column] ?? "";
            bValue = b[sortDescriptor.column] ?? "";
        }

        if (aValue != null && bValue != null) {
          if (aValue < bValue) {
            return sortDescriptor.direction === "ascending" ? -1 : 1;
          }
          if (aValue > bValue) {
            return sortDescriptor.direction === "ascending" ? 1 : -1;
          }
        }
        return 0;
      });
    }

    return filtered;
  }, [properties, advances, viewMode, debouncedFilterValue, selectedOwnerFilter, selectedTypeFilter, selectedStatusFilter, sortDescriptor]);

  // Pagination
  const pages = Math.ceil(filteredAndSortedData.length / rowsPerPage);

  // Reset to page 1 if current page is out of bounds
  useEffect(() => {
    if (page > pages && pages > 0) {
      setPage(1);
    }
  }, [page, pages]);

  const items = useMemo(() => {
    // Ensure we don't go past available pages
    const validPage = Math.min(page, Math.max(1, pages));
    const start = (validPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredAndSortedData.slice(start, end);
  }, [page, filteredAndSortedData, rowsPerPage, pages]);

  const handleViewProperty = (property: Property) => {
    router.push(`/advances/${property._id}`);
  };


  // Calculate advance amounts for selected properties
  const calculateAdvanceAmounts = useMemo(() => {
    const selected = Array.from(selectedKeys);
    if (selected.length === 0) return null;

    const selectedProperties = properties?.filter((p: any) => selected.includes(p._id)) || [];

    let totalMonthlyRent = 0;
    let totalLeaseValue = 0;
    let totalAdvanceAmount = 0;
    let eligibleProperties = [];

    for (const property of selectedProperties) {
      // Only calculate for accepted properties without active advances
      if (property.status === "accepted" && !property.hasActiveAdvance) {
        const monthlyRent = property.monthlyRent;
        const leaseEndDate = property.leaseEndDate;

        if (leaseEndDate) {
          const now = Date.now();
          const monthsRemaining = Math.min(
            11, // Max 11 months
            Math.max(0, Math.floor((leaseEndDate - now) / (30 * 24 * 60 * 60 * 1000)))
          );

          if (monthsRemaining >= 3) { // Minimum 3 months required
            const leaseValue = monthlyRent * monthsRemaining;
            const advanceAmount = Math.floor(leaseValue * 0.9); // 90% of lease value

            totalMonthlyRent += monthlyRent;
            totalLeaseValue += leaseValue;
            totalAdvanceAmount += advanceAmount;
            eligibleProperties.push({
              ...property,
              monthsRemaining,
              leaseValue,
              advanceAmount
            });
          }
        }
      }
    }

    return {
      totalSelected: selected.length,
      eligibleCount: eligibleProperties.length,
      totalMonthlyRent,
      totalLeaseValue,
      totalAdvanceAmount,
      eligibleProperties
    };
  }, [selectedKeys, properties]);

  const handleBulkAdvanceRequest = async () => {
    if (!calculateAdvanceAmounts?.eligibleProperties.length) return;

    try {
      const advanceRequests = calculateAdvanceAmounts.eligibleProperties.map(property => ({
        propertyId: property._id,
        ownerId: property.ownerId,
        amount: property.advanceAmount,
        termMonths: property.monthsRemaining,
        monthlyRentAmount: property.monthlyRent,
      }));

      await createBulkAdvances({
        propertyManagerId: propertyManagerId as Id<"propertyManagers">,
        advances: advanceRequests,
      });

      // Clear selection and close modal
      setSelectedKeys(new Set());
      onBulkAdvanceClose();

      // Show success message (you might want to add a toast notification here)
      console.log("Bulk advances created successfully");
    } catch (error) {
      console.error("Error creating bulk advances:", error);
    }
  };

  const renderCell = useCallback(
    (item: any, columnKey: Key) => {
      // Handle different data structures for properties vs advances
      const isAdvance = viewMode === "advances";
      const property = isAdvance ? item.property : item;
      const directItem = item;

      switch (columnKey) {
        case "select":
          // For advances view, allow selection for certain statuses
          const isDisabled = isAdvance
            ? !["pending", "approved", "disbursed"].includes(directItem.status)
            : (property?.status !== "accepted" || property?.hasActiveAdvance);

          return (
            <Checkbox
              isSelected={selectedKeys.has(directItem._id)}
              onValueChange={(isSelected) => {
                const newKeys = new Set(selectedKeys);
                if (isSelected) {
                  newKeys.add(directItem._id);
                } else {
                  newKeys.delete(directItem._id);
                }
                setSelectedKeys(newKeys);
              }}
              isDisabled={isDisabled}
              aria-label={`Select ${isAdvance ? `advance for ${property?.address?.street || "property"}` : property?.propertyName || "property"}`}
            />
          );
        case "address":
          if (!property?.address) return "-";
          const fullAddress = `${property.address.street}, ${property.address.city}, ${property.address.state} ${property.address.zipCode}`;
          const addressLine2 = `${property.address.city}, ${property.address.state} ${property.address.zipCode}`;
          // Check if either line would be truncated (rough estimate based on column width)
          const needsTooltip = property.address.street.length > 30 || addressLine2.length > 35;

          const addressContent = (
            <div className="flex flex-col overflow-hidden">
              <span className="text-small truncate">{property.address.street}</span>
              <span className="text-tiny text-default-400 truncate">
                {addressLine2}
              </span>
            </div>
          );

          return needsTooltip ? (
            <Tooltip content={fullAddress} placement="top" delay={500}>
              {addressContent}
            </Tooltip>
          ) : addressContent;
        case "owner":
          // For advances, owner is at the top level; for properties, it's nested
          const owner = isAdvance ? directItem.owner : property?.owner;
          if (!owner) {
            return <span className="text-default-400">No owner</span>;
          }

          // Check if name or email would be truncated (rough estimate based on 250px column width)
          const ownerNeedsTooltip = owner.name.length > 25 || owner.email.length > 30;

          const ownerContent = (
            <div className="overflow-hidden">
              <User
                name={owner.name}
                description={owner.email}
                avatarProps={{
                  size: "sm",
                  name: getInitials(owner.name),
                  className: "bg-secondary-02",
                }}
                classNames={{
                  name: "truncate",
                  description: "truncate"
                }}
              />
            </div>
          );

          return ownerNeedsTooltip ? (
            <Tooltip
              content={
                <div>
                  <div>{owner.name}</div>
                  <div className="text-xs text-default-400">{owner.email}</div>
                </div>
              }
              placement="top"
              delay={500}
            >
              {ownerContent}
            </Tooltip>
          ) : ownerContent;
        case "propertyType":
          const typeLabels: Record<string, string> = {
            single_family: "Single Family",
            multi_family: "Multi Family",
            condo: "Condo",
            townhouse: "Townhouse",
            apartment: "Apartment",
            commercial: "Commercial",
            other: "Other"
          };

          const typeColors: Record<string, string> = {
            single_family: "bg-tertiary-01 text-tertiary-06",
            multi_family: "bg-secondary-01 text-secondary-08",
            condo: "bg-primary-01 text-primary-06",
            townhouse: "bg-quaternary-01 text-quaternary-06",
            apartment: "bg-warning-50 text-warning-600",
            commercial: "bg-success-50 text-success-600",
            other: "bg-neutral-02 text-neutral-06"
          };

          if (!property?.propertyType) return "-";
          const typeLabel = typeLabels[property.propertyType] || property.propertyType;
          const typeColor = typeColors[property.propertyType] || "bg-neutral-02 text-neutral-06";
          // Check if type label would be truncated (rough estimate for 120px column)
          const typeNeedsTooltip = typeLabel.length > 12;

          const typeChip = (
            <Chip
              size="sm"
              variant="flat"
              className={`${typeColor} truncate`}
            >
              {typeLabel}
            </Chip>
          );

          return typeNeedsTooltip ? (
            <Tooltip content={typeLabel} placement="top" delay={500}>
              {typeChip}
            </Tooltip>
          ) : typeChip;
        case "monthlyRent":
          if (!property?.monthlyRent) return "-";
          return (
            <div className="text-small font-medium">
              ${property.monthlyRent.toLocaleString()}
            </div>
          );
        case "status":
          if (!property?.status) return "-";
          return <StatusBadge status={property.status} />;
        case "advanceStatus":
          // For advances view, use the advance status directly; for properties view, use the property's advance status
          const advanceStatus = isAdvance ? directItem.status : property?.advanceStatus;
          if (!advanceStatus) {
            return <span className="text-small text-default-400">No advance</span>;
          }

          const statusConfig: Record<string, { label: string; color: string; className: string }> = {
            requested: { label: "Invite sent to owner", color: "primary", className: "bg-primary-01 text-primary-06" },
            pending: { label: "Invite sent to owner", color: "primary", className: "bg-primary-01 text-primary-06" },
            under_review: { label: "Under review by Ryse", color: "warning", className: "bg-warning-01 text-warning-06" },
            countered: { label: "Countered by owner", color: "warning", className: "bg-warning-50 text-warning-700" },
            denied: {
              label: (isAdvance ? directItem : property?.latestAdvance)?.rejectionReason ? "Denied by Ryse" : "Denied by owner",
              color: "danger",
              className: (isAdvance ? directItem : property?.latestAdvance)?.rejectionReason
                ? "bg-danger-50 text-danger-700"     // Denied by Ryse - red colors
                : "bg-danger-01 text-danger-06"      // Denied by owner - lighter red colors
            },
            owner_declined: { label: "Declined by owner", color: "danger", className: "bg-danger-01 text-danger-06" },
            approved: {
              label: (isAdvance ? directItem : property?.latestAdvance)?.ownerResponseType === "accept" ? "Accepted by owner" : "Accepted by Ryse",
              color: (isAdvance ? directItem : property?.latestAdvance)?.ownerResponseType === "accept" ? "primary" : "success",
              className: (isAdvance ? directItem : property?.latestAdvance)?.ownerResponseType === "accept"
                ? "bg-tertiary-01 text-tertiary-06"  // Accepted by owner - primary colors
                : "bg-success-01 text-success-06"   // Accepted by Ryse - success colors
            },
            disbursed: {
              label: "Disbursed",
              color: "secondary",
              className: "bg-secondary-01 text-secondary-08"
            },
            repaid: { label: "Completed", color: "default", className: "bg-default-100 text-default-600" },
            cancelled: { label: "Cancelled", color: "default", className: "bg-default-100 text-default-600" },
            expired: { label: "Expired", color: "default", className: "bg-default-100 text-default-600" }
          };

          const config = statusConfig[advanceStatus] || {
            label: advanceStatus,
            color: "default",
            className: "bg-default-100 text-default-600"
          };

          return (
            <Chip size="sm" className={config.className}>
              {config.label}
            </Chip>
          );
        case "advanceAmount": {
          // Show the amount for advances that are disbursed or approved
          const advance = isAdvance ? directItem : property?.latestAdvance;
          const amount = advance?.amount || 0;
          const status = isAdvance ? directItem.status : property?.advanceStatus;

          if (!status || status === "pending" || status === "requested") {
            return <span className="text-small text-default-400">-</span>;
          }

          return (
            <div className="text-small font-medium">
              ${amount.toLocaleString()}
            </div>
          );
        }
        case "remainingBalance": {
          // Show remaining balance for disbursed advances
          const advanceData = isAdvance ? directItem : property?.latestAdvance;
          const statusForBalance = isAdvance ? directItem.status : property?.advanceStatus;

          if (statusForBalance !== "disbursed" || !advanceData) {
            return <span className="text-small text-default-400">-</span>;
          }

          const remaining = advanceData.remainingBalance || advanceData.amount || 0;
          return (
            <div className="text-small font-medium">
              ${remaining.toLocaleString()}
            </div>
          );
        }
        case "leaseEndDate":
          return property?.leaseEndDate ? (
            <span className="text-small">
              {new Date(property.leaseEndDate).toLocaleDateString()}
            </span>
          ) : (
            <span className="text-small text-default-400">N/A</span>
          );
        case "securityDeposit":
          return property?.securityDeposit ? (
            <div className="text-small">
              ${property.securityDeposit.toLocaleString()}
            </div>
          ) : (
            <span className="text-small text-default-400">-</span>
          );
        case "actions":
          return (
            <div className="flex items-center gap-2">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => handleViewProperty(isAdvance ? directItem.property : directItem)}
              >
                <Icon icon="solar:eye-linear" className="text-default-400" width={18} />
              </Button>
              <Dropdown>
                <DropdownTrigger>
                  <Button isIconOnly size="sm" variant="light" className="z-0">
                    <Icon icon="solar:menu-dots-bold" className="text-default-400" width={18} />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Property actions" className="z-0">
                  <DropdownItem
                    key="view"
                    startContent={<Icon icon="solar:eye-linear" width={16} />}
                    onPress={() => handleViewProperty(isAdvance ? directItem.property : directItem)}
                  >
                    View Details
                  </DropdownItem>
                  <DropdownItem
                    key="edit"
                    startContent={<Icon icon="solar:pen-linear" width={16} />}
                    onPress={() => router.push(`/advances/${(isAdvance ? directItem.property : directItem)._id}/edit`)}
                  >
                    Edit Property
                  </DropdownItem>
                  <DropdownItem
                    key="advance"
                    startContent={<Icon icon="solar:dollar-linear" width={16} />}
                  >
                    Request Advance
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          );
        default:
          return null;
      }
    },
    [selectedKeys, viewMode, router]
  );

  console.log("Render state:", { isLoading, propertyManagerId, user, properties: properties?.length });

  if (isLoading) {
    console.log("Showing loading state");
    return (
      <AppLayout user={user}>
        <div className="flex items-center justify-center min-h-screen">
          <Spinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (!propertyManagerId) {
    console.log("No propertyManagerId, returning null");
    return null; // Will redirect via useEffect
  }

  // Check if filters are active
  const hasActiveFilters = debouncedFilterValue || selectedOwnerFilter !== "all" ||
    selectedTypeFilter !== "all" || selectedStatusFilter !== "all";

  const clearAllFilters = () => {
    setFilterValue("");
    setDebouncedFilterValue("");
    setSelectedOwnerFilter("all");
    setSelectedTypeFilter("all");
    setSelectedStatusFilter("all");
  };

  // Quick search tips content
  const QuickSearchTips = () => (
    <div className="p-3 w-96">
      <div className="flex items-start gap-2">
        <Icon icon="solar:lightbulb-minimalistic-linear" width={16} className="text-primary-06 mt-0.5" />
        <div className="flex-1">
          <p className="text-xs font-medium text-neutral-07 mb-2">Try searching with:</p>
          <div className="flex flex-wrap gap-1.5">
            {[
              ">4000",
              "ends in 3 months",
              "status:accepted",
              "vacant",
              "apartment",
              "has advance"
            ].map((example) => (
              <button
                key={example}
                onClick={() => {
                  setFilterValue(example);
                  setIsSearchFocused(false);
                }}
                className="px-2 py-0.5 text-xs bg-neutral-01 hover:bg-neutral-02 border border-neutral-02 rounded-md text-neutral-06 hover:text-primary-06 transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowSearchHelp(true);
              setIsSearchFocused(false);
            }}
            className="text-xs text-primary-06 mt-2 hover:text-primary-07 transition-colors flex items-center gap-0.5"
          >
            Click <Icon icon="solar:question-circle-linear" width={12} className="inline" /> for more examples
          </button>
        </div>
      </div>
    </div>
  );


  return (
    <AppLayout user={user}>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Advances</h1>
            <p className="text-sm text-neutral-06 mt-1">
              {viewMode === "advances"
                ? `View your ${filteredAndSortedData.length} advance requests`
                : `Manage your ${filteredAndSortedData.length} properties and advances`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              className="bg-secondary-01 text-secondary-08"
              startContent={<Icon icon="solar:letter-bold" width={20} />}
              onPress={() => router.push('/advances/request')}
            >
              Send Advance Request
            </Button>
            <Button
              className="bg-primary-01 text-primary-06"
              startContent={<Icon icon="solar:add-circle-bold" width={20} />}
              onPress={onAddPropertyOpen}
            >
              Add Property
            </Button>
          </div>
        </div>

        {/* Filter Section */}
        <Card className="border border-neutral-02 overflow-visible">
          <CardBody className="p-4 overflow-visible">
            <div className="space-y-4">
              {/* View Mode Toggle */}
              <div className="flex justify-between items-center">
                <div className="flex gap-4 items-center">
                  <div className="bg-neutral-01 rounded-lg p-1 flex gap-1">
                    <Button
                      size="sm"
                      variant={viewMode === "properties" ? "flat" : "light"}
                      className={viewMode === "properties" ? "bg-white shadow-sm" : ""}
                      onPress={() => setViewMode("properties")}
                      startContent={<Icon icon="solar:home-2-linear" width={18} />}
                    >
                      Properties View
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === "advances" ? "flat" : "light"}
                      className={viewMode === "advances" ? "bg-white shadow-sm" : ""}
                      onPress={() => setViewMode("advances")}
                      startContent={<Icon icon="solar:money-bag-linear" width={18} />}
                    >
                      Advances View
                    </Button>
                  </div>
                  {/* Show sub-tabs when in advances view */}
                  {viewMode === "advances" && (
                    <div className="bg-neutral-01 rounded-lg p-1 flex gap-1">
                      <Button
                        size="sm"
                        variant={advanceViewType === "active" ? "flat" : "light"}
                        className={advanceViewType === "active" ? "bg-success-50 text-success-600 shadow-sm" : ""}
                        onPress={() => setAdvanceViewType("active")}
                      >
                        Active
                      </Button>
                      <Button
                        size="sm"
                        variant={advanceViewType === "completed" ? "flat" : "light"}
                        className={advanceViewType === "completed" ? "bg-default-100 text-default-600 shadow-sm" : ""}
                        onPress={() => setAdvanceViewType("completed")}
                      >
                        Completed
                      </Button>
                    </div>
                  )}
                </div>
                <div className="text-sm text-neutral-05">
                  {viewMode === "properties"
                    ? `${properties?.length || 0} properties`
                    : `${advances?.length || 0} ${advanceViewType} advances`}
                </div>
              </div>

              {/* Search Bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Input
                    ref={searchInputRef}
                    isClearable
                    classNames={{
                      base: "w-full",
                      inputWrapper: "bg-neutral-01 border-neutral-02 hover:border-neutral-03 border-1 group-data-[focused=true]:border-neutral-03",
                      input: "bg-transparent bg-clip-padding placeholder:text-neutral-05 outline-none focus:outline-none",
                      innerWrapper: "bg-transparent",
                    }}
                    placeholder="Search for anything using natural language..."
                    startContent={
                      isSearching ? (
                        <Spinner size="sm" className="text-neutral-05" />
                      ) : (
                        <Icon icon="solar:magnifer-linear" width={20} className="text-neutral-05" />
                      )
                    }
                    endContent={
                      <div
                        onClick={() => setShowSearchHelp(!showSearchHelp)}
                        className="cursor-pointer p-1 hover:bg-neutral-01 rounded transition-colors"
                        aria-label="Show search help"
                        role="button"
                        tabIndex={0}
                      >
                        <Icon icon="solar:question-circle-linear" width={16} className="text-neutral-05" />
                      </div>
                    }
                    value={filterValue}
                    variant="bordered"
                    onClear={() => setFilterValue("")}
                    onValueChange={setFilterValue}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  />

                  {/* Quick Search Tips Popover */}
                  {isSearchFocused && !filterValue && !showSearchHelp && (
                    <div className="absolute top-full mt-2 left-0 z-50 shadow-lg">
                      <Card className="border border-neutral-02">
                        <CardBody className="p-0">
                          <QuickSearchTips />
                        </CardBody>
                      </Card>
                    </div>
                  )}

                  {/* Search Help Dropdown - Full Examples */}
                  {showSearchHelp && (
                    <Card className="absolute top-full mt-2 left-0 right-0 z-50 shadow-lg border border-neutral-02">
                      <CardBody className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-sm">Smart Search Examples</h4>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              onPress={() => setShowSearchHelp(false)}
                            >
                              <Icon icon="solar:close-circle-linear" width={16} />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="space-y-1">
                              <p className="font-medium text-neutral-07">Rent & Deposits:</p>
                              <button
                                onClick={() => { setFilterValue(">4000"); setShowSearchHelp(false); }}
                                className="block w-full text-left px-2 py-1 rounded hover:bg-neutral-01 text-neutral-06"
                              >
                                <code className="text-primary-06">&gt;4000</code> - Rent over $4,000
                              </button>
                              <button
                                onClick={() => { setFilterValue("rent < 3000"); setShowSearchHelp(false); }}
                                className="block w-full text-left px-2 py-1 rounded hover:bg-neutral-01 text-neutral-06"
                              >
                                <code className="text-primary-06">rent &lt; 3000</code> - Under $3,000
                              </button>
                              <button
                                onClick={() => { setFilterValue("deposit > 5000"); setShowSearchHelp(false); }}
                                className="block w-full text-left px-2 py-1 rounded hover:bg-neutral-01 text-neutral-06"
                              >
                                <code className="text-primary-06">deposit &gt; 5000</code>
                              </button>
                            </div>
                            <div className="space-y-1">
                              <p className="font-medium text-neutral-07">Lease Dates:</p>
                              <button
                                onClick={() => { setFilterValue("ends by january"); setShowSearchHelp(false); }}
                                className="block w-full text-left px-2 py-1 rounded hover:bg-neutral-01 text-neutral-06"
                              >
                                <code className="text-primary-06">ends by january</code>
                              </button>
                              <button
                                onClick={() => { setFilterValue("lease ends in 3 months"); setShowSearchHelp(false); }}
                                className="block w-full text-left px-2 py-1 rounded hover:bg-neutral-01 text-neutral-06"
                              >
                                <code className="text-primary-06">ends in 3 months</code>
                              </button>
                              <button
                                onClick={() => { setFilterValue("starts after 2025"); setShowSearchHelp(false); }}
                                className="block w-full text-left px-2 py-1 rounded hover:bg-neutral-01 text-neutral-06"
                              >
                                <code className="text-primary-06">starts after 2025</code>
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="space-y-1">
                              <p className="font-medium text-neutral-07">Status & Type:</p>
                              <button
                                onClick={() => { setFilterValue("status:accepted"); setShowSearchHelp(false); }}
                                className="block w-full text-left px-2 py-1 rounded hover:bg-neutral-01 text-neutral-06"
                              >
                                <code className="text-primary-06">status:accepted</code>
                              </button>
                              <button
                                onClick={() => { setFilterValue("under review"); setShowSearchHelp(false); }}
                                className="block w-full text-left px-2 py-1 rounded hover:bg-neutral-01 text-neutral-06"
                              >
                                <code className="text-primary-06">under review</code>
                              </button>
                              <button
                                onClick={() => { setFilterValue("apartment"); setShowSearchHelp(false); }}
                                className="block w-full text-left px-2 py-1 rounded hover:bg-neutral-01 text-neutral-06"
                              >
                                <code className="text-primary-06">apartment</code>
                              </button>
                            </div>
                            <div className="space-y-1">
                              <p className="font-medium text-neutral-07">Other:</p>
                              <button
                                onClick={() => { setFilterValue("occupied"); setShowSearchHelp(false); }}
                                className="block w-full text-left px-2 py-1 rounded hover:bg-neutral-01 text-neutral-06"
                              >
                                <code className="text-primary-06">occupied</code> / <code>vacant</code>
                              </button>
                              <button
                                onClick={() => { setFilterValue("has advance"); setShowSearchHelp(false); }}
                                className="block w-full text-left px-2 py-1 rounded hover:bg-neutral-01 text-neutral-06"
                              >
                                <code className="text-primary-06">has advance</code>
                              </button>
                              <button
                                onClick={() => { setFilterValue("business owner"); setShowSearchHelp(false); }}
                                className="block w-full text-left px-2 py-1 rounded hover:bg-neutral-01 text-neutral-06"
                              >
                                <code className="text-primary-06">business owner</code>
                              </button>
                            </div>
                          </div>
                          <div className="pt-2 border-t border-neutral-02">
                            <p className="text-xs text-neutral-06">
                              💡 Combine multiple filters: <code className="text-primary-06">rent &gt; 3000 occupied ends in 6 months</code>
                            </p>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  )}
                </div>
                <Dropdown>
                  <DropdownTrigger>
                    <Button
                      variant="bordered"
                      startContent={<Icon icon="solar:settings-linear" width={18} />}
                      className="border-neutral-02 border-1"
                    >
                      Columns
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    closeOnSelect={false}
                    selectionMode="multiple"
                    selectedKeys={visibleColumns}
                    onSelectionChange={(keys) => setVisibleColumns(new Set(Array.from(keys) as string[]))}
                  >
                    {COLUMNS.filter(col => col.key !== "actions").map((column) => (
                      <DropdownItem key={column.key}>
                        {column.label}
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
              </div>

              {/* Filter Options */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-neutral-07">Filters:</span>
                <Select
                  size="sm"
                  variant="flat"
                  placeholder="All Owners"
                  selectedKeys={[selectedOwnerFilter]}
                  className="max-w-[180px]"
                  classNames={{
                    trigger: "bg-neutral-01 hover:bg-neutral-02 border-0",
                  }}
                  startContent={<Icon icon="solar:user-linear" width={16} className="text-neutral-05" />}
                  onSelectionChange={(keys) => setSelectedOwnerFilter(Array.from(keys)[0] as string)}
                >
                  <SelectItem key="all">All Owners</SelectItem>
                  {uniqueOwners.map((owner) => (
                    <SelectItem key={owner.email}>
                      {owner.name}
                    </SelectItem>
                  )) as any}
                </Select>
                <Select
                  size="sm"
                  variant="flat"
                  placeholder="All Types"
                  selectedKeys={[selectedTypeFilter]}
                  className="max-w-[150px]"
                  classNames={{
                    trigger: "bg-neutral-01 hover:bg-neutral-02 border-0",
                  }}
                  startContent={<Icon icon="solar:home-2-linear" width={16} className="text-neutral-05" />}
                  onSelectionChange={(keys) => setSelectedTypeFilter(Array.from(keys)[0] as string)}
                >
                  <SelectItem key="all">All Types</SelectItem>
                  <SelectItem key="single_family">Single Family</SelectItem>
                  <SelectItem key="multi_family">Multi Family</SelectItem>
                  <SelectItem key="condo">Condo</SelectItem>
                  <SelectItem key="townhouse">Townhouse</SelectItem>
                  <SelectItem key="apartment">Apartment</SelectItem>
                </Select>
                <Select
                  size="sm"
                  variant="flat"
                  placeholder="All Status"
                  selectedKeys={[selectedStatusFilter]}
                  className="max-w-[150px]"
                  classNames={{
                    trigger: "bg-neutral-01 hover:bg-neutral-02 border-0",
                  }}
                  startContent={<Icon icon="solar:shield-check-linear" width={16} className="text-neutral-05" />}
                  onSelectionChange={(keys) => setSelectedStatusFilter(Array.from(keys)[0] as string)}
                >
                  <SelectItem key="all">All Status</SelectItem>
                  <SelectItem key="accepted">Accepted</SelectItem>
                  <SelectItem key="under_review">Under Review</SelectItem>
                  <SelectItem key="rejected">Rejected</SelectItem>
                </Select>
                {hasActiveFilters && (
                  <Button
                    size="sm"
                    variant="light"
                    className="text-danger data-[hover=true]:bg-danger-50 data-[hover=true]:text-danger-600 transition-colors"
                    startContent={<Icon icon="solar:close-circle-linear" width={16} />}
                    onPress={clearAllFilters}
                  >
                    Clear All
                  </Button>
                )}
              </div>

              {/* Active Filters Display */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-neutral-06">Active filters:</span>
                  {debouncedFilterValue && (
                    <Chip
                      size="sm"
                      onClose={() => {
                        setFilterValue("");
                        setDebouncedFilterValue("");
                      }}
                      variant="flat"
                      className="bg-primary-01 text-primary-06"
                    >
                      Search: {debouncedFilterValue}
                    </Chip>
                  )}
                  {selectedOwnerFilter !== "all" && (
                    <Chip
                      size="sm"
                      onClose={() => setSelectedOwnerFilter("all")}
                      variant="flat"
                      className="bg-secondary-01 text-secondary-06"
                    >
                      Owner: {uniqueOwners.find(o => o.email === selectedOwnerFilter)?.name}
                    </Chip>
                  )}
                  {selectedTypeFilter !== "all" && (
                    <Chip
                      size="sm"
                      onClose={() => setSelectedTypeFilter("all")}
                      variant="flat"
                      className="bg-tertiary-01 text-tertiary-06"
                    >
                      Type: {selectedTypeFilter.replace("_", " ")}
                    </Chip>
                  )}
                  {selectedStatusFilter !== "all" && (
                    <Chip
                      size="sm"
                      onClose={() => setSelectedStatusFilter("all")}
                      variant="flat"
                      className="bg-quaternary-01 text-quaternary-06"
                    >
                      Status: {selectedStatusFilter}
                    </Chip>
                  )}
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Table */}
        <Card className={`flex flex-col flex-1 min-h-[400px] h-[calc(84vh-250px)]`}>
          <CardBody className="p-0 flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-hidden px-6 pt-4 pb-0">
              <div className="h-full overflow-x-auto overflow-y-auto">
                <Table
                  aria-label="Properties table"
                  isStriped
                  selectionMode="none"
                  removeWrapper
                  classNames={{
                    th: "sticky top-0 z-10 bg-neutral-01",
                    thead: "sticky top-0 z-10 [&>tr]:first:rounded-none",
                    wrapper: "relative",
                    table: "table-fixed min-w-[1200px]",
                  }}
                sortDescriptor={sortDescriptor}
                onSortChange={(descriptor) => setSortDescriptor(descriptor as any)}
            >
              <TableHeader>
                {Array.from(visibleColumns)
                  .filter(key => key !== 'actions') // Filter out actions first
                  .concat(visibleColumns.has('actions') ? ['actions'] : []) // Add actions at the end if visible
                  .map((columnKey) => {
                    const column = COLUMNS.find(col => col.key === columnKey);
                    if (!column) return null;

                    // Special handling for select column
                    if (column.key === "select") {
                      const eligibleItems = filteredAndSortedData.filter(item => {
                        if (viewMode === "advances") {
                          // For advances, allow selection for certain statuses
                          return ["pending", "approved", "disbursed"].includes(item.status);
                        } else {
                          // For properties, check if accepted and no active advance
                          return item.status === "accepted" && !item.hasActiveAdvance;
                        }
                      });
                      const allEligibleSelected = eligibleItems.length > 0 &&
                        eligibleItems.every(item => selectedKeys.has(item._id));
                      const someSelected = eligibleItems.some(item => selectedKeys.has(item._id));

                      return (
                        <TableColumn
                          key={column.key}
                          className="px-1"
                          style={{ width: '24px', minWidth: '24px', maxWidth: '24px' }}
                        >
                          <Checkbox
                            isSelected={allEligibleSelected}
                            isIndeterminate={someSelected && !allEligibleSelected}
                            onValueChange={(isSelected) => {
                              const newKeys = new Set(selectedKeys);
                              eligibleItems.forEach(item => {
                                if (isSelected) {
                                  newKeys.add(item._id);
                                } else {
                                  newKeys.delete(item._id);
                                }
                              });
                              setSelectedKeys(newKeys);
                            }}
                            aria-label="Select all eligible properties"
                          />
                        </TableColumn>
                      );
                    }

                    return (
                      <TableColumn
                        key={column.key}
                        allowsSorting={column.sortable}
                        style={{ width: `${column.width}px`, minWidth: `${column.width}px`, maxWidth: `${column.width}px` }}
                      >
                        {column.label}
                      </TableColumn>
                    );
                  })
                  .filter((item): item is React.ReactElement => item !== null)}
              </TableHeader>
              <TableBody
                emptyContent={viewMode === "advances"
                  ? (advanceViewType === "active" ? "No active advances found" : "No completed advances found")
                  : "No properties found"}
                loadingContent={<Spinner />}
                loadingState={viewMode === "advances" ? (!advances ? "loading" : undefined) : (!properties ? "loading" : undefined)}
              >
                {items.map((item) => (
                  <TableRow key={item._id}>
                    {Array.from(visibleColumns)
                      .filter(key => key !== 'actions') // Filter out actions first
                      .concat(visibleColumns.has('actions') ? ['actions'] : []) // Add actions at the end if visible
                      .map((columnKey) => {
                        const column = COLUMNS.find(col => col.key === columnKey);
                        return (
                          <TableCell
                            key={columnKey}
                            className={`overflow-hidden ${columnKey === 'select' ? 'px-1' : ''}`}
                            style={{
                              width: `${column?.width}px`,
                              minWidth: `${column?.width}px`,
                              maxWidth: `${column?.width}px`
                            }}
                          >
                            {renderCell(item, columnKey)}
                          </TableCell>
                        );
                      })}
                  </TableRow>
                ))}
              </TableBody>
                </Table>
              </div>
            </div>
            {/* Fixed Pagination Footer */}
            {pages > 0 && (
              <div className="flex w-full justify-between items-center px-4 py-3 border-t border-neutral-02 bg-white">
                <div className="flex gap-2 items-center">
                  <span className="text-small text-default-400">
                    Showing {filteredAndSortedData.length > 0 ? ((Math.min(page, pages) - 1) * rowsPerPage) + 1 : 0} to{" "}
                    {Math.min(Math.min(page, pages) * rowsPerPage, filteredAndSortedData.length)} of{" "}
                    {filteredAndSortedData.length} {viewMode === "advances" ? "advances" : "properties"}
                  </span>
                  <Select
                    size="sm"
                    variant="bordered"
                    className="w-[100px]"
                    selectedKeys={[rowsPerPage.toString()]}
                    onSelectionChange={(keys) => {
                      const newRowsPerPage = Number(Array.from(keys)[0]);
                      setRowsPerPage(newRowsPerPage);
                      // Reset to page 1 when changing rows per page
                      setPage(1);
                    }}
                  >
                    <SelectItem key="25">25</SelectItem>
                    <SelectItem key="50">50</SelectItem>
                    <SelectItem key="100">100</SelectItem>
                    <SelectItem key="250">250</SelectItem>
                    <SelectItem key="500">500</SelectItem>
                  </Select>
                </div>
                <Pagination
                  isCompact
                  showControls
                  showShadow
                  page={page}
                  total={pages}
                  onChange={setPage}
                  className="gap-2"
                />
              </div>
            )}
          </CardBody>
        </Card>

        {/* Bulk Advance Modal */}
        <Modal isOpen={isBulkAdvanceOpen} onClose={onBulkAdvanceClose} size="2xl">
          <ModalContent>
            <ModalHeader>Request Bulk Advances</ModalHeader>
            <ModalBody>
              {calculateAdvanceAmounts && (
                <div className="space-y-4">
                  <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                    <p className="text-sm text-warning-700">
                      {calculateAdvanceAmounts.eligibleCount} of {calculateAdvanceAmounts.totalSelected} selected properties are eligible for advances.
                      {calculateAdvanceAmounts.totalSelected - calculateAdvanceAmounts.eligibleCount > 0 && (
                        <span className="block mt-1 text-xs">
                          Properties may be ineligible due to existing advances, lease terms less than 3 months, or pending status.
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardBody className="text-center">
                        <p className="text-sm text-neutral-06 mb-1">Total Monthly Rent</p>
                        <p className="text-2xl font-bold text-primary-06">
                          ${calculateAdvanceAmounts.totalMonthlyRent.toLocaleString()}
                        </p>
                      </CardBody>
                    </Card>
                    <Card>
                      <CardBody className="text-center">
                        <p className="text-sm text-neutral-06 mb-1">Total Lease Value</p>
                        <p className="text-2xl font-bold text-secondary-06">
                          ${calculateAdvanceAmounts.totalLeaseValue.toLocaleString()}
                        </p>
                      </CardBody>
                    </Card>
                    <Card>
                      <CardBody className="text-center">
                        <p className="text-sm text-neutral-06 mb-1">Total Advance (90%)</p>
                        <p className="text-2xl font-bold text-success-600">
                          ${calculateAdvanceAmounts.totalAdvanceAmount.toLocaleString()}
                        </p>
                      </CardBody>
                    </Card>
                  </div>

                  {calculateAdvanceAmounts.eligibleProperties.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Eligible Properties:</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {calculateAdvanceAmounts.eligibleProperties.map(property => (
                          <div key={property._id} className="border rounded-lg p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{property.propertyName}</p>
                                <p className="text-sm text-neutral-06">
                                  {property.monthsRemaining} months × ${property.monthlyRent.toLocaleString()} =
                                  <span className="font-medium"> ${property.leaseValue.toLocaleString()}</span>
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-neutral-06">Advance Amount</p>
                                <p className="font-bold text-success-600">
                                  ${property.advanceAmount.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onBulkAdvanceClose}>
                Cancel
              </Button>
              <Button
                className="bg-primary text-white"
                onPress={handleBulkAdvanceRequest}
                isDisabled={!calculateAdvanceAmounts?.eligibleProperties.length}
              >
                Request {calculateAdvanceAmounts?.eligibleCount || 0} Advances
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Bottom Action Bar */}
        {selectedKeys.size > 0 && calculateAdvanceAmounts && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-02 shadow-lg z-50">
            <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      isSelected={selectedKeys.size === filteredAndSortedData.length}
                      isIndeterminate={selectedKeys.size > 0 && selectedKeys.size < filteredAndSortedData.length}
                      onValueChange={(isSelected) => {
                        if (isSelected) {
                          setSelectedKeys(new Set(filteredAndSortedData.map(p => p._id)));
                        } else {
                          setSelectedKeys(new Set());
                        }
                      }}
                    />
                    <span className="text-sm font-medium">
                      {selectedKeys.size} selected
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-neutral-06">Eligible:</span>
                      <span className="ml-1 font-medium">{calculateAdvanceAmounts.eligibleCount}</span>
                    </div>
                    <div>
                      <span className="text-neutral-06">Total Rent:</span>
                      <span className="ml-1 font-medium">${calculateAdvanceAmounts.totalMonthlyRent.toLocaleString()}/mo</span>
                    </div>
                    <div>
                      <span className="text-neutral-06">Lease Value:</span>
                      <span className="ml-1 font-medium">${calculateAdvanceAmounts.totalLeaseValue.toLocaleString()}</span>
                    </div>
                    <div className="border-l border-neutral-03 pl-4">
                      <span className="text-neutral-06">Total Advance (90%):</span>
                      <span className="ml-1 font-bold text-success-600 text-base">
                        ${calculateAdvanceAmounts.totalAdvanceAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="light"
                    className="text-danger data-[hover=true]:bg-danger-50 data-[hover=true]:text-danger-600 transition-colors"
                    onPress={() => setSelectedKeys(new Set())}
                  >
                    Clear Selection
                  </Button>
                  <Button
                    className="bg-primary text-white"
                    startContent={<Icon icon="solar:dollar-bold" />}
                    onPress={onBulkAdvanceOpen}
                    isDisabled={calculateAdvanceAmounts.eligibleCount === 0}
                  >
                    Request Advances ({calculateAdvanceAmounts.eligibleCount})
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Property Tray */}
        <AddPropertyTray
          isOpen={isAddPropertyOpen}
          onClose={onAddPropertyClose}
          propertyManagerId={propertyManagerId || ""}
        />

      </div>
    </AppLayout>
  );
}