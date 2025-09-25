"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Input,
  Textarea,
  Chip,
  Divider,
  Checkbox,
  Alert,
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { PropertySelectionTable } from "@/components/advances/PropertySelectionTable";
import { optimizePropertySelection } from "@/lib/advanceOptimizer";
import Image from "next/image";

type ResponseType = "accept" | "counter" | "decline" | null;

function OwnerAdvanceInviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const action = searchParams.get("action") as ResponseType;

  const [responseType, setResponseType] = useState<ResponseType>(action);
  const [counterAmount, setCounterAmount] = useState<string>("");
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<Set<string>>(new Set());
  const [propertyTermMonths, setPropertyTermMonths] = useState<Record<string, number>>({});
  const [globalTermMonths, setGlobalTermMonths] = useState<number>(6);
  const [declineReason, setDeclineReason] = useState<string>("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [identityVerified, setIdentityVerified] = useState(false);
  const [documentSigned, setDocumentSigned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState<"waiting" | "processing" | "complete">("waiting");
  const [verificationProgress, setVerificationProgress] = useState<number>(0);
  const [signatureName, setSignatureName] = useState<string>("");
  const [signatureConfirmed, setSignatureConfirmed] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  // Auto-suggestion states
  const [suggestedAmount, setSuggestedAmount] = useState<number>(0);
  const [showSuggestion, setShowSuggestion] = useState<boolean>(true);
  const [storedOptimization, setStoredOptimization] = useState<any>(null);

  const { isOpen: isResponseOpen, onOpen: onResponseOpen, onClose: onResponseClose } = useDisclosure();
  const { isOpen: isVerifyOpen, onOpen: onVerifyOpen, onClose: onVerifyClose } = useDisclosure();
  const { isOpen: isSignOpen, onOpen: onSignOpen, onClose: onSignClose } = useDisclosure();
  const { isOpen: isSuccessOpen, onOpen: onSuccessOpen, onClose: onSuccessClose } = useDisclosure();
  const { isOpen: isCounterOpen, onOpen: onCounterOpen, onClose: onCounterClose } = useDisclosure();

  const respondToRequest = useMutation(api.advances.respondToAdvanceRequest);
  const adminInfo = useQuery(api.advances.getAdminInfo);

  // Fetch advance request details
  const advanceRequest = useQuery(
    api.advances.getAdvanceRequestByToken,
    token ? { token } : "skip"
  );

  // Initialize selected properties and terms from the request
  useEffect(() => {
    if (advanceRequest && 'properties' in advanceRequest && advanceRequest.properties) {
      // For initial request, select all properties by default
      const allPropertyIds = new Set(advanceRequest.properties.map((p: any) => p._id as string));
      setSelectedPropertyIds(allPropertyIds);

      // Set initial term months for all properties
      const initialTerms: Record<string, number> = {};
      advanceRequest.properties.forEach((p: any) => {
        // Use individual advance term months if available
        initialTerms[p._id] = p.advanceTermMonths || advanceRequest.termMonths;
      });
      setPropertyTermMonths(initialTerms);
      setGlobalTermMonths(advanceRequest.termMonths);
      // Use totalAmount instead of requestedAmount
      setCounterAmount((advanceRequest.totalAmount || advanceRequest.requestedAmount || 0).toString());
    }
  }, [advanceRequest]);

  // Open response modal if action is specified in URL
  useEffect(() => {
    if (action && advanceRequest && advanceRequest.status !== "expired") {
      if (action === "counter") {
        onCounterOpen();
      } else {
        onResponseOpen();
      }
    }
  }, [action, advanceRequest]);

  // Calculate advance details for counter offer
  const counterCalculation = useMemo(() => {
    if (!advanceRequest || !('properties' in advanceRequest) || !advanceRequest.properties || selectedPropertyIds.size === 0) return null;

    const selectedProps = advanceRequest.properties.filter((p: any) => selectedPropertyIds.has(p._id));
    let totalMonthlyRent = 0;
    let totalAdvanceAmount = 0;
    let maxPossibleAmount = 0;

    selectedProps.forEach((property: any) => {
      const propertyMonths = propertyTermMonths[property._id] || globalTermMonths;
      totalMonthlyRent += property.monthlyRent;
      totalAdvanceAmount += property.monthlyRent * propertyMonths * 0.9;

      if (property.leaseEndDate) {
        const now = Date.now();
        const monthsRemaining = Math.min(
          11,
          Math.floor((property.leaseEndDate - now) / (30 * 24 * 60 * 60 * 1000))
        );
        maxPossibleAmount += property.monthlyRent * monthsRemaining * 0.9;
      } else {
        maxPossibleAmount += property.monthlyRent * 11 * 0.9;
      }
    });

    return {
      totalMonthlyRent,
      suggestedAmount: totalAdvanceAmount,
      maxAmount: maxPossibleAmount,
      selectedCount: selectedPropertyIds.size,
    };
  }, [selectedPropertyIds, advanceRequest, globalTermMonths, propertyTermMonths]);

  // Handle property selection for counter offer
  const handlePropertyToggle = (propertyId: string) => {
    const newSet = new Set(selectedPropertyIds);
    if (newSet.has(propertyId)) {
      newSet.delete(propertyId);
      const newPropertyTermMonths = { ...propertyTermMonths };
      delete newPropertyTermMonths[propertyId];
      setPropertyTermMonths(newPropertyTermMonths);
    } else {
      newSet.add(propertyId);
      setPropertyTermMonths({ ...propertyTermMonths, [propertyId]: globalTermMonths });
    }
    setSelectedPropertyIds(newSet);
  };

  // Update property term months
  const handlePropertyTermChange = (propertyId: string, months: number) => {
    setPropertyTermMonths({ ...propertyTermMonths, [propertyId]: months });
  };

  // Calculate suggestion when user types an amount
  const calculateSuggestion = (targetAmount: number) => {
    if (!targetAmount || targetAmount <= 0 || !advanceRequest || !('properties' in advanceRequest) || !advanceRequest.properties) {
      setSuggestedAmount(0);
      setStoredOptimization(null);
      return null;
    }

    // Extract base property data without advance-specific fields
    const validProperties = advanceRequest.properties
      .filter((p): p is NonNullable<typeof p> => p !== null && p !== undefined)
      .map((p: any) => ({
        _id: p._id,
        address: p.address,
        monthlyRent: p.monthlyRent,
        leaseEndDate: p.leaseEndDate,
        // Include other required Property fields
      }));
    const result = optimizePropertySelection(validProperties as any, targetAmount);

    if (result.selectedPropertyIds.size === 0) {
      setSuggestedAmount(0);
      setStoredOptimization(null);
      return null;
    }

    setSuggestedAmount(result.totalAmount);
    setStoredOptimization(result); // Store the exact result

    return result;
  };

  // Apply the suggested optimization
  const applySuggestion = () => {
    if (!storedOptimization || !suggestedAmount) {
      return;
    }

    // Use the stored optimization result to ensure consistency
    setSelectedPropertyIds(storedOptimization.selectedPropertyIds);
    setPropertyTermMonths(storedOptimization.propertyTermMonths);

    // Use the exact suggested amount that was displayed to the user
    setCounterAmount(suggestedAmount.toString());

    // Clear suggestions after applying
    setSuggestedAmount(0);
    setStoredOptimization(null);
  };

  // Handle response submission
  const handleSubmitResponse = async (forceSubmit = false) => {
    console.log("🔵 handleSubmitResponse called", {
      token: !!token,
      responseType,
      isSubmitting,
      identityVerified,
      documentSigned,
      forceSubmit
    });

    if (!token || !responseType || isSubmitting) {
      console.log("❌ Early return from handleSubmitResponse", {
        hasToken: !!token,
        responseType,
        isSubmitting
      });
      return; // Prevent double submission
    }

    // For accept or counter, require verification and signature
    // Skip these checks if forceSubmit is true (coming from signature completion)
    if (!forceSubmit && (responseType === "accept" || responseType === "counter")) {
      if (!identityVerified) {
        console.log("🔶 Need identity verification, closing modals and opening verify");
        // Close any open modals before opening verify modal
        onResponseClose();
        onCounterClose();
        // Longer delay for counter modal since it's larger
        setTimeout(() => {
          console.log("🔶 Opening verify modal");
          onVerifyOpen();
        }, 300);
        return;
      }
      if (!documentSigned) {
        console.log("🔶 Need document signature, closing modals and opening sign");
        // Close modals before opening sign modal
        onVerifyClose();
        onResponseClose();
        onCounterClose();
        // Longer delay to ensure modals are fully closed
        setTimeout(() => {
          console.log("🔶 Opening sign modal");
          onSignOpen();
        }, 300);
        return;
      }
    }

    console.log("✅ Proceeding with submission");

    setIsSubmitting(true);
    try {
      const args: any = { token, responseType };

      if (responseType === "counter") {
        args.counterAmount = parseInt(counterAmount);
        args.counterTermMonths = Math.round(
          Object.values(propertyTermMonths).reduce((sum, months) => sum + months, 0) /
          Object.values(propertyTermMonths).length
        );
        // Note: selectedPropertyIds tracked locally but not sent to backend
      } else if (responseType === "decline") {
        args.declineReason = declineReason;
      }

      const result = await respondToRequest(args);

      // Send email notifications
      if (advanceRequest && 'propertyManager' in advanceRequest) {
        const emailProperties = advanceRequest.properties?.map((p: any) => ({
          address: typeof p.address === 'string' ? p.address :
                   p.address?.fullAddress || `${p.address?.street}, ${p.address?.city}`,
          monthlyRent: p.monthlyRent || 0,
          termMonths: p.advanceTermMonths || advanceRequest.termMonths,
        })) || [];

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                       (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://ryse.com');

        // Send email to PM
        if (advanceRequest.propertyManager?.email) {
          await fetch('/api/owner-response/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: advanceRequest.propertyManager.email,
              recipientName: advanceRequest.propertyManager?.firstName || 'Property Manager',
              recipientType: 'pm' as const,
              ownerName: advanceRequest.owner?.name || '',
              ownerEmail: advanceRequest.owner?.email || '',
              pmCompanyName: advanceRequest.propertyManager?.company ||
                           `${advanceRequest.propertyManager?.firstName || ''} ${advanceRequest.propertyManager?.lastName || ''}`.trim() ||
                           'Property Management',
              responseType: responseType === "accept" ? "accepted" :
                          responseType === "counter" ? "countered" : "declined",
              originalAmount: advanceRequest.totalAmount || 0,
              counterAmount: responseType === "counter" ? parseInt(counterAmount) : undefined,
              counterTermMonths: responseType === "counter" ? Math.round(
                Object.values(propertyTermMonths).reduce((sum, months) => sum + months, 0) /
                Object.values(propertyTermMonths).length
              ) : undefined,
              originalTermMonths: advanceRequest.termMonths || 0,
              declineReason: responseType === "decline" ? declineReason : undefined,
              properties: emailProperties,
              reviewLink: `${baseUrl}/advances`,
            }),
          });
        }

        // Send to all admins
        try {
          const admins = adminInfo || [];
          for (const admin of admins) {
            await fetch('/api/owner-response/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: admin.email,
                recipientName: admin.firstName,
                recipientType: 'admin' as const,
                pmName: `${advanceRequest.propertyManager?.firstName || ''} ${advanceRequest.propertyManager?.lastName || ''}`.trim() || 'Property Manager',
                ownerName: advanceRequest.owner?.name || '',
                ownerEmail: advanceRequest.owner?.email || '',
                pmCompanyName: advanceRequest.propertyManager?.company ||
                             `${advanceRequest.propertyManager?.firstName || ''} ${advanceRequest.propertyManager?.lastName || ''}`.trim() ||
                             'Property Management',
                responseType: responseType === "accept" ? "accepted" :
                            responseType === "counter" ? "countered" : "declined",
                originalAmount: advanceRequest.totalAmount || 0,
                counterAmount: responseType === "counter" ? parseInt(counterAmount) : undefined,
                counterTermMonths: responseType === "counter" ? Math.round(
                  Object.values(propertyTermMonths).reduce((sum, months) => sum + months, 0) /
                  Object.values(propertyTermMonths).length
                ) : undefined,
                originalTermMonths: advanceRequest.termMonths || 0,
                declineReason: responseType === "decline" ? declineReason : undefined,
                properties: emailProperties,
                reviewLink: `${baseUrl}/admin/advances`,
              }),
            });
          }
        } catch (error) {
          console.error('Error sending admin emails:', error);
        }
      }

      // Close all modals first
      onResponseClose();
      onCounterClose();
      onVerifyClose();
      onSignClose();
      // Small delay before showing success
      setTimeout(() => onSuccessOpen(), 100);
    } catch (error) {
      console.error("Error submitting response:", error);
      alert("Failed to submit response. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simulate identity verification
  const handleIdentityVerification = async () => {
    setIsVerifying(true);
    setVerificationStep("processing");
    setVerificationProgress(0);

    // Simulate processing steps
    await new Promise(resolve => setTimeout(resolve, 800));
    setVerificationProgress(1);

    await new Promise(resolve => setTimeout(resolve, 800));
    setVerificationProgress(2);

    await new Promise(resolve => setTimeout(resolve, 800));
    setVerificationProgress(3);

    setVerificationStep("complete");
    await new Promise(resolve => setTimeout(resolve, 1000));

    setIdentityVerified(true);
    // In production, identity verification would be handled via Stripe Identity API

    setIsVerifying(false);
    setVerificationStep("waiting");
    setVerificationProgress(0);
    onVerifyClose();
    // Small delay to ensure modal closes before opening next
    setTimeout(() => onSignOpen(), 100);
  };

  // Simulate document signing
  const handleDocumentSigning = () => {
    console.log("🖊️ handleDocumentSigning called", {
      isSigning,
      isSubmitting,
      documentSigned,
      identityVerified
    });

    // Prevent double-click by checking if already signing
    if (isSigning || isSubmitting) {
      console.log("❌ Early return from handleDocumentSigning", {
        isSigning,
        isSubmitting
      });
      return;
    }

    // Mark as signed
    console.log("🖊️ Setting documentSigned to true");
    setDocumentSigned(true);

    // Close the signature modal
    onSignClose();

    // Call handleSubmitResponse with forceSubmit=true to skip signature check
    // In production, document signing would be handled via HelloSign/DocuSign API
    console.log("🖊️ Calling handleSubmitResponse with forceSubmit=true");
    handleSubmitResponse(true);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-neutral-01 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-none border-1 border-neutral-02">
          <CardBody className="text-center py-8">
            <Icon icon="solar:danger-triangle-bold" className="text-4xl text-danger mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid Link</h2>
            <p className="text-neutral-06">
              This advance request link is invalid or has been used.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!advanceRequest) {
    return (
      <div className="min-h-screen bg-neutral-01 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const isExpired = advanceRequest.status === "expired" || (advanceRequest.expiresAt && Date.now() > advanceRequest.expiresAt);

  if (isExpired) {
    return (
      <div className="min-h-screen bg-neutral-01 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-none border-1 border-neutral-02">
          <CardBody className="text-center py-8">
            <Icon icon="solar:clock-circle-bold" className="text-4xl text-warning mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Request Expired</h2>
            <p className="text-neutral-06">
              This advance request has expired. Please contact your property manager for a new request.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Type-safe destructuring
  const propertyManager = 'propertyManager' in advanceRequest ? advanceRequest.propertyManager : null;
  const properties = 'properties' in advanceRequest ? advanceRequest.properties : [];

  return (
    <div className="h-screen bg-neutral-01 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-neutral-02 flex-shrink-0">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Image
              src="/ryse-logo-primary.svg"
              alt="Ryse"
              width={120}
              height={40}
              className="h-10 w-auto"
            />
            <Chip className="bg-primary-01 text-primary-06">
              Rent Advance Platform
            </Chip>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 h-full flex flex-col">
          {/* Page Title */}
          <div className="py-4 flex-shrink-0">
            <h1 className="text-2xl font-bold text-neutral-08">Rent Advance Offer</h1>
            <p className="text-neutral-06 text-sm mt-1">
              {propertyManager?.company} has sent you an offer to receive an advance on your rental income
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 overflow-hidden pb-4">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4 overflow-y-auto pr-2">
            {/* Offer Summary Card */}
            <Card className="shadow-none border-1 border-neutral-02">
              <CardHeader>
                <h2 className="text-xl font-semibold">Offer Summary</h2>
              </CardHeader>
              <CardBody>
                <div className="bg-secondary-01 border-1 border-secondary-02 rounded-xl p-6 text-center mb-6">
                  <p className="text-sm text-secondary-07 font-medium uppercase tracking-wider mb-2">
                    Advance Amount
                  </p>
                  <p className="text-4xl font-bold text-secondary-08">
                    ${(advanceRequest.totalAmount || advanceRequest.requestedAmount || 0).toLocaleString()}
                  </p>
                  <p className="text-secondary-07 mt-2">
                    {advanceRequest.termMonths} months of rent upfront
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-neutral-06">Total Monthly Rent</span>
                    <span className="font-medium">
                      ${(properties?.reduce((sum: number, p: any) => sum + (p.monthlyRent || 0), 0) || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-06">Term Length</span>
                    <span className="font-medium">{advanceRequest.termMonths} months</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-06">Commission</span>
                    <span className="font-medium text-neutral-05">2% (paid by PM)</span>
                  </div>
                  <Divider />
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">You Receive</span>
                    <span className="font-bold text-secondary-06">
                      ${(advanceRequest.totalAmount || advanceRequest.requestedAmount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Properties Included */}
            <Card className="flex flex-col max-h-[400px] shadow-none border-1 border-neutral-02">
              <CardHeader className="flex-shrink-0">
                <h2 className="text-xl font-semibold">Properties Included</h2>
              </CardHeader>
              <CardBody className="overflow-y-auto">
                <div className="space-y-3">
                  {properties?.map((property: any, index: number) => (
                    <div key={index} className="border border-neutral-02 rounded-lg p-3 hover:bg-neutral-01 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-neutral-08 text-sm truncate">
                            {property?.address?.street}
                            {property?.address?.unit ? `, Unit ${property.address.unit}` : ''}
                          </p>
                          <p className="text-xs text-neutral-06 mt-1">
                            {property?.address?.city}, {property?.address?.state} {property?.address?.zipCode}
                          </p>
                          <p className="text-xs text-neutral-05 mt-2">
                            Monthly Rent: ${property?.monthlyRent?.toLocaleString()}
                          </p>
                        </div>
                        <Chip size="sm" className="bg-primary-01 text-primary-06 ml-2 flex-shrink-0">
                          <span className="text-xs">
                            {property?.leaseEndDate
                              ? `Ends ${new Date(property.leaseEndDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
                              : 'Month-to-month'}
                          </span>
                        </Chip>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Response Status */}
            {advanceRequest.status !== "pending" && (
              <Alert
                color={
                  advanceRequest.status === "approved" ? "success" :
                  advanceRequest.status === "countered" ? "primary" :
                  advanceRequest.status === "denied" ? "danger" :
                  advanceRequest.status === "disbursed" ? "success" :
                  "warning"
                }
                title={`Request ${advanceRequest.status}`}
                description={
                  advanceRequest.status === "approved" ? "You have accepted this advance request. Awaiting disbursement." :
                  advanceRequest.status === "countered" ? `You countered with $${advanceRequest.counterAmount?.toLocaleString()} for ${advanceRequest.counterTermMonths} months.` :
                  advanceRequest.status === "denied" ? "You have declined this advance request." :
                  advanceRequest.status === "disbursed" ? "This advance has been disbursed! Funds have been sent." :
                  "This advance request status has been updated."
                }
              />
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4 overflow-y-auto pl-2">
            {/* From Card */}
            <Card className="shadow-none border-1 border-neutral-02">
              <CardHeader className="pb-2">
                <h3 className="text-base font-semibold">From</h3>
              </CardHeader>
              <CardBody className="pt-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-01 rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon icon="solar:buildings-2-bold" className="text-xl text-primary-06" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-08 text-sm truncate">{propertyManager?.company}</p>
                    <p className="text-xs text-neutral-06 truncate">
                      {propertyManager?.firstName} {propertyManager?.lastName}
                    </p>
                    <p className="text-xs text-neutral-05 truncate">{propertyManager?.email}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Action Buttons */}
            {advanceRequest.status === "pending" && (
              <Card className="shadow-none border-1 border-neutral-02">
                <CardHeader className="pb-2">
                  <h3 className="text-base font-semibold">Your Response</h3>
                </CardHeader>
                <CardBody className="space-y-2 pt-2">
                  <Button
                    className="w-full bg-secondary-01 text-secondary-08"
                    size="md"
                    onPress={() => {
                      setResponseType("accept");
                      onResponseOpen();
                    }}
                    startContent={<Icon icon="solar:check-circle-bold" className="text-lg" />}
                  >
                    Accept Offer
                  </Button>
                  <Button
                    className="w-full bg-neutral-01 text-neutral-07 border-neutral-03"
                    size="md"
                    onPress={() => {
                      setResponseType("counter");
                      onCounterOpen();
                    }}
                    startContent={<Icon icon="solar:refresh-circle-bold" className="text-lg" />}
                  >
                    Counter Offer
                  </Button>
                  <Button
                    className="w-full bg-red-50 text-red-600"
                    size="md"
                    onPress={() => {
                      setResponseType("decline");
                      onResponseOpen();
                    }}
                    startContent={<Icon icon="solar:close-circle-bold" className="text-lg" />}
                  >
                    Decline
                  </Button>
                </CardBody>
              </Card>
            )}

            {/* Benefits Card */}
            <Card className="bg-primary-01 border-1 border-primary-02 shadow-none">
              <CardBody className="py-3 px-4">
                <p className="font-semibold text-primary-07 text-sm mb-2">Benefits</p>
                <div className="space-y-1.5">
                  <div className="flex gap-2 items-start">
                    <Icon icon="solar:check-circle-bold" className="text-primary-06 text-sm mt-0.5 flex-shrink-0" />
                    <p className="text-xs leading-relaxed">Immediate access to funds</p>
                  </div>
                  <div className="flex gap-2 items-start">
                    <Icon icon="solar:check-circle-bold" className="text-primary-06 text-sm mt-0.5 flex-shrink-0" />
                    <p className="text-xs leading-relaxed">No credit checks</p>
                  </div>
                  <div className="flex gap-2 items-start">
                    <Icon icon="solar:check-circle-bold" className="text-primary-06 text-sm mt-0.5 flex-shrink-0" />
                    <p className="text-xs leading-relaxed">PM handles everything</p>
                  </div>
                  <div className="flex gap-2 items-start">
                    <Icon icon="solar:check-circle-bold" className="text-primary-06 text-sm mt-0.5 flex-shrink-0" />
                    <p className="text-xs leading-relaxed">Flexible use of funds</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>

    {/* Modals */}
    <>
      {/* Counter Offer Modal - Full Page Style */}
      <Modal
        isOpen={isCounterOpen}
        onClose={onCounterClose}
        size="5xl"
        scrollBehavior="inside"
      >
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1">
              <h2 className="text-2xl font-bold">Counter Offer</h2>
              <p className="text-sm text-neutral-06 font-normal">
                Customize the advance terms to better suit your needs
              </p>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-6">
                {/* Property Selection */}
                <Card className="shadow-none border-1 border-neutral-02">
                  <CardHeader className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Select Properties to Include</h3>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="flat"
                        onPress={() => {
                          if ('properties' in advanceRequest && advanceRequest.properties) {
                            const allPropertyIds = new Set(advanceRequest.properties.map((p: any) => p._id as string));
                            setSelectedPropertyIds(allPropertyIds);
                            const newTerms: Record<string, number> = {};
                            advanceRequest.properties.forEach((p: any) => {
                              newTerms[p._id] = 2; // Set all to minimum
                            });
                            setPropertyTermMonths(newTerms);
                          }
                        }}
                      >
                        Select All
                      </Button>
                      <Button
                        size="sm"
                        variant="flat"
                        onPress={() => {
                          setSelectedPropertyIds(new Set());
                          setPropertyTermMonths({});
                        }}
                      >
                        Clear All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardBody className="max-h-[400px] overflow-auto">
                    {'properties' in advanceRequest && advanceRequest.properties && (
                      <PropertySelectionTable
                        properties={advanceRequest.properties.filter((p): p is NonNullable<typeof p> => p !== null && p !== undefined) as any}
                        selectedPropertyIds={selectedPropertyIds}
                        propertyTermMonths={propertyTermMonths}
                        defaultTermMonths={globalTermMonths}
                        onPropertyToggle={handlePropertyToggle}
                        onPropertyTermChange={handlePropertyTermChange}
                        onSelectAll={(selected) => {
                          if (selected && 'properties' in advanceRequest && advanceRequest.properties) {
                            const allPropertyIds = new Set(advanceRequest.properties.map((p: any) => p._id as string));
                            setSelectedPropertyIds(allPropertyIds);
                            const newTerms: Record<string, number> = {};
                            advanceRequest.properties.forEach((p: any) => {
                              newTerms[p._id] = globalTermMonths;
                            });
                            setPropertyTermMonths(newTerms);
                          } else {
                            setSelectedPropertyIds(new Set());
                            setPropertyTermMonths({});
                          }
                        }}
                      />
                    )}
                  </CardBody>
                </Card>

                {/* Counter Amount Configuration */}
                {counterCalculation && selectedPropertyIds.size > 0 && (
                  <Card className="shadow-none border-1 border-neutral-02">
                    <CardHeader>
                      <h3 className="text-lg font-semibold">Configure Counter Amount</h3>
                    </CardHeader>
                    <CardBody className="space-y-4">
                      <div className="bg-neutral-01 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Selected Properties</span>
                          <span className="text-sm font-semibold">{counterCalculation.selectedCount}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Average Term</span>
                          <span className="text-sm font-semibold">
                            {(() => {
                              if ('properties' in advanceRequest && advanceRequest.properties) {
                                const selectedProps = advanceRequest.properties.filter((p: any) => selectedPropertyIds.has(p._id));
                                const avgMonths = selectedProps.length > 0
                                  ? Math.round(selectedProps.reduce((sum: number, p: any) => sum + (propertyTermMonths[p._id] || globalTermMonths), 0) / selectedProps.length)
                                  : 0;
                                return `${avgMonths} months`;
                              }
                              return '0 months';
                            })()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Total Monthly Rent</span>
                          <span className="text-sm font-semibold">${counterCalculation.totalMonthlyRent.toLocaleString()}</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Counter Amount</label>
                        <div className="relative">
                          <Input
                            type="text"
                            placeholder="Enter target amount (e.g., 50,000)"
                            value={counterAmount ? parseInt(counterAmount).toLocaleString() : ''}
                            onValueChange={(value) => {
                              // Remove commas and parse as number
                              const numValue = parseInt(value.replace(/,/g, '')) || 0;
                              setCounterAmount(numValue.toString());

                              // Show suggestions and calculate
                              setShowSuggestion(true);

                              // Always calculate suggestion when typing
                              if (numValue > 0) {
                                calculateSuggestion(numValue);
                              } else {
                                setSuggestedAmount(0);
                              }
                            }}
                            onFocus={() => setShowSuggestion(true)}
                            onBlur={() => {
                              // Delay hiding to allow click on suggestion
                              setTimeout(() => setShowSuggestion(false), 200);
                            }}
                            startContent={<span className="text-neutral-05">$</span>}
                            size="lg"
                            variant="bordered"
                            color={parseInt(counterAmount || '0') > counterCalculation.maxAmount ? "danger" : "default"}
                            classNames={{
                              input: "text-2xl font-semibold outline-none focus:outline-none",
                              inputWrapper: `${
                                parseInt(counterAmount || '0') > counterCalculation.maxAmount
                                  ? "bg-red-50 border-red-300 hover:border-red-400 border-2 group-data-[focused=true]:border-red-400"
                                  : "bg-neutral-01 border-neutral-02 hover:border-neutral-03 border-1 group-data-[focused=true]:border-neutral-03"
                              }`,
                              innerWrapper: "bg-transparent",
                            }}
                          />

                          {/* Auto-suggestion dropdown */}
                          {showSuggestion && suggestedAmount > 0 && parseInt(counterAmount || '0') > 0 && (
                            <div className="absolute left-0 right-0 top-full z-50 bg-white shadow-md rounded-lg mt-1 overflow-hidden border border-neutral-02">
                              <button
                                type="button"
                                className="w-full text-left px-4 py-3 hover:bg-neutral-01 transition-colors group"
                                onClick={() => {
                                  applySuggestion();
                                  setShowSuggestion(false);
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-semibold text-primary-07 group-hover:text-primary-08">
                                      ${suggestedAmount.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-neutral-05 mt-0.5">
                                      {suggestedAmount === parseInt(counterAmount || '0')
                                        ? "Exact match - covers full months of rent"
                                        : suggestedAmount > parseInt(counterAmount || '0')
                                        ? `Optimized to full months • $${(suggestedAmount - parseInt(counterAmount || '0')).toLocaleString()} above target`
                                        : "Adjusted to complete rental months"}
                                    </p>
                                    {storedOptimization && (
                                      <p className="text-xs text-neutral-05 mt-0.5">
                                        Will select {storedOptimization.selectedPropertyIds.size} {storedOptimization.selectedPropertyIds.size === 1 ? 'property' : 'properties'}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Icon icon="ri:sparkling-2-fill" className="text-primary-06" />
                                    <span className="text-xs text-primary-06 font-medium">
                                      Auto-select
                                    </span>
                                  </div>
                                </div>
                              </button>
                              <div className="px-4 py-3 bg-amber-50 border-t border-amber-200">
                                <div className="flex gap-2">
                                  <Icon icon="solar:info-circle-bold" className="text-amber-600 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-xs text-amber-800 font-medium mb-1">
                                      Why this amount?
                                    </p>
                                    <p className="text-xs text-amber-700">
                                      Advances must cover complete months of rent across your property portfolio.
                                      We've calculated the closest amount using whole months from eligible properties.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-center mt-2">
                          <p className="text-xs text-neutral-05">
                            {selectedPropertyIds.size > 0
                              ? `${selectedPropertyIds.size} of ${('properties' in advanceRequest && advanceRequest.properties) ? advanceRequest.properties.length : 0} properties selected • Each covering full rental months`
                              : "Enter amount to auto-select optimal properties"}
                          </p>
                          <p className="text-xs text-neutral-05">
                            Max: ${Math.floor(counterCalculation.maxAmount).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 rounded-xl bg-neutral-01 border-2 border-neutral-02">
                          <p className="text-xs text-neutral-06 font-medium uppercase mb-1">Original Offer</p>
                          <p className="text-2xl font-bold text-neutral-07">
                            ${(advanceRequest.totalAmount || advanceRequest.requestedAmount || 0).toLocaleString()}
                          </p>
                        </div>
                        <div className={`text-center p-4 rounded-xl border-2 ${
                          parseInt(counterAmount || '0') > counterCalculation.maxAmount
                            ? "bg-red-50 border-red-200"
                            : "bg-primary-01 border-primary-02"
                        }`}>
                          <p className={`text-xs font-medium uppercase mb-1 ${
                            parseInt(counterAmount || '0') > counterCalculation.maxAmount
                              ? "text-red-700"
                              : "text-primary-06"
                          }`}>Your Counter</p>
                          <p className={`text-2xl font-bold ${
                            parseInt(counterAmount || '0') > counterCalculation.maxAmount
                              ? "text-red-700"
                              : "text-primary-07"
                          }`}>
                            ${parseInt(counterAmount || '0').toLocaleString()}
                          </p>
                          {parseInt(counterAmount || '0') > counterCalculation.maxAmount && (
                            <p className="text-xs text-red-600 mt-1">Exceeds maximum</p>
                          )}
                        </div>
                      </div>

                      {parseInt(counterAmount || '0') > counterCalculation.maxAmount && (
                        <div className="text-center text-sm text-red-600 font-semibold">
                          <Icon icon="solar:danger-triangle-bold" className="inline mr-1" />
                          Amount exceeds maximum by ${(parseInt(counterAmount || '0') - counterCalculation.maxAmount).toLocaleString()}
                        </div>
                      )}
                    </CardBody>
                  </Card>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onCounterClose}>
                Cancel
              </Button>
              <Button
                className="bg-primary text-white"
                onPress={() => handleSubmitResponse()}
                isDisabled={!counterAmount || selectedPropertyIds.size === 0 || parseInt(counterAmount) > (counterCalculation?.maxAmount || 0)}
                isLoading={isSubmitting}
              >
                Submit Counter Offer
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Accept/Decline Response Modal */}
        <Modal isOpen={isResponseOpen} onClose={onResponseClose} size="lg">
          <ModalContent>
            <ModalHeader>
              {responseType === "accept" && "Accept Advance Offer"}
              {responseType === "decline" && "Decline Offer"}
            </ModalHeader>
            <ModalBody>
              {responseType === "accept" && (
                <div className="space-y-4">
                  <Alert
                    color="success"
                    title="You're accepting:"
                    description={`$${(advanceRequest.totalAmount || advanceRequest.requestedAmount || 0).toLocaleString()} for ${advanceRequest.termMonths} months`}
                  />
                  <Checkbox
                    isSelected={termsAccepted}
                    onValueChange={setTermsAccepted}
                  >
                    I understand and accept the terms of this advance
                  </Checkbox>
                </div>
              )}

              {responseType === "decline" && (
                <div className="space-y-4">
                  <Textarea
                    label="Reason for declining (optional)"
                    value={declineReason}
                    onValueChange={setDeclineReason}
                    placeholder="Let us know why you're declining..."
                  />
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onResponseClose}>
                Cancel
              </Button>
              <Button
                color={responseType === "decline" ? "danger" : "primary"}
                onPress={() => handleSubmitResponse()}
                isDisabled={responseType === "accept" && !termsAccepted}
                isLoading={isSubmitting}
              >
                {responseType === "accept" && "Continue to Verification"}
                {responseType === "decline" && "Decline Offer"}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Identity Verification Modal */}
        <Modal isOpen={isVerifyOpen} onClose={onVerifyClose} isDismissable={false} size="lg">
          <ModalContent>
            <ModalHeader className="flex items-center justify-between">
              <span>Identity Verification</span>
            </ModalHeader>
            <ModalBody>
              <div className="text-center py-6">
                {!isVerifying ? (
                  <>
                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Image
                        src="/stripe.svg"
                        alt="Stripe"
                        width={60}
                        height={30}
                        className="opacity-80"
                      />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Verify Your Identity</h3>
                    <p className="text-sm text-neutral-06 mb-6">
                      We use Stripe Identity to securely verify your information.
                      This helps protect against fraud and ensures secure fund transfers.
                    </p>
                    <div className="bg-neutral-01 rounded-lg p-4 mb-6 text-left">
                      <p className="text-xs font-medium text-neutral-07 mb-2">What to expect:</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Icon icon="solar:check-circle-linear" className="text-indigo-600" />
                          <span className="text-xs text-neutral-06">Photo of your government ID</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Icon icon="solar:check-circle-linear" className="text-indigo-600" />
                          <span className="text-xs text-neutral-06">Selfie for verification</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Icon icon="solar:check-circle-linear" className="text-indigo-600" />
                          <span className="text-xs text-neutral-06">Instant verification</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      className="bg-indigo-600 text-white"
                      size="lg"
                      onPress={handleIdentityVerification}
                      startContent={<Icon icon="solar:shield-check-bold" />}
                    >
                      Start Verification
                    </Button>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="relative w-32 h-32 mx-auto">
                      {verificationStep === "processing" ? (
                        <>
                          {/* HeroUI Spinner positioned around the circle */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Spinner
                              size="lg"
                              color="secondary"
                              classNames={{
                                wrapper: "w-32 h-32",
                                circle1: "border-b-indigo-600",
                                circle2: "border-b-indigo-600"
                              }}
                            />
                          </div>
                          {/* Inner circle with Stripe logo */}
                          <div className="absolute inset-2 rounded-full bg-white border border-indigo-100 flex items-center justify-center">
                            <Image
                              src="/stripe.svg"
                              alt="Stripe"
                              width={60}
                              height={30}
                              className="opacity-90"
                            />
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0 rounded-full bg-success-100 flex items-center justify-center">
                          <Icon icon="solar:check-circle-bold" className="text-5xl text-success-600" />
                        </div>
                      )}
                    </div>

                    {verificationStep === "processing" && (
                      <>
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Verifying Identity...</h3>
                          <p className="text-sm text-neutral-06">
                            Please wait while we securely verify your information
                          </p>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            {verificationProgress >= 1 ? (
                              <Icon icon="solar:check-circle-bold" className="text-lg text-success-600" />
                            ) : (
                              <Spinner size="sm" className="text-indigo-600" />
                            )}
                            <span className={`text-sm ${verificationProgress >= 1 ? "text-neutral-07 font-medium" : "text-neutral-06"}`}>
                              Analyzing documents...
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            {verificationProgress >= 2 ? (
                              <Icon icon="solar:check-circle-bold" className="text-lg text-success-600" />
                            ) : verificationProgress >= 1 ? (
                              <Spinner size="sm" className="text-indigo-600" />
                            ) : (
                              <div className="w-4 h-4 rounded-full bg-neutral-03" />
                            )}
                            <span className={`text-sm ${verificationProgress >= 2 ? "text-neutral-07 font-medium" : "text-neutral-05"}`}>
                              Performing security checks...
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            {verificationProgress >= 3 ? (
                              <Icon icon="solar:check-circle-bold" className="text-lg text-success-600" />
                            ) : verificationProgress >= 2 ? (
                              <Spinner size="sm" className="text-indigo-600" />
                            ) : (
                              <div className="w-4 h-4 rounded-full bg-neutral-03" />
                            )}
                            <span className={`text-sm ${verificationProgress >= 3 ? "text-neutral-07 font-medium" : "text-neutral-05"}`}>
                              Confirming identity...
                            </span>
                          </div>
                        </div>
                      </>
                    )}

                    {verificationStep === "complete" && (
                      <div>
                        <h3 className="text-lg font-semibold mb-2 text-success-700">Identity Verified!</h3>
                        <p className="text-sm text-neutral-06">
                          Your identity has been successfully verified. Proceeding to document signing...
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Document Signature Modal */}
        <Modal isOpen={isSignOpen} onClose={onSignClose} isDismissable={false} size="lg">
          <ModalContent>
            <ModalHeader className="flex items-center justify-between">
              <span>Sign Agreement</span>
              <Chip size="sm" className="bg-emerald-100 text-emerald-700 mr-8">
                Secure E-Signature
              </Chip>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <div className="bg-neutral-01 rounded-lg p-4 max-h-74 overflow-y-auto border border-neutral-02">
                  <p className="text-sm font-semibold mb-2">Advance Agreement Summary</p>
                  <p className="text-xs text-neutral-07 leading-relaxed">
                    This is a rent advance agreement between you (the Owner) and your Property Manager
                    facilitated by Ryse. By signing, you agree to receive ${parseInt(counterAmount || (advanceRequest.totalAmount || advanceRequest.requestedAmount || 0).toString()).toLocaleString()}
                    as an advance on your rental income.
                  </p>
                  <p className="text-xs text-neutral-07 mt-2 leading-relaxed">
                    The advance will be applied to your rental income over the term period.
                    Your property manager will continue to manage your property as usual.
                  </p>
                  <div className="mt-3 pt-3 border-t border-neutral-02">
                    <p className="text-xs font-medium text-neutral-07">Key Terms:</p>
                    <ul className="mt-1 space-y-1">
                      <li className="text-xs text-neutral-07">• Advance Amount: ${parseInt(counterAmount || (advanceRequest.totalAmount || advanceRequest.requestedAmount || 0).toString()).toLocaleString()}</li>
                      <li className="text-xs text-neutral-07">• Term: {advanceRequest.termMonths} months</li>
                      <li className="text-xs text-neutral-07">• Properties: {('properties' in advanceRequest && advanceRequest.properties) ? advanceRequest.properties.length : 0} included</li>
                      <li className="text-xs text-neutral-07">• Commission: 2% (paid by PM)</li>
                    </ul>
                  </div>
                </div>

                <Divider />

                {/* Signature Section */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-neutral-07 mb-2 block">
                      Type your full legal name to sign
                    </label>
                    <Input
                      placeholder="Enter your full name"
                      value={signatureName}
                      onValueChange={setSignatureName}
                      variant="bordered"
                      size="lg"
                      startContent={<Icon icon="solar:pen-2-linear" className="text-neutral-05" />}
                      description="This will be used as your electronic signature"
                    />
                  </div>

                  {signatureName && (
                    <div className="bg-gradient-to-br from-neutral-01 to-neutral-02 rounded-lg p-6 border-2 border-dashed border-neutral-03">
                      <p className="text-xs text-neutral-06 mb-2">Your Signature:</p>
                      <div className="h-16 flex items-center justify-left">
                        <p className="text-3xl font-signature text-neutral-08" style={{
                          fontFamily: "'Brush Script MT', 'Lucida Handwriting', 'Lucida Calligraphy', cursive",
                          transform: "rotate(-2deg)"
                        }}>
                          {signatureName}
                        </p>
                      </div>
                      <p className="text-xs text-neutral-06 mt-2">
                        Date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  )}

                  <Checkbox
                    isSelected={signatureConfirmed}
                    onValueChange={setSignatureConfirmed}
                    isDisabled={!signatureName}
                  >
                    <span className="text-sm">
                      I confirm this is my legal signature and I agree to the terms of this advance agreement
                    </span>
                  </Checkbox>

                  {signatureName && signatureConfirmed && (
                    <Alert
                      color="success"
                      description={
                        <div className="flex items-center gap-2">
                          <span className="text-xs">Your signature has been captured and will be legally binding upon submission</span>
                        </div>
                      }
                    />
                  )}
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onSignClose}>
                Back
              </Button>
              <Button
                className="bg-primary text-white"
                onPress={() => {
                  console.log("🔘 Sign button clicked");
                  handleDocumentSigning();
                }}
                isDisabled={!signatureName || !signatureConfirmed || isSigning || isSubmitting}
                isLoading={isSigning || isSubmitting}
                startContent={<Icon icon="solar:document-add-bold" />}
              >
                Sign & Submit Agreement
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Success Modal */}
        <Modal isOpen={isSuccessOpen} onClose={onSuccessClose} isDismissable={false}>
          <ModalContent>
            <ModalBody className="text-center py-8">
              <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon icon="solar:check-circle-bold" className="text-4xl text-success-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {responseType === "counter" ? "Counter Offer Submitted & Pre-Approved!" : "Response Submitted!"}
              </h3>

              {responseType === "counter" && (
                <div className="bg-primary-01 border border-primary-02 rounded-lg p-4 mb-4">
                  <p className="text-lg font-medium text-primary-07 mb-1">
                    Your Counter: ${parseInt(counterAmount).toLocaleString()}
                  </p>
                  <p className="text-xs text-primary-06">
                    You've pre-approved this amount
                  </p>
                </div>
              )}

              <p className="text-neutral-06 mb-4">
                {responseType === "accept" && "Your acceptance has been recorded. The advance will be reviewed and you'll receive funds within 2-3 business days after approval."}
                {responseType === "counter" && (
                  <>
                    <span className="font-medium">Your counter offer has been sent to {propertyManager?.company || 'your property manager'}.</span>
                    <br />
                    <span className="text-sm text-neutral-06 mt-2 block">
                      If they accept, funds will be automatically disbursed within 2-3 business days.
                    </span>
                  </>
                )}
                {responseType === "decline" && "You have declined this advance offer."}
              </p>

              {responseType === "counter" && (
                <Alert
                  color="primary"
                  className="mb-4"
                  description={
                    <div className="text-left">
                      <p className="text-xs font-medium mb-1">What happens next:</p>
                      <div className="space-y-1">
                        <div className="flex items-start gap-2">
                          <span className="text-xs">1.</span>
                          <span className="text-xs">PM reviews your counter</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-xs">2.</span>
                          <span className="text-xs">No action needed from you</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-xs">3.</span>
                          <span className="text-xs">Email notification sent with decision</span>
                        </div>
                      </div>
                    </div>
                  }
                />
              )}

              <p className="text-sm text-neutral-06 mb-4">
                You will receive an email confirmation shortly.
              </p>
              <Button
                className="bg-primary text-white"
                onPress={() => window.close()}
              >
                Close Window
              </Button>
            </ModalBody>
          </ModalContent>
        </Modal>
      </>
    </div>
  );
}

export default function OwnerAdvanceInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Spinner size="lg" />
        </div>
      }
    >
      <OwnerAdvanceInviteContent />
    </Suspense>
  );
}