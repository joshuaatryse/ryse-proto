"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
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
  Input,
  Card,
  CardBody,
  Pagination,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Textarea,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { getInitials, formatCurrency, formatDate } from "@/lib/utils";

// Column definitions
const COLUMNS = [
  { key: "propertyManager", label: "Property Manager", visible: true, sortable: true, width: 200 },
  { key: "owner", label: "Owner", visible: true, sortable: true, width: 200 },
  { key: "properties", label: "Properties", visible: true, sortable: false, width: 100 },
  { key: "totalAmount", label: "Amount", visible: true, sortable: true, width: 120 },
  { key: "status", label: "Status", visible: true, sortable: true, width: 150 },
  { key: "priority", label: "Priority", visible: true, sortable: true, width: 120 },
  { key: "requestedAt", label: "Requested", visible: true, sortable: true, width: 120 },
  { key: "ownerRespondedAt", label: "Response Date", visible: false, sortable: true, width: 120 },
  { key: "actions", label: "Actions", visible: true, sortable: false, width: 120 },
];

export default function AdvanceRequestsTable() {
  const advanceRequests = useQuery(api.advances.getAdminAdvanceRequests, { limit: 500 });
  const approveAdvance = useMutation(api.advances.adminApproveAdvance);
  const rejectAdvance = useMutation(api.advances.adminRejectAdvance);

  const [filterValue, setFilterValue] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>("all");
  const [sortDescriptor, setSortDescriptor] = useState<{
    column: string;
    direction: "ascending" | "descending";
  }>({ column: "priority", direction: "ascending" });
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Modal states
  const { isOpen: isApproveOpen, onOpen: onApproveOpen, onOpenChange: onApproveOpenChange } = useDisclosure();
  const { isOpen: isRejectOpen, onOpen: onRejectOpen, onOpenChange: onRejectOpenChange } = useDisclosure();
  const { isOpen: isDetailsOpen, onOpen: onDetailsOpen, onOpenChange: onDetailsOpenChange } = useDisclosure();

  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    if (!advanceRequests) return [];

    let filtered = [...advanceRequests];

    // Apply text filter
    if (filterValue) {
      const searchValue = filterValue.toLowerCase();
      filtered = filtered.filter((request) => {
        return (
          request.propertyManager?.company?.toLowerCase().includes(searchValue) ||
          request.owner?.name?.toLowerCase().includes(searchValue) ||
          request.owner?.email?.toLowerCase().includes(searchValue) ||
          request.status?.toLowerCase().includes(searchValue) ||
          request.priority?.toLowerCase().includes(searchValue)
        );
      });
    }

    // Apply status filter
    if (selectedStatusFilter !== "all") {
      filtered = filtered.filter((request) => request.status === selectedStatusFilter);
    }

    // Apply priority filter
    if (selectedPriorityFilter !== "all") {
      filtered = filtered.filter((request) => request.priority === selectedPriorityFilter);
    }

    // Sort
    if (sortDescriptor.column) {
      filtered.sort((a: any, b: any) => {
        let aValue: any;
        let bValue: any;

        switch (sortDescriptor.column) {
          case "propertyManager":
            aValue = a.propertyManager?.company || "";
            bValue = b.propertyManager?.company || "";
            break;
          case "owner":
            aValue = a.owner?.name || "";
            bValue = b.owner?.name || "";
            break;
          case "totalAmount":
            aValue = a.totalAmount || 0;
            bValue = b.totalAmount || 0;
            break;
          case "status":
            aValue = a.status || "";
            bValue = b.status || "";
            break;
          case "priority":
            // Custom priority sorting (high -> normal -> low)
            const priorityOrder = { high: 0, normal: 1, low: 2 };
            aValue = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 3;
            bValue = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 3;
            break;
          case "requestedAt":
            aValue = a.requestedAt || 0;
            bValue = b.requestedAt || 0;
            break;
          case "ownerRespondedAt":
            aValue = a.ownerRespondedAt || 0;
            bValue = b.ownerRespondedAt || 0;
            break;
          default:
            aValue = a[sortDescriptor.column] ?? "";
            bValue = b[sortDescriptor.column] ?? "";
        }

        if (aValue < bValue) {
          return sortDescriptor.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortDescriptor.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [advanceRequests, filterValue, selectedStatusFilter, selectedPriorityFilter, sortDescriptor]);

  // Pagination
  const pages = Math.ceil(filteredAndSortedData.length / rowsPerPage);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredAndSortedData.slice(start, end);
  }, [page, filteredAndSortedData, rowsPerPage]);

  const handleApprove = (request: any) => {
    setSelectedRequest(request);
    onApproveOpen();
  };

  const handleReject = (request: any) => {
    setSelectedRequest(request);
    onRejectOpen();
  };

  const handleViewDetails = (request: any) => {
    setSelectedRequest(request);
    onDetailsOpen();
  };

  const confirmApproval = async () => {
    if (!selectedRequest) return;
    setIsProcessing(true);

    try {
      // Only approve the first advance - the mutation will handle the entire group
      const firstAdvance = selectedRequest.advances[0];
      if (firstAdvance) {
        await approveAdvance({
          advanceId: firstAdvance._id as Id<"advances">,
          notes: approvalNotes,
        });
      }

      // Send approval emails
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                     (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://ryse.com');
      const disbursementDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString();

      const finalAmount = selectedRequest.advances.reduce((sum: number, adv: any) => {
        return sum + (adv.status === "countered" && adv.counterAmount ? adv.counterAmount : adv.amount);
      }, 0);

      // Calculate average term months
      const totalTermMonths = selectedRequest.advances.reduce((sum: number, adv: any) => {
        return sum + (adv.status === "countered" && adv.counterTermMonths ? adv.counterTermMonths : adv.termMonths);
      }, 0);
      const avgTermMonths = Math.round(totalTermMonths / selectedRequest.advances.length);

      // Calculate PM commission (2% of total amount)
      const commission = Math.round(finalAmount * 0.02);

      const emailProperties = selectedRequest.properties?.map((p: any, index: number) => ({
        address: typeof p.address === 'string' ? p.address :
                 p.address?.fullAddress || `${p.address?.street}, ${p.address?.city}`,
        monthlyRent: p.monthlyRent || 0,
        termMonths: selectedRequest.advances[index]?.status === "countered" && selectedRequest.advances[index]?.counterTermMonths
          ? selectedRequest.advances[index].counterTermMonths
          : selectedRequest.advances[index]?.termMonths || avgTermMonths,
      })) || [];

      // Send to PM
      if (selectedRequest.propertyManager?.email) {
        await fetch('/api/ryse-decision/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: selectedRequest.propertyManager.email,
            recipientName: selectedRequest.propertyManager.firstName || selectedRequest.propertyManager.name || 'Property Manager',
            recipientType: 'pm',
            decision: 'approved',
            ownerName: selectedRequest.owner?.name || '',
            pmCompanyName: selectedRequest.propertyManager?.companyName ||
                         selectedRequest.propertyManager?.company ||
                         selectedRequest.propertyManager?.name ||
                         `${selectedRequest.propertyManager?.firstName || ''} ${selectedRequest.propertyManager?.lastName || ''}`.trim() ||
                         'Property Management',
            amount: finalAmount,
            termMonths: avgTermMonths,
            properties: emailProperties,
            disbursementDate,
            portalLink: `${baseUrl}/advances`,
            commission,
          }),
        });
      }

      // Send to owner
      if (selectedRequest.owner?.email) {
        await fetch('/api/ryse-decision/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: selectedRequest.owner.email,
            recipientName: selectedRequest.owner.firstName || selectedRequest.owner.name || 'Property Owner',
            recipientType: 'owner',
            decision: 'approved',
            ownerName: selectedRequest.owner.name || '',
            pmCompanyName: selectedRequest.propertyManager?.companyName ||
                         selectedRequest.propertyManager?.company ||
                         selectedRequest.propertyManager?.name ||
                         `${selectedRequest.propertyManager?.firstName || ''} ${selectedRequest.propertyManager?.lastName || ''}`.trim() ||
                         'Property Management',
            amount: finalAmount,
            termMonths: avgTermMonths,
            properties: emailProperties,
            disbursementDate,
            portalLink: `${baseUrl}/owner/advances`,
          }),
        });
      }

      setApprovalNotes("");
      onApproveOpenChange();
    } catch (error) {
      console.error("Error approving advance:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmRejection = async () => {
    if (!selectedRequest) return;
    setIsProcessing(true);

    try {
      // Only reject the first advance - the mutation will handle the entire group
      const firstAdvance = selectedRequest.advances[0];
      if (firstAdvance) {
        await rejectAdvance({
          advanceId: firstAdvance._id as Id<"advances">,
          reason: rejectionReason,
        });
      }

      // Send rejection emails
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                     (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://ryse.com');

      const totalAmount = selectedRequest.advances.reduce((sum: number, adv: any) => sum + adv.amount, 0);

      // Calculate average term months for rejection
      const totalTermMonthsReject = selectedRequest.advances.reduce((sum: number, adv: any) => sum + adv.termMonths, 0);
      const avgTermMonthsReject = Math.round(totalTermMonthsReject / selectedRequest.advances.length);

      const emailProperties = selectedRequest.properties?.map((p: any, index: number) => ({
        address: typeof p.address === 'string' ? p.address :
                 p.address?.fullAddress || `${p.address?.street}, ${p.address?.city}`,
        monthlyRent: p.monthlyRent || 0,
        termMonths: selectedRequest.advances[index]?.termMonths || avgTermMonthsReject,
      })) || [];

      // Send to PM
      if (selectedRequest.propertyManager?.email) {
        await fetch('/api/ryse-decision/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: selectedRequest.propertyManager.email,
            recipientName: selectedRequest.propertyManager.firstName || selectedRequest.propertyManager.name || 'Property Manager',
            recipientType: 'pm',
            decision: 'denied',
            ownerName: selectedRequest.owner?.name || '',
            pmCompanyName: selectedRequest.propertyManager?.companyName ||
                         selectedRequest.propertyManager?.company ||
                         selectedRequest.propertyManager?.name ||
                         `${selectedRequest.propertyManager?.firstName || ''} ${selectedRequest.propertyManager?.lastName || ''}`.trim() ||
                         'Property Management',
            amount: totalAmount,
            termMonths: avgTermMonthsReject,
            properties: emailProperties,
            denialReason: rejectionReason,
            portalLink: `${baseUrl}/advances`,
          }),
        });
      }

      // Send to owner
      if (selectedRequest.owner?.email) {
        await fetch('/api/ryse-decision/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: selectedRequest.owner.email,
            recipientName: selectedRequest.owner.firstName || selectedRequest.owner.name || 'Property Owner',
            recipientType: 'owner',
            decision: 'denied',
            ownerName: selectedRequest.owner.name || '',
            pmCompanyName: selectedRequest.propertyManager?.companyName ||
                         selectedRequest.propertyManager?.company ||
                         selectedRequest.propertyManager?.name ||
                         `${selectedRequest.propertyManager?.firstName || ''} ${selectedRequest.propertyManager?.lastName || ''}`.trim() ||
                         'Property Management',
            amount: totalAmount,
            termMonths: avgTermMonthsReject,
            properties: emailProperties,
            denialReason: rejectionReason,
            portalLink: `${baseUrl}/owner/advances`,
          }),
        });
      }

      setRejectionReason("");
      onRejectOpenChange();
    } catch (error) {
      console.error("Error rejecting advance:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
      case "countered":
        return "warning";
      case "pending":
        return "primary";
      case "disbursed":
        return "success";
      case "denied":
      case "expired":
        return "danger";
      default:
        return "default";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return (
          <Chip
            size="sm"
            className="bg-primary-01 text-primary-06"
            startContent={<Icon icon="solar:bell-bold" className="w-3 h-3" />}
          >
            Needs Review
          </Chip>
        );
      case "normal":
        return (
          <Chip size="sm" className="bg-yellow-100 text-yellow-700">
            Waiting on Owner
          </Chip>
        );
      default:
        return (
          <Chip size="sm" className="bg-neutral-100 text-neutral-600">
            Low
          </Chip>
        );
    }
  };

  const renderCell = useCallback(
    (item: any, columnKey: Key) => {
      switch (columnKey) {
        case "propertyManager":
          return (
            <div className="flex flex-col">
              <span className="text-small font-medium">{item.propertyManager?.company || "Unknown"}</span>
              <span className="text-tiny text-default-400">{item.propertyManager?.email}</span>
            </div>
          );
        case "owner":
          if (!item.owner) return <span className="text-default-400">No owner</span>;
          return (
            <User
              name={item.owner.name}
              description={item.owner.email}
              avatarProps={{
                size: "sm",
                name: getInitials(item.owner.name),
                className: "bg-secondary-02",
              }}
            />
          );
        case "properties":
          return (
            <Chip size="sm" variant="flat">
              {item.propertyCount} {item.propertyCount === 1 ? "property" : "properties"}
            </Chip>
          );
        case "totalAmount":
          return (
            <div className="text-small font-medium">
              {formatCurrency(item.totalAmount)}
            </div>
          );
        case "status":
          return (
            <Chip size="sm" color={getStatusColor(item.status)} variant="flat">
              {item.status === "approved" ? "Owner Approved" :
               item.status === "countered" ? "Owner Countered" : item.status}
            </Chip>
          );
        case "priority":
          return getPriorityBadge(item.priority);
        case "requestedAt":
          return item.requestedAt ? (
            <span className="text-small">{formatDate(item.requestedAt)}</span>
          ) : (
            <span className="text-small text-default-400">-</span>
          );
        case "ownerRespondedAt":
          return item.ownerRespondedAt ? (
            <span className="text-small">{formatDate(item.ownerRespondedAt)}</span>
          ) : (
            <span className="text-small text-default-400">Not yet</span>
          );
        case "actions":
          return (
            <div className="flex items-center gap-1">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => handleViewDetails(item)}
              >
                <Icon icon="solar:eye-linear" className="text-default-400" width={18} />
              </Button>
              {item.priority === "high" && (
                <>
                  <Button
                    isIconOnly
                    size="sm"
                    className="text-primary-06"
                    variant="light"
                    onPress={() => handleApprove(item)}
                  >
                    <Icon icon="solar:check-circle-bold" className="w-4 h-4" />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    className="text-danger"
                    variant="light"
                    onPress={() => handleReject(item)}
                  >
                    <Icon icon="solar:close-circle-bold" className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          );
        default:
          return null;
      }
    },
    []
  );

  const hasActiveFilters = filterValue || selectedStatusFilter !== "all" || selectedPriorityFilter !== "all";

  const clearAllFilters = () => {
    setFilterValue("");
    setSelectedStatusFilter("all");
    setSelectedPriorityFilter("all");
  };

  return (
    <>
      {/* Filter Section */}
      <Card className="border border-neutral-02 mb-6">
        <CardBody className="p-4">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                isClearable
                className="flex-1"
                placeholder="Search by company, owner, or status..."
                startContent={<Icon icon="solar:magnifer-linear" width={20} className="text-neutral-05" />}
                value={filterValue}
                onClear={() => setFilterValue("")}
                onValueChange={setFilterValue}
                variant="bordered"
                classNames={{
                  inputWrapper: "bg-neutral-01 border-neutral-02 hover:border-neutral-03"
                }}
              />
              <Select
                size="md"
                variant="bordered"
                placeholder="All Status"
                selectedKeys={[selectedStatusFilter]}
                className="max-w-[150px]"
                onSelectionChange={(keys) => setSelectedStatusFilter(Array.from(keys)[0] as string)}
              >
                <SelectItem key="all">All Status</SelectItem>
                <SelectItem key="pending">Pending</SelectItem>
                <SelectItem key="approved">Approved</SelectItem>
                <SelectItem key="countered">Countered</SelectItem>
                <SelectItem key="denied">Denied</SelectItem>
                <SelectItem key="disbursed">Disbursed</SelectItem>
              </Select>
              <Select
                size="md"
                variant="bordered"
                placeholder="All Priorities"
                selectedKeys={[selectedPriorityFilter]}
                className="max-w-[150px]"
                onSelectionChange={(keys) => setSelectedPriorityFilter(Array.from(keys)[0] as string)}
              >
                <SelectItem key="all">All Priorities</SelectItem>
                <SelectItem key="high">Needs Review</SelectItem>
                <SelectItem key="normal">Waiting on Owner</SelectItem>
                <SelectItem key="low">Low Priority</SelectItem>
              </Select>
              {hasActiveFilters && (
                <Button
                  size="md"
                  variant="light"
                  className="text-danger"
                  startContent={<Icon icon="solar:close-circle-linear" width={16} />}
                  onPress={clearAllFilters}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Table */}
      <Card className="flex flex-col flex-1 min-h-[400px] h-[calc(100vh-400px)]">
        <CardBody className="p-0 flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-hidden px-6 pt-4 pb-0">
            <div className="h-full overflow-x-auto overflow-y-auto">
              <Table
                aria-label="Advance requests table"
                isStriped
                selectionMode="none"
                removeWrapper
                classNames={{
                  th: "sticky top-0 z-10 bg-neutral-01",
                  thead: "sticky top-0 z-10",
                  table: "table-fixed min-w-[1200px]",
                }}
                sortDescriptor={sortDescriptor}
                onSortChange={(descriptor) => setSortDescriptor(descriptor as any)}
              >
                <TableHeader>
                  {COLUMNS.map((column) => (
                    <TableColumn
                      key={column.key}
                      allowsSorting={column.sortable}
                      style={{ width: `${column.width}px` }}
                    >
                      {column.label}
                    </TableColumn>
                  ))}
                </TableHeader>
                <TableBody
                  emptyContent="No advance requests found"
                  loadingContent={<Spinner />}
                  loadingState={!advanceRequests ? "loading" : undefined}
                >
                  {items.map((item) => (
                    <TableRow key={item.groupId || item.advances?.[0]?._id}>
                      {COLUMNS.map((column) => (
                        <TableCell key={column.key}>
                          {renderCell(item, column.key)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination Footer */}
          {pages > 0 && (
            <div className="flex w-full justify-between items-center px-4 py-3 border-t border-neutral-02 bg-white">
              <div className="flex gap-2 items-center">
                <span className="text-small text-default-400">
                  Showing {((page - 1) * rowsPerPage) + 1} to{" "}
                  {Math.min(page * rowsPerPage, filteredAndSortedData.length)} of{" "}
                  {filteredAndSortedData.length} requests
                </span>
                <Select
                  size="sm"
                  variant="bordered"
                  className="w-[100px]"
                  selectedKeys={[rowsPerPage.toString()]}
                  onSelectionChange={(keys) => {
                    setRowsPerPage(Number(Array.from(keys)[0]));
                    setPage(1);
                  }}
                >
                  <SelectItem key="25">25</SelectItem>
                  <SelectItem key="50">50</SelectItem>
                  <SelectItem key="100">100</SelectItem>
                </Select>
              </div>
              <Pagination
                isCompact
                showControls
                showShadow
                page={page}
                total={pages}
                onChange={setPage}
              />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Approval Modal */}
      <Modal isOpen={isApproveOpen} onOpenChange={onApproveOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Approve Advance Request</ModalHeader>
              <ModalBody>
                <p className="text-sm text-neutral-06 mb-4">
                  You are about to approve {selectedRequest?.propertyCount} advance(s) totaling{" "}
                  <span className="font-semibold">{formatCurrency(selectedRequest?.totalAmount || 0)}</span>.
                </p>
                <Textarea
                  label="Approval Notes (Optional)"
                  placeholder="Add any notes about this approval..."
                  value={approvalNotes}
                  onValueChange={setApprovalNotes}
                  variant="bordered"
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  className="bg-primary-01 text-primary-06"
                  onPress={confirmApproval}
                  isLoading={isProcessing}
                >
                  Approve & Disburse
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Rejection Modal */}
      <Modal isOpen={isRejectOpen} onOpenChange={onRejectOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Deny Advance Request</ModalHeader>
              <ModalBody>
                <p className="text-sm text-neutral-06 mb-4">
                  Please provide a reason for denying this advance request.
                </p>
                <Textarea
                  label="Rejection Reason"
                  placeholder="Enter the reason for denial..."
                  value={rejectionReason}
                  onValueChange={setRejectionReason}
                  variant="bordered"
                  isRequired
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="danger"
                  onPress={confirmRejection}
                  isLoading={isProcessing}
                  isDisabled={!rejectionReason.trim()}
                >
                  Deny Request
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Details Modal */}
      <Modal isOpen={isDetailsOpen} onOpenChange={onDetailsOpenChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Advance Request Details</ModalHeader>
              <ModalBody className="py-6">
                {selectedRequest && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-neutral-06 mb-1">Property Manager</p>
                        <p className="font-medium">{selectedRequest.propertyManager?.company}</p>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-06 mb-1">Owner</p>
                        <p className="font-medium">{selectedRequest.owner?.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-06 mb-1">Total Amount</p>
                        <p className="font-medium">{formatCurrency(selectedRequest.totalAmount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-06 mb-1">Commission</p>
                        <p className="font-medium">{formatCurrency(selectedRequest.totalCommission)}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-neutral-06 mb-2">Properties</p>
                      <div className="space-y-2">
                        {selectedRequest.properties?.map((property: any, index: number) => (
                          <div key={index} className="border border-neutral-02 rounded-lg p-3">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">{property.address?.fullAddress}</p>
                                <p className="text-sm text-neutral-06">
                                  Advance: {formatCurrency(property.advanceAmount)}
                                </p>
                              </div>
                              <Chip size="sm" color={getStatusColor(property.advanceStatus)} variant="flat">
                                {property.advanceStatus}
                              </Chip>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}