"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Spinner,
  Button,
  Chip,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Tab,
  Tabs,
  Avatar,
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
import { getInitials } from "@/lib/utils";
import StreetView from "@/components/property/street-view";

export default function PropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as Id<"properties">;
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isOpen: isAdvanceOpen, onOpen: onAdvanceOpen, onClose: onAdvanceClose } = useDisclosure();

  // Handle authentication check
  useEffect(() => {
    const userData = sessionStorage.getItem("ryse-pm-user");
    if (!userData) {
      router.push("/login");
    } else {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    }
    setIsLoading(false);
  }, [router]);

  // Fetch property details
  const property = useQuery(
    api.properties.getPropertyById,
    { propertyId }
  );

  // Fetch advance history for this property
  const advanceHistory = useQuery(
    api.advances.getPropertyAdvanceHistory,
    property ? { propertyId } : "skip"
  );

  if (isLoading) {
    return (
      <AppLayout user={user}>
        <div className="flex items-center justify-center min-h-screen">
          <Spinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (!property) {
    return (
      <AppLayout user={user}>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="max-w-md">
            <CardBody className="text-center py-10">
              <Icon
                icon="solar:home-2-bold"
                className="w-16 h-16 mx-auto mb-4 text-neutral-06"
              />
              <h2 className="text-2xl font-semibold mb-2">
                Property Not Found
              </h2>
              <p className="text-neutral-06 mb-6">
                The property you're looking for doesn't exist or has been removed.
              </p>
              <Button
                className="bg-primary text-white"
                startContent={<Icon icon="solar:arrow-left-bold" />}
                onPress={() => router.push("/properties")}
              >
                Back to Properties
              </Button>
            </CardBody>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const currentAdvance = advanceHistory?.active;
  const totalAdvanced = advanceHistory?.totalAdvanced || 0;

  return (
    <AppLayout user={user}>
      <div>
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-neutral-06 mb-2">
              <Button
                size="sm"
                variant="light"
                startContent={<Icon icon="solar:arrow-left-linear" />}
                onPress={() => router.push("/properties")}
                className="px-2"
              >
                Properties
              </Button>
              <Icon icon="solar:alt-arrow-right-linear" className="w-4 h-4" />
              <span>{property.propertyName || property.address.street}</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">
              {property.propertyName || property.address.street}
            </h1>
            <p className="text-neutral-06">
              {property.address.unit && `Unit ${property.address.unit}, `}
              {property.address.city}, {property.address.state} {property.address.zipCode}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="bordered"
              startContent={<Icon icon="solar:pen-linear" />}
              onPress={() => router.push(`/properties/${propertyId}/edit`)}
            >
              Edit Property
            </Button>
            <Button
              className="bg-primary text-white"
              startContent={<Icon icon="solar:dollar-linear" />}
              onPress={onAdvanceOpen}
            >
              Request Advance
            </Button>
          </div>
        </div>

        {/* Street View */}
        <div className="mb-8">
          <StreetView
            address={{
              street: property.address.street,
              city: property.address.city,
              state: property.address.state,
              zipCode: property.address.zipCode,
            }}
            className="shadow-lg"
          />
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-01 rounded-lg">
                  <Icon icon="solar:dollar-bold" className="text-primary-06 w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-neutral-06">Monthly Rent</p>
                  <p className="text-xl font-bold">${Math.round(property.monthlyRent).toLocaleString()}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary-01 rounded-lg">
                  <Icon icon="solar:shield-check-bold" className="text-secondary-06 w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-neutral-06">Security Deposit</p>
                  <p className="text-xl font-bold">${Math.round(property.securityDeposit).toLocaleString()}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-tertiary-01 rounded-lg">
                  <Icon icon="solar:home-2-bold" className="text-tertiary-06 w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-neutral-06">Property Type</p>
                  <p className="text-xl font-bold">
                    {property?.propertyType?.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) || "N/A"}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-quaternary-01 rounded-lg">
                  <Icon icon="solar:hand-money-bold" className="text-quaternary-06 w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-neutral-06">
                    {currentAdvance ? "Active Advance" : "Total Advanced"}
                  </p>
                  <p className="text-xl font-bold">
                    ${currentAdvance ? (Math.round(currentAdvance.remainingBalance || currentAdvance.amount).toLocaleString()) : Math.round(totalAdvanced).toLocaleString()}
                  </p>
                  {currentAdvance && (
                    <p className="text-xs text-neutral-05">
                      {currentAdvance.termMonths - (currentAdvance.monthsUtilized || 0)} months left
                    </p>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Tabs for different sections */}
        <Tabs aria-label="Property sections" className="mb-6">
          <Tab key="details" title="Details">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              {/* Property Information */}
              <Card className="lg:col-span-2">
                <CardHeader className="px-6 py-4">
                  <h3 className="text-lg font-semibold">Property Information</h3>
                </CardHeader>
                <Divider />
                <CardBody className="gap-6 p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-neutral-06 mb-1">Property Type</p>
                      <Chip
                        size="sm"
                        variant="flat"
                        className={
                          property.propertyType === "single_family" ? "bg-tertiary-01 text-tertiary-06" :
                          property.propertyType === "multi_family" ? "bg-secondary-01 text-secondary-06" :
                          property.propertyType === "condo" ? "bg-primary-01 text-primary-06" :
                          property.propertyType === "townhouse" ? "bg-quaternary-01 text-quaternary-06" :
                          "bg-neutral-02 text-neutral-06"
                        }
                      >
                        {property.propertyType.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </Chip>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-06 mb-1">Status</p>
                      <StatusBadge status={property.status} />
                      {property.status === "rejected" && property.rejectionNotes && (
                        <p className="text-xs text-danger mt-1">{property.rejectionNotes}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-neutral-06 mb-1">Bedrooms</p>
                      <p className="font-medium">{property.bedrooms || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-06 mb-1">Bathrooms</p>
                      <p className="font-medium">{property.bathrooms || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-06 mb-1">Square Feet</p>
                      <p className="font-medium">{property.squareFeet?.toLocaleString() || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-06 mb-1">Year Built</p>
                      <p className="font-medium">{property.yearBuilt || "N/A"}</p>
                    </div>
                  </div>

                  {/* Lease Information */}
                  <div>
                    <h4 className="font-medium mb-3">Lease Information</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-neutral-06 mb-1">Lease Start</p>
                        <p className="font-medium">
                          {property.leaseStartDate
                            ? new Date(property.leaseStartDate).toLocaleDateString()
                            : "Not set"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-06 mb-1">Lease End</p>
                        <p className="font-medium">
                          {property.leaseEndDate
                            ? new Date(property.leaseEndDate).toLocaleDateString()
                            : "Not set"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Financial Information */}
                  <div>
                    <h4 className="font-medium mb-3">Financial Information</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-neutral-06 mb-1">Purchase Price</p>
                        <p className="font-medium">
                          {property.purchasePrice
                            ? `$${property.purchasePrice.toLocaleString()}`
                            : "Not set"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-06 mb-1">Purchase Date</p>
                        <p className="font-medium">
                          {property.purchaseDate
                            ? new Date(property.purchaseDate).toLocaleDateString()
                            : "Not set"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-06 mb-1">Estimated Value</p>
                        <p className="font-medium">
                          {property.estimatedValue
                            ? `$${property.estimatedValue.toLocaleString()}`
                            : "Not set"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-06 mb-1">Occupancy Status</p>
                        <p className="font-medium">
                          {property.occupancyStatus?.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) || "Not set"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Owner Information */}
              <Card>
                <CardHeader className="px-6 py-4">
                  <h3 className="text-lg font-semibold">Owner Information</h3>
                </CardHeader>
                <Divider />
                <CardBody className="p-6">
                  {property.owner ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={getInitials(property.owner.name)}
                          size="lg"
                          className="bg-secondary-02"
                        />
                        <div>
                          <p className="font-medium">{property.owner.name}</p>
                          <p className="text-sm text-neutral-06">Property Owner</p>
                        </div>
                      </div>
                      <Divider />
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-neutral-06 mb-1">Email</p>
                          <p className="font-medium">{property.owner.email}</p>
                        </div>
                        {property.owner.phone && (
                          <div>
                            <p className="text-sm text-neutral-06 mb-1">Phone</p>
                            <p className="font-medium">{property.owner.phone}</p>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="bordered"
                        className="w-full"
                        startContent={<Icon icon="solar:letter-linear" />}
                      >
                        Contact Owner
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Icon
                        icon="solar:user-cross-linear"
                        className="w-12 h-12 mx-auto mb-3 text-neutral-04"
                      />
                      <p className="text-neutral-06">No owner assigned</p>
                      <Button
                        size="sm"
                        variant="light"
                        className="mt-3"
                        startContent={<Icon icon="solar:add-circle-linear" />}
                      >
                        Add Owner
                      </Button>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          </Tab>


          <Tab key="advances" title={`Advances (${advanceHistory?.all?.length || 0})`}>
            <Card className="mt-6">
              <CardBody>
                {/* Current Active Advance */}
                {currentAdvance && (
                  <div className="mb-6 p-4 bg-primary-01 border border-primary-03 rounded-lg">
                    <h4 className="font-semibold mb-3 text-primary-07">Current Active Advance</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-primary-06">Amount</p>
                        <p className="text-xl font-bold text-primary-07">
                          ${Math.round(currentAdvance.amount).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-primary-06">Term</p>
                        <p className="text-lg font-medium text-primary-07">
                          {currentAdvance.termMonths} months
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-primary-06">Utilized</p>
                        <p className="text-lg font-medium text-primary-07">
                          {currentAdvance.monthsUtilized} / {currentAdvance.termMonths} months
                        </p>
                      </div>
                    </div>
                    {advanceHistory?.currentUtilization && (
                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-primary-06">Progress</span>
                          <span className="text-primary-07 font-medium">
                            {Math.round(advanceHistory.currentUtilization.percentUtilized)}%
                          </span>
                        </div>
                        <div className="w-full bg-primary-02 rounded-full h-2">
                          <div
                            className="bg-primary-06 h-2 rounded-full transition-all"
                            style={{ width: `${advanceHistory.currentUtilization.percentUtilized}%` }}
                          />
                        </div>
                        <p className="text-xs text-primary-06 mt-1">
                          ${Math.round(advanceHistory.currentUtilization.remainingBalance).toLocaleString()} remaining
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Advance History */}
                {advanceHistory && (advanceHistory.historical.length > 0 || advanceHistory.pending.length > 0) ? (
                  <div className="space-y-4">
                    {/* Pending Advances */}
                    {advanceHistory.pending.length > 0 && (
                      <>
                        <h4 className="font-semibold text-neutral-07">Pending Advances</h4>
                        {advanceHistory.pending.map((advance: any) => (
                          <div key={advance._id} className="p-4 border border-warning-200 bg-warning-50 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <p className="font-medium text-lg">${Math.round(advance.amount).toLocaleString()}</p>
                                  <Chip size="sm" className="bg-warning-100 text-warning-700">
                                    {advance.status}
                                  </Chip>
                                </div>
                                <p className="text-sm text-neutral-06">
                                  {advance.termMonths} month advance • Requested {new Date(advance.requestedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {/* Historical Advances */}
                    {advanceHistory.historical.length > 0 && (
                      <>
                        <h4 className="font-semibold text-neutral-07">Previous Advances</h4>
                        {advanceHistory.historical.map((advance: any) => (
                          <div key={advance._id} className="p-4 border rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <p className="font-medium text-lg">${Math.round(advance.amount).toLocaleString()}</p>
                                  <Chip
                                    size="sm"
                                    variant="flat"
                                    className={
                                      advance.status === "completed" ? "bg-success-50 text-success-600" :
                                      advance.status === "declined" ? "bg-danger-50 text-danger-600" :
                                      "bg-neutral-02 text-neutral-06"
                                    }
                                  >
                                    {advance.status}
                                  </Chip>
                                </div>
                                <p className="text-sm text-neutral-06">
                                  {advance.termMonths} month advance
                                  {advance.completedAt && ` • Completed ${new Date(advance.completedAt).toLocaleDateString()}`}
                                  {advance.status === "completed" && advance.monthsUtilized &&
                                    ` • Fully utilized (${advance.monthsUtilized} months)`}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                ) : !currentAdvance ? (
                  <div className="text-center py-12">
                    <Icon
                      icon="solar:hand-money-linear"
                      className="w-16 h-16 mx-auto mb-4 text-neutral-04"
                    />
                    <p className="text-neutral-06 mb-4">No advances for this property</p>
                    <Button
                      className="bg-primary text-white"
                      startContent={<Icon icon="solar:dollar-linear" />}
                      onPress={onAdvanceOpen}
                    >
                      Request Advance
                    </Button>
                  </div>
                ) : null}
              </CardBody>
            </Card>
          </Tab>
        </Tabs>

        {/* Request Advance Modal */}
        <Modal isOpen={isAdvanceOpen} onClose={onAdvanceClose} size="lg">
          <ModalContent>
            <ModalHeader>Request Advance</ModalHeader>
            <ModalBody>
              <p>Advance request form will be implemented here</p>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onAdvanceClose}>
                Cancel
              </Button>
              <Button className="bg-primary text-white">
                Submit Request
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </AppLayout>
  );
}