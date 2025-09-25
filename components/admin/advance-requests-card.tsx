"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Textarea } from "@heroui/input";
import { Icon } from "@iconify/react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface AdvanceRequest {
  groupId?: string;
  advances: any[];
  totalAmount: number;
  totalCommission: number;
  status: string;
  priority: "high" | "normal" | "low";
  requestedAt?: number;
  ownerRespondedAt?: number;
  propertyManager?: any;
  owner?: any;
  properties?: any[];
  propertyCount: number;
}

export default function AdvanceRequestsCard() {
  const advanceRequests = useQuery(api.advances.getAdminAdvanceRequests, { limit: 10 });
  const approveAdvance = useMutation(api.advances.adminApproveAdvance);
  const rejectAdvance = useMutation(api.advances.adminRejectAdvance);

  const { isOpen: isApproveOpen, onOpen: onApproveOpen, onOpenChange: onApproveOpenChange } = useDisclosure();
  const { isOpen: isRejectOpen, onOpen: onRejectOpen, onOpenChange: onRejectOpenChange } = useDisclosure();
  const { isOpen: isDetailsOpen, onOpen: onDetailsOpen, onOpenChange: onDetailsOpenChange } = useDisclosure();

  const [selectedRequest, setSelectedRequest] = useState<AdvanceRequest | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async (request: AdvanceRequest) => {
    setSelectedRequest(request);
    onApproveOpen();
  };

  const handleReject = async (request: AdvanceRequest) => {
    setSelectedRequest(request);
    onRejectOpen();
  };

  const handleViewDetails = (request: AdvanceRequest) => {
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

      const finalAmount = selectedRequest.advances.reduce((sum, adv) => {
        return sum + (adv.status === "countered" && adv.counterAmount ? adv.counterAmount : adv.amount);
      }, 0);

      // Calculate average term months
      const totalTermMonths = selectedRequest.advances.reduce((sum, adv) => {
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

      const totalAmount = selectedRequest.advances.reduce((sum, adv) => sum + adv.amount, 0);

      // Calculate average term months for rejection email
      const totalTermMonths = selectedRequest.advances.reduce((sum, adv) => {
        return sum + (adv.status === "countered" && adv.counterTermMonths ? adv.counterTermMonths : adv.termMonths);
      }, 0);
      const avgTermMonths = Math.round(totalTermMonths / selectedRequest.advances.length);

      const emailProperties = selectedRequest.properties?.map((p: any, index: number) => ({
        address: typeof p.address === 'string' ? p.address :
                 p.address?.fullAddress || `${p.address?.street}, ${p.address?.city}`,
        monthlyRent: p.monthlyRent || 0,
        termMonths: selectedRequest.advances[index]?.termMonths || avgTermMonths,
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
            termMonths: avgTermMonths,
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
            termMonths: avgTermMonths,
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

  const getPriorityBadge = (priority: "high" | "normal" | "low") => {
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
        return null;
    }
  };

  const highPriorityRequests = advanceRequests?.filter(r => r.priority === "high") || [];
  const normalPriorityRequests = advanceRequests?.filter(r => r.priority === "normal") || [];

  return (
    <>
      <Card className="w-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
        <CardHeader className="flex flex-row items-center justify-between px-6 py-5 border-b border-neutral-02">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary-01">
              <Icon
                className="w-6 h-6 text-secondary-07"
                icon="solar:dollar-minimalistic-bold"
              />
            </div>
            <div>
              <h3 className="text-xl font-medium text-neutral-08">Advance Requests</h3>
              <p className="text-sm text-neutral-06 mt-1">Review and approve cash advance requests</p>
            </div>
          </div>
          {highPriorityRequests.length > 0 && (
            <Chip className="bg-primary-01 text-primary-06 font-medium">
              {highPriorityRequests.length} Need Review
            </Chip>
          )}
        </CardHeader>
        <CardBody className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
          {!advanceRequests ? (
            <div className="flex items-center justify-center py-12">
              <Icon icon="solar:refresh-circle-bold-duotone" className="w-8 h-8 text-neutral-04 animate-spin" />
            </div>
          ) : advanceRequests.length === 0 ? (
            <div className="text-center py-12 text-neutral-06">
              No advance requests at this time
            </div>
          ) : (
            <>
              {/* High Priority Section */}
              {highPriorityRequests.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon icon="solar:danger-triangle-bold" className="w-5 h-5 text-primary-06" />
                    <h4 className="text-sm font-semibold text-primary-06 uppercase tracking-wider">
                      Requires Admin Review
                    </h4>
                  </div>
                  {highPriorityRequests.map((request, index) => (
                    <div
                      key={request.groupId || index}
                      className="border border-neutral-03 rounded-lg p-3 hover:border-primary-04 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-medium text-neutral-08">
                              {request.propertyManager?.company || "Unknown PM"}
                            </span>
                            <Icon icon="solar:arrow-right-linear" className="w-4 h-4 text-neutral-05" />
                            <span className="text-neutral-07">
                              {request.owner?.name || "Unknown Owner"}
                            </span>
                            {getPriorityBadge(request.priority)}
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-neutral-06">
                              {request.propertyCount} {request.propertyCount === 1 ? "Property" : "Properties"}
                            </span>
                            <span className="font-medium text-neutral-08">
                              {formatCurrency(request.totalAmount)}
                            </span>
                            <Chip size="sm" color={getStatusColor(request.status)} variant="flat">
                              {request.status === "approved" ? "Owner Approved" :
                               request.status === "countered" ? "Owner Countered" : request.status}
                            </Chip>
                          </div>
                          {request.ownerRespondedAt && (
                            <p className="text-xs text-neutral-06 mt-2">
                              Owner responded {formatDate(request.ownerRespondedAt)}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-neutral-01 text-neutral-07"
                            onPress={() => handleViewDetails(request)}
                            startContent={<Icon icon="solar:eye-bold" className="w-4 h-4" />}
                          >
                            Details
                          </Button>
                          <Button
                            size="sm"
                            className="bg-primary-01 text-primary-06"
                            onPress={() => handleApprove(request)}
                            startContent={<Icon icon="solar:check-circle-bold" className="w-4 h-4" />}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            color="danger"
                            variant="flat"
                            onPress={() => handleReject(request)}
                            startContent={<Icon icon="solar:close-circle-bold" className="w-4 h-4" />}
                          >
                            Deny
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Divider */}
              {highPriorityRequests.length > 0 && normalPriorityRequests.length > 0 && (
                <div className="border-t border-neutral-02 my-4" />
              )}

              {/* Normal Priority Section */}
              {normalPriorityRequests.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-neutral-06 uppercase tracking-wider mb-2">
                    Pending Owner Response
                  </h4>
                  {normalPriorityRequests.map((request, index) => (
                    <div
                      key={request.groupId || index}
                      className="border border-neutral-02 rounded-lg p-3 hover:border-primary-04 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-medium text-neutral-08">
                              {request.propertyManager?.company || "Unknown PM"}
                            </span>
                            <Icon icon="solar:arrow-right-linear" className="w-4 h-4 text-neutral-05" />
                            <span className="text-neutral-07">
                              {request.owner?.name || "Unknown Owner"}
                            </span>
                            {getPriorityBadge(request.priority)}
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-neutral-06">
                              {request.propertyCount} {request.propertyCount === 1 ? "Property" : "Properties"}
                            </span>
                            <span className="font-medium text-neutral-08">
                              {formatCurrency(request.totalAmount)}
                            </span>
                            <Chip size="sm" color={getStatusColor(request.status)} variant="flat">
                              {request.status}
                            </Chip>
                          </div>
                          {request.requestedAt && (
                            <p className="text-xs text-neutral-06 mt-2">
                              Requested {formatDate(request.requestedAt)}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="light"
                          onPress={() => handleViewDetails(request)}
                          startContent={<Icon icon="solar:eye-bold" className="w-4 h-4" />}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
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
                  classNames={{
                    inputWrapper: "border-1 border-neutral-03 hover:border-primary-06 focus-within:border-primary-06",
                  }}
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
                  classNames={{
                    inputWrapper: "border-1 border-neutral-03 hover:border-primary-06 focus-within:border-primary-06",
                  }}
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
      <Modal
        isOpen={isDetailsOpen}
        onOpenChange={onDetailsOpenChange}
        size="2xl"
      >
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
                        {selectedRequest.properties?.map((property, index) => (
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