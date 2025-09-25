"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Checkbox,
  Input,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner,
  Divider,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { AppLayout } from "@/components/layout/app-layout";
import { optimizePropertySelection } from "@/lib/advanceOptimizer";

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
  monthlyRent: number;
  leaseEndDate?: number;
  status: string;
  hasActiveAdvance?: boolean;
}

export default function AdvanceRequestPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [propertyManagerId, setPropertyManagerId] = useState<string | null>(null);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<Set<string>>(new Set());
  const [propertyTermMonths, setPropertyTermMonths] = useState<Record<string, number>>({});
  const [requestedAmount, setRequestedAmount] = useState<number>(0);
  const [termMonths, setTermMonths] = useState<number>(6);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [suggestedAmount, setSuggestedAmount] = useState<number>(0);
  const [suggestionMessage, setSuggestionMessage] = useState<string>("");
  const [showSuggestion, setShowSuggestion] = useState<boolean>(true);
  const [storedOptimization, setStoredOptimization] = useState<any>(null);
  const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();
  const { isOpen: isSuccessOpen, onOpen: onSuccessOpen, onClose: onSuccessClose } = useDisclosure();
  const { isOpen: isErrorOpen, onOpen: onErrorOpen, onClose: onErrorClose } = useDisclosure();

  const createAdvanceRequest = useMutation(api.advances.createAdvanceRequest);

  // Handle authentication
  useEffect(() => {
    const userData = sessionStorage.getItem("ryse-pm-user");
    if (!userData) {
      router.push("/login");
    } else {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setPropertyManagerId(parsedUser.id || parsedUser._id);
    }
  }, [router]);

  // Fetch properties
  const properties = useQuery(
    api.properties.getPropertiesWithDetails,
    propertyManagerId ? { propertyManagerId: propertyManagerId as Id<"propertyManagers"> } : "skip"
  );

  // Fetch owners
  const owners = useQuery(
    api.owners.getByPropertyManager,
    propertyManagerId ? { propertyManagerId: propertyManagerId as Id<"propertyManagers"> } : "skip"
  );

  // Get properties for selected owner
  const ownerProperties = useMemo(() => {
    if (!selectedOwnerId || !properties) return [];
    return properties.filter(p => p.ownerId === selectedOwnerId && p.status === "accepted");
  }, [selectedOwnerId, properties]);

  // Calculate eligible properties
  const eligibleProperties = useMemo(() => {
    return ownerProperties.filter(property => {
      if (property.hasActiveAdvance) return false;
      if (!property.leaseEndDate) return false;

      const now = Date.now();
      const monthsRemaining = Math.floor((property.leaseEndDate - now) / (30 * 24 * 60 * 60 * 1000));
      return monthsRemaining >= 2;
    });
  }, [ownerProperties]);

  // Calculate advance details
  const advanceCalculation = useMemo(() => {
    // Calculate max possible from all eligible properties (for display purposes)
    let maxPossibleAmount = 0;
    eligibleProperties.forEach(property => {
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

    // Calculate details for selected properties
    const selectedProps = eligibleProperties.filter(p => selectedPropertyIds.has(p._id));
    if (selectedProps.length === 0) {
      return {
        totalMonthlyRent: 0,
        maxAmount: maxPossibleAmount,
        suggestedAmount: 0,
        commissionAmount: 0,
        netToOwner: 0,
      };
    }

    let totalMonthlyRent = 0;
    let totalAdvanceAmount = 0;

    selectedProps.forEach(property => {
      const propertyMonths = propertyTermMonths[property._id] || termMonths;
      totalMonthlyRent += property.monthlyRent;
      totalAdvanceAmount += property.monthlyRent * propertyMonths * 0.9;
    });

    const suggestedAmount = totalAdvanceAmount;

    return {
      totalMonthlyRent,
      maxAmount: maxPossibleAmount,
      suggestedAmount,
      commissionAmount: suggestedAmount * 0.02,
      netToOwner: suggestedAmount,
    };
  }, [selectedPropertyIds, eligibleProperties, termMonths, propertyTermMonths]);

  // Handle owner selection
  const handleOwnerSelect = (ownerId: string) => {
    setSelectedOwnerId(ownerId);
    setSelectedPropertyIds(new Set());
    setPropertyTermMonths({});
    setRequestedAmount(0);
    setSuggestedAmount(0);
    setSuggestionMessage("");
    setTermMonths(6);
  };

  // Calculate suggestion when user types an amount
  const calculateSuggestion = (targetAmount: number) => {
    if (!targetAmount || targetAmount <= 0 || eligibleProperties.length === 0) {
      setSuggestedAmount(0);
      setSuggestionMessage("");
      setStoredOptimization(null);
      return null;
    }

    const result = optimizePropertySelection(eligibleProperties, targetAmount);

    if (result.selectedPropertyIds.size === 0) {
      setSuggestedAmount(0);
      setSuggestionMessage(result.message);
      setStoredOptimization(null);
      return null;
    }

    setSuggestedAmount(result.totalAmount);
    setSuggestionMessage(result.message);
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
    setRequestedAmount(suggestedAmount);

    // Clear suggestions after applying
    setSuggestedAmount(0);
    setSuggestionMessage("");
    setStoredOptimization(null);
  };

  // Handle property selection
  const handlePropertyToggle = (propertyId: string) => {
    const newSet = new Set(selectedPropertyIds);
    const newPropertyTermMonths = { ...propertyTermMonths };

    if (newSet.has(propertyId)) {
      newSet.delete(propertyId);
      // Remove custom months when deselecting
      delete newPropertyTermMonths[propertyId];
    } else {
      newSet.add(propertyId);
      // Find the property to check its max available months
      const property = eligibleProperties.find(p => p._id === propertyId);
      if (property && property.leaseEndDate) {
        const monthsRemaining = Math.min(11, Math.floor((property.leaseEndDate - Date.now()) / (30 * 24 * 60 * 60 * 1000)));
        // Use the lesser of default term months (6) or max available
        newPropertyTermMonths[propertyId] = Math.min(termMonths, monthsRemaining);
      } else {
        newPropertyTermMonths[propertyId] = termMonths;
      }
    }

    setPropertyTermMonths(newPropertyTermMonths);
    setSelectedPropertyIds(newSet);

    // Calculate and set default amount after property selection
    if (newSet.size > 0) {
      const selectedProps = eligibleProperties.filter(p => newSet.has(p._id));
      let totalAdvanceAmount = 0;

      selectedProps.forEach(property => {
        const propertyMonths = newPropertyTermMonths[property._id] || termMonths;
        totalAdvanceAmount += property.monthlyRent * propertyMonths * 0.9;
      });

      // Set the default requested amount
      setRequestedAmount(Math.floor(totalAdvanceAmount));
    } else {
      // Clear amount if no properties selected
      setRequestedAmount(0);
    }
  };

  // Update property term months
  const handlePropertyTermChange = (propertyId: string, months: number) => {
    const newPropertyTermMonths = { ...propertyTermMonths, [propertyId]: months };
    setPropertyTermMonths(newPropertyTermMonths);

    // Recalculate and update the default amount
    const selectedProps = eligibleProperties.filter(p => selectedPropertyIds.has(p._id));
    let totalAdvanceAmount = 0;

    selectedProps.forEach(property => {
      const propertyMonths = newPropertyTermMonths[property._id] || termMonths;
      totalAdvanceAmount += property.monthlyRent * propertyMonths * 0.9;
    });

    setRequestedAmount(Math.floor(totalAdvanceAmount));
  };

  // Handle sending advance request
  const handleSendRequest = async () => {
    if (!selectedOwnerId || selectedPropertyIds.size === 0 || !requestedAmount) return;

    setIsSending(true);
    try {
      // Calculate properties data for individual advances
      const selectedProps = eligibleProperties.filter(p => selectedPropertyIds.has(p._id));
      const commissionRate = 0.02; // 2% commission rate

      // Build properties array with individual amounts and terms
      const propertiesData = selectedProps.map(property => ({
        propertyId: property._id as Id<"properties">,
        amount: property.monthlyRent * (propertyTermMonths[property._id] || termMonths) * 0.9,
        termMonths: propertyTermMonths[property._id] || termMonths,
        monthlyRent: property.monthlyRent,
      }));

      // Create the advance request in the database
      const { token, groupId } = await createAdvanceRequest({
        propertyManagerId: propertyManagerId as Id<"propertyManagers">,
        ownerId: selectedOwnerId as Id<"owners">,
        properties: propertiesData,
        commissionRate,
      });

      // Get owner and property details for email
      const owner = owners?.find(o => o._id === selectedOwnerId);

      if (owner && user) {
        // Calculate average term months across selected properties
        const averageTermMonths = selectedProps.length > 0
          ? Math.round(selectedProps.reduce((sum, p) => sum + (propertyTermMonths[p._id] || termMonths), 0) / selectedProps.length)
          : termMonths;

        // Send the email
        const emailData = {
          to: owner.email,
          ownerName: owner.name,
          pmCompanyName: user.company,
          pmName: `${user.firstName} ${user.lastName}`,
          properties: selectedProps.map(p => ({
            address: p.address.unit
              ? `${p.address.street}, Unit ${p.address.unit}`
              : p.address.street,
            monthlyRent: p.monthlyRent,
            leaseEndDate: p.leaseEndDate
              ? new Date(p.leaseEndDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              : 'N/A',
            termMonths: propertyTermMonths[p._id] || termMonths, // Include individual property terms
          })),
          requestedAmount,
          termMonths: averageTermMonths, // Use average term months
          monthlyPayment: advanceCalculation?.totalMonthlyRent || 0,
          token,
        };

        await fetch('/api/advance-request/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailData),
        });
      }

      onPreviewClose();
      onSuccessOpen();
    } catch (error: any) {
      console.error('Error sending advance request:', error);
      onPreviewClose();

      // Set appropriate error message
      if (error.message?.includes('already a pending advance request')) {
        setErrorMessage('There is already a pending advance request for this owner. Please wait for them to respond or check the existing request status.');
      } else if (error.message) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Failed to send advance request. Please try again.');
      }

      onErrorOpen();
    } finally {
      setIsSending(false);
    }
  };

  if (!propertyManagerId || !user) {
    return (
      <AppLayout user={user}>
        <div className="flex items-center justify-center min-h-screen">
          <Spinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout user={user}>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Send Advance Request</h1>
            <p className="text-sm text-neutral-06 mt-1">
              Offer rent advances to your property owners
            </p>
          </div>
          <Button
            variant="light"
            startContent={<Icon icon="solar:arrow-left-linear" />}
            onPress={() => router.push('/advances')}
          >
            Back to Advances
          </Button>
        </div>

        {/* Step 1: Select Owner */}
        <Card>
          <CardHeader className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-01 text-primary-06">
              1
            </div>
            <h2 className="text-lg font-semibold">Select Owner</h2>
          </CardHeader>
          <CardBody>
            <Select
              label="Choose an owner"
              placeholder="Select an owner to send advance request"
              selectedKeys={selectedOwnerId ? [selectedOwnerId] : []}
              onSelectionChange={(keys) => handleOwnerSelect(Array.from(keys)[0] as string)}
              startContent={<Icon icon="solar:user-bold" />}
            >
              {(owners || []).map((owner) => (
                <SelectItem
                  key={owner._id}
                  textValue={owner.name}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{owner.name}</p>
                      <p className="text-xs text-neutral-05">{owner.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{owner.propertyCount} properties</p>
                      <p className="text-xs text-neutral-05">
                        ${owner.totalMonthlyRent?.toLocaleString()}/mo
                      </p>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </Select>
          </CardBody>
        </Card>

        {/* Step 2: Select Properties */}
        {selectedOwnerId && (
          <Card>
            <CardHeader className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-01 text-primary-06">
                2
              </div>
              <h2 className="text-lg font-semibold">Select Properties</h2>
              {eligibleProperties.length > 0 && (
                <Chip size="sm" className="ml-auto bg-primary-01 text-primary-06">
                  {eligibleProperties.length} eligible
                </Chip>
              )}
            </CardHeader>
            <CardBody className="max-h-[500px] overflow-auto">
              {eligibleProperties.length === 0 ? (
                <div className="text-center py-8">
                  <Icon icon="solar:home-smile-broken" className="text-4xl text-neutral-04 mx-auto mb-2" />
                  <p className="text-neutral-06">No eligible properties for this owner</p>
                  <p className="text-sm text-neutral-05 mt-1">
                    Properties must be accepted, have at least 2 months remaining on lease, and no active advances
                  </p>
                </div>
              ) : (
                <Table
                  aria-label="Properties table"
                  selectionMode="none"
                  removeWrapper
                  isHeaderSticky
                  className="max-h-[450px]"
                >
                  <TableHeader>
                    <TableColumn>
                      <Checkbox
                        isSelected={selectedPropertyIds.size === eligibleProperties.length && eligibleProperties.length > 0}
                        isIndeterminate={selectedPropertyIds.size > 0 && selectedPropertyIds.size < eligibleProperties.length}
                        onValueChange={(isSelected) => {
                          if (isSelected) {
                            const allSelected = new Set(eligibleProperties.map(p => p._id));
                            setSelectedPropertyIds(allSelected);
                            // Set default term months for all properties
                            const newPropertyTermMonths: Record<string, number> = {};
                            let totalAdvanceAmount = 0;
                            eligibleProperties.forEach(p => {
                              // Check max available months for each property
                              let propertyMonths = termMonths;
                              if (p.leaseEndDate) {
                                const monthsRemaining = Math.min(11, Math.floor((p.leaseEndDate - Date.now()) / (30 * 24 * 60 * 60 * 1000)));
                                // Use the lesser of default term months (6) or max available
                                propertyMonths = Math.min(termMonths, monthsRemaining);
                              }
                              newPropertyTermMonths[p._id] = propertyMonths;
                              totalAdvanceAmount += p.monthlyRent * propertyMonths * 0.9;
                            });
                            setPropertyTermMonths(newPropertyTermMonths);
                            // Set the default requested amount
                            setRequestedAmount(Math.floor(totalAdvanceAmount));
                          } else {
                            setSelectedPropertyIds(new Set());
                            setPropertyTermMonths({});
                            setRequestedAmount(0);
                          }
                        }}
                        aria-label="Select all properties"
                      />
                    </TableColumn>
                    <TableColumn>Property</TableColumn>
                    <TableColumn>Monthly Rent</TableColumn>
                    <TableColumn>Advance Months</TableColumn>
                    <TableColumn>Advance Amount</TableColumn>
                    <TableColumn>Max Available</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {eligibleProperties.map((property) => {
                      const now = Date.now();
                      const monthsRemaining = property.leaseEndDate
                        ? Math.min(11, Math.floor((property.leaseEndDate - now) / (30 * 24 * 60 * 60 * 1000)))
                        : 0;
                      const propertyMonths = propertyTermMonths[property._id] || termMonths;
                      const propertyAdvanceAmount = property.monthlyRent * propertyMonths * 0.9;

                      return (
                        <TableRow key={property._id}>
                          <TableCell>
                            <Checkbox
                              isSelected={selectedPropertyIds.has(property._id)}
                              onValueChange={() => handlePropertyToggle(property._id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{property.address.street}</p>
                              <p className="text-xs text-neutral-05">
                                {property.address.unit ? `Unit ${property.address.unit}, ` : ''}{property.address.city}, {property.address.state}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>${property.monthlyRent.toLocaleString()}</TableCell>
                          <TableCell>
                            {selectedPropertyIds.has(property._id) ? (
                              <Select
                                size="sm"
                                selectedKeys={[propertyMonths.toString()]}
                                onSelectionChange={(keys) => {
                                  const months = parseInt(Array.from(keys)[0] as string);
                                  handlePropertyTermChange(property._id, months);
                                }}
                                className="w-24"
                                aria-label="Select advance months"
                              >
                                {Array.from({ length: monthsRemaining - 1 }, (_, i) => i + 2).map(months => (
                                  <SelectItem key={months.toString()} textValue={`${months} mo`}>
                                    {months} mo
                                  </SelectItem>
                                ))}
                              </Select>
                            ) : (
                              <span className="text-sm text-neutral-05">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {selectedPropertyIds.has(property._id) ? (
                              <span className="font-medium">${Math.floor(propertyAdvanceAmount).toLocaleString()}</span>
                            ) : (
                              <span className="text-sm text-neutral-05">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip size="sm" variant="flat" className="bg-neutral-01">
                              {monthsRemaining} mo / ${Math.floor(property.monthlyRent * monthsRemaining * 0.9).toLocaleString()}
                            </Chip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardBody>
          </Card>
        )}

        {/* Step 3: Configure Advance */}
        {selectedOwnerId && eligibleProperties.length > 0 && (
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-01 text-primary-06">
                  3
                </div>
                <h2 className="text-lg font-semibold">Configure Advance</h2>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="flat"
                  onPress={() => {
                    // Set all properties to minimum (2 months)
                    const newTerms: Record<string, number> = {};
                    let totalAdvanceAmount = 0;
                    eligibleProperties.filter(p => selectedPropertyIds.has(p._id)).forEach(p => {
                      newTerms[p._id] = 2;
                      totalAdvanceAmount += p.monthlyRent * 2 * 0.9;
                    });
                    setPropertyTermMonths(newTerms);
                    // Update the requested amount with new calculation
                    setRequestedAmount(Math.floor(totalAdvanceAmount));
                  }}
                >
                  Set All to Min
                </Button>
                <Button
                  size="sm"
                  variant="flat"
                  onPress={() => {
                    // Set all properties to their maximum available months
                    const newTerms: Record<string, number> = {};
                    let totalAdvanceAmount = 0;
                    eligibleProperties.filter(p => selectedPropertyIds.has(p._id)).forEach(p => {
                      let maxMonths: number;
                      if (p.leaseEndDate) {
                        const monthsRemaining = Math.floor((p.leaseEndDate - Date.now()) / (30 * 24 * 60 * 60 * 1000));
                        // Cap at 11 months max and ensure at least 2 months
                        maxMonths = Math.min(11, Math.max(2, monthsRemaining));
                      } else {
                        maxMonths = 11;
                      }
                      newTerms[p._id] = maxMonths;
                      totalAdvanceAmount += p.monthlyRent * maxMonths * 0.9;
                    });
                    setPropertyTermMonths(newTerms);
                    // Update the requested amount with new calculation
                    setRequestedAmount(Math.floor(totalAdvanceAmount));
                  }}
                >
                  Set All to Max
                </Button>
              </div>
            </CardHeader>
            <CardBody className="space-y-6">
              <div className="space-y-4">
                {/* Summary of selected properties and terms */}
                <div className="bg-neutral-01 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Selected Properties</span>
                    <span className="text-sm font-semibold">{selectedPropertyIds.size}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average Term</span>
                    <span className="text-sm font-semibold">
                      {(() => {
                        const selectedProps = eligibleProperties.filter(p => selectedPropertyIds.has(p._id));
                        const avgMonths = selectedProps.length > 0
                          ? Math.round(selectedProps.reduce((sum, p) => sum + (propertyTermMonths[p._id] || termMonths), 0) / selectedProps.length)
                          : 0;
                        return `${avgMonths} months`;
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Monthly Rent</span>
                    <span className="text-sm font-semibold">${advanceCalculation.totalMonthlyRent.toLocaleString()}</span>
                  </div>
                </div>

                {/* Total Advance Amount Input */}
                <div>
                  <label className="block text-sm font-medium mb-2">Total Advance Amount</label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Enter target amount (e.g., 50,000)"
                      value={requestedAmount > 0 ? requestedAmount.toLocaleString() : ''}
                      onValueChange={(value) => {
                        // Remove commas and parse as number
                        const numValue = parseInt(value.replace(/,/g, '')) || 0;

                        // Always set the requested amount
                        setRequestedAmount(numValue);

                        // Show suggestions and calculate
                        setShowSuggestion(true);

                        // Always calculate suggestion when typing
                        if (numValue > 0) {
                          calculateSuggestion(numValue);
                        } else {
                          setSuggestedAmount(0);
                          setSuggestionMessage("");
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
                      color={requestedAmount > advanceCalculation.maxAmount ? "danger" : "default"}
                      classNames={{
                        input: "text-xl font-semibold outline-none focus:outline-none",
                        inputWrapper: `${
                          requestedAmount > advanceCalculation.maxAmount
                            ? "bg-red-50 border-red-300 hover:border-red-400 border-2 group-data-[focused=true]:border-red-400"
                            : "bg-neutral-01 border-neutral-02 hover:border-neutral-03 border-1 group-data-[focused=true]:border-neutral-03"
                        }`,
                        innerWrapper: "bg-transparent",
                      }}
                    />

                    {/* Auto-suggestion dropdown - positioned right at the bottom */}
                    {showSuggestion && suggestedAmount > 0 && requestedAmount > 0 && (
                      <div
                        className={`absolute left-0 right-0 top-full z-50 bg-white shadow-md rounded-lg mt-1 overflow-hidden ${
                          requestedAmount > advanceCalculation.maxAmount
                            ? "border border-red-300"
                            : "border border-neutral-02"
                        }`}
                      >
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
                                {suggestedAmount === requestedAmount
                                  ? "Exact match - covers full months of rent"
                                  : suggestedAmount > requestedAmount
                                  ? `Optimized to full months • $${(suggestedAmount - requestedAmount).toLocaleString()} above target`
                                  : "Adjusted to complete rental months"}
                              </p>
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

                  {/* Show message when no suggestion is available */}
                  {suggestionMessage && suggestedAmount === 0 && selectedPropertyIds.size === 0 && (
                    <div className="mt-2">
                      <Chip variant="flat" className="w-full bg-warning-50 text-warning-700">
                        {suggestionMessage}
                      </Chip>
                    </div>
                  )}

                  {/* Error message if amount exceeds max */}
                  {requestedAmount > advanceCalculation.maxAmount && selectedPropertyIds.size === 0 && suggestedAmount === 0 && (
                    <div className="mt-2">
                      <Chip variant="flat" className="w-full bg-danger-50 text-danger-700">
                        Maximum available: ${Math.floor(advanceCalculation.maxAmount).toLocaleString()}
                      </Chip>
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-neutral-05">
                      {selectedPropertyIds.size > 0
                        ? `${selectedPropertyIds.size} properties selected • Each covering full rental months`
                        : "Advances must be in complete monthly increments"}
                    </p>
                    <p className="text-xs text-neutral-05">
                      Max: ${Math.floor(advanceCalculation.maxAmount).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="space-y-4 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Advance Offer Card */}
                  <div className={`text-center p-6 rounded-2xl border-2 ${
                    requestedAmount > advanceCalculation.maxAmount
                      ? "bg-red-50 border-red-200"
                      : "bg-primary-01 border-primary-02"
                  }`}>
                    <p className={`text-sm font-medium mb-2 ${
                      requestedAmount > advanceCalculation.maxAmount
                        ? "text-red-700"
                        : "text-primary-06"
                    }`}>
                      ADVANCE OFFER
                    </p>
                    <p className={`text-4xl font-bold ${
                      requestedAmount > advanceCalculation.maxAmount
                        ? "text-red-700"
                        : "text-primary-06"
                    }`}>
                      ${requestedAmount.toLocaleString()}
                    </p>
                    {requestedAmount > advanceCalculation.maxAmount && (
                      <p className="text-xs text-red-600 mt-2">
                        Exceeds maximum available
                      </p>
                    )}
                  </div>

                  {/* Commission Card */}
                  <div className={`text-center p-6 rounded-2xl border-2 ${
                    requestedAmount > advanceCalculation.maxAmount
                      ? "bg-red-50 border-red-200"
                      : "bg-secondary-01 border-secondary-02"
                  }`}>
                    <p className={`text-sm font-medium mb-2 ${
                      requestedAmount > advanceCalculation.maxAmount
                        ? "text-red-700"
                        : "text-secondary-08"
                    }`}>
                      YOUR COMMISSION
                    </p>
                    <p className={`text-4xl font-bold ${
                      requestedAmount > advanceCalculation.maxAmount
                        ? "text-red-700"
                        : "text-secondary-08"
                    }`}>
                      ${Math.floor(requestedAmount * 0.02).toLocaleString()}
                    </p>
                    {requestedAmount > advanceCalculation.maxAmount && (
                      <p className="text-xs text-red-600 mt-2">
                        Not achievable
                      </p>
                    )}
                  </div>
                </div>

                <div className={`text-center text-sm ${
                  requestedAmount > advanceCalculation.maxAmount
                    ? "text-red-600 font-semibold"
                    : "text-neutral-06"
                }`}>
                  <span className={`font-medium ${
                    requestedAmount > advanceCalculation.maxAmount ? "text-red-700" : ""
                  }`}>
                    {Math.round((requestedAmount / advanceCalculation.maxAmount) * 100)}%
                  </span>
                  {" of maximum "}
                  <span className="font-medium">${Math.floor(advanceCalculation.maxAmount).toLocaleString()}</span>
                  {" available"}
                  {requestedAmount > advanceCalculation.maxAmount && (
                    <div className="mt-2 text-red-600">
                      <Icon icon="solar:danger-triangle-bold" className="inline mr-1" />
                      Amount exceeds maximum by ${(requestedAmount - advanceCalculation.maxAmount).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              <Button
                className="bg-primary text-white w-full"
                size="lg"
                onPress={onPreviewOpen}
                isDisabled={!requestedAmount || selectedPropertyIds.size === 0 || requestedAmount > advanceCalculation.maxAmount}
                startContent={<Icon icon="solar:eye-linear" />}
              >
                Preview & Send Request
              </Button>
            </CardBody>
          </Card>
        )}

        {/* Preview Modal */}
        <Modal isOpen={isPreviewOpen} onClose={onPreviewClose} size="2xl">
          <ModalContent>
            <ModalHeader>Preview Advance Request</ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <div className="bg-primary-01 border border-primary-02 rounded-lg p-4">
                  <p className="text-sm text-primary-06 mb-1">Advance Offer</p>
                  <p className="text-2xl font-bold text-primary-07">
                    ${requestedAmount.toLocaleString()}
                  </p>
                  <p className="text-sm text-primary-06 mt-1">
                    {termMonths} months of rent upfront
                  </p>
                </div>

                <div>
                  <p className="font-medium mb-2">Owner Details</p>
                  <div className="bg-neutral-01 rounded-lg p-3">
                    {owners?.find(o => o._id === selectedOwnerId) && (
                      <>
                        <p>{owners.find(o => o._id === selectedOwnerId)?.name}</p>
                        <p className="text-sm text-neutral-05">
                          {owners.find(o => o._id === selectedOwnerId)?.email}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <p className="font-medium mb-2">Selected Properties</p>
                  <div className="space-y-2">
                    {eligibleProperties
                      .filter(p => selectedPropertyIds.has(p._id))
                      .map(property => (
                        <div key={property._id} className="bg-neutral-01 rounded-lg p-3">
                          <p className="font-medium">{property.address.street}</p>
                          <p className="text-xs text-neutral-05">
                            {property.address.unit && `Unit ${property.address.unit}`}
                          </p>
                          <p className="text-sm text-neutral-06 mt-1">
                            ${property.monthlyRent.toLocaleString()}/mo
                          </p>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
                  <p className="text-sm text-warning-700">
                    This will send an email invitation to the owner. They will have 7 days to respond.
                    The advance is subject to final approval after owner acceptance.
                  </p>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onPreviewClose}>
                Cancel
              </Button>
              <Button
                className="bg-primary text-white"
                onPress={handleSendRequest}
                isLoading={isSending}
              >
                Send Advance Request
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Success Modal */}
        <Modal isOpen={isSuccessOpen} onClose={onSuccessClose}>
          <ModalContent>
            <ModalBody className="text-center py-8">
              <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon icon="solar:check-circle-bold" className="text-3xl text-success-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Request Sent Successfully!</h3>
              <p className="text-neutral-06 mb-6">
                The advance request has been sent to the owner's email.
                They have 7 days to respond.
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="light"
                  onPress={() => {
                    onSuccessClose();
                    router.push('/advances');
                  }}
                >
                  Back to Advances
                </Button>
                <Button
                  className="bg-primary text-white"
                  onPress={() => {
                    onSuccessClose();
                    setSelectedOwnerId("");
                    setSelectedPropertyIds(new Set());
                    setRequestedAmount(0);
                    setTermMonths(6);
                  }}
                >
                  Send Another Request
                </Button>
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Error Modal */}
        <Modal isOpen={isErrorOpen} onClose={onErrorClose}>
          <ModalContent>
            <ModalBody className="text-center py-8">
              <div className="w-16 h-16 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon icon="solar:danger-triangle-bold" className="text-3xl text-danger-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Unable to Send Request</h3>
              <p className="text-neutral-06 mb-6">{errorMessage}</p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="light"
                  onPress={() => {
                    onErrorClose();
                    router.push('/advances');
                  }}
                >
                  Back to Advances
                </Button>
                <Button
                  className="bg-primary text-white"
                  onPress={() => {
                    onErrorClose();
                    setErrorMessage("");
                  }}
                >
                  Try Again
                </Button>
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>
      </div>
    </AppLayout>
  );
}