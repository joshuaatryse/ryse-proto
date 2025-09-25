"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { AppLayout } from "@/components/layout/app-layout";
import StatusBadge from "@/components/ui/status-badge";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Progress } from "@heroui/progress";
import { Input } from "@heroui/input";
import { Icon } from "@iconify/react";
import { Alert } from "@heroui/alert";
import { Spinner } from "@heroui/spinner";
import { Select, SelectItem } from "@heroui/select";

export default function PropertyManagerDashboard() {
  const router = useRouter();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [showIntegrationAlert, setShowIntegrationAlert] = useState(true);
  const [requestAmount, setRequestAmount] = useState("");
  const [selectedProperty, setSelectedProperty] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [propertyManagerId, setPropertyManagerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnablingSync, setIsEnablingSync] = useState(false);
  const [syncProgress, setSyncProgress] = useState<string | null>(null);

  const updateIntegrationStatus = useMutation(api.propertyManagers.updateIntegrationStatus);
  const syncProperties = useMutation(api.syncProperties.syncProperties);

  // Handle authentication check
  useEffect(() => {
    const userData = sessionStorage.getItem("ryse-pm-user");
    if (!userData) {
      router.push("/login");
    } else {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setPropertyManagerId(parsedUser.id || parsedUser._id);
    }
    setIsLoading(false);
  }, [router]);

  // Fetch property manager data
  const propertyManager = useQuery(
    api.propertyManagers.getById,
    propertyManagerId ? { id: propertyManagerId as Id<"propertyManagers"> } : "skip"
  );

  // Fetch property statistics
  const propertyStats = useQuery(
    api.properties.getStats,
    propertyManagerId ? { propertyManagerId: propertyManagerId as Id<"propertyManagers"> } : "skip"
  );

  // Fetch properties with details (for recent advances)
  const properties = useQuery(
    api.properties.getPropertiesWithDetails,
    propertyManagerId ? { propertyManagerId: propertyManagerId as Id<"propertyManagers"> } : "skip"
  );

  // Fetch all advances
  const advances = useQuery(
    api.advances.getAdvancesByPropertyManager,
    propertyManagerId ? {
      propertyManagerId: propertyManagerId as Id<"propertyManagers">,
      includeRepaid: true
    } : "skip"
  );

  // Calculate metrics from real data
  const metrics = React.useMemo(() => {
    if (!propertyStats || !advances) return [];

    // Calculate total commission from ALL disbursed and repaid advances
    const totalCommission = advances
      ?.filter((a: any) => a.status === "disbursed" || a.status === "repaid")
      ?.reduce((sum: number, a: any) => sum + (a.commissionAmount || 0), 0) || 0;

    // Calculate currently outstanding advances (only disbursed, not approved)
    const totalOutstanding = advances
      ?.filter((a: any) => a.status === "disbursed")
      ?.reduce((sum: number, a: any) => sum + (a.remainingBalance || a.amount), 0) || 0;

    // Calculate total potential advance capacity based on properties
    // Assuming each property can get up to 11 months rent at 90% LTV
    const totalPotentialAdvance = properties
      ?.filter((p: any) => p.status === "accepted")
      ?.reduce((sum: number, p: any) => {
        const monthlyRent = p.monthlyRent || 0;
        const maxAdvance = monthlyRent * 11 * 0.9; // 11 months at 90% LTV
        return sum + maxAdvance;
      }, 0) || 0;

    // Available advances = total potential - currently outstanding
    const availableCredit = Math.max(0, totalPotentialAdvance - totalOutstanding);

    // Check if there are properties for display logic
    const hasProperties = propertyStats.total > 0;

    // Calculate active advance count
    const activeAdvanceCount = advances?.filter((a: any) =>
      a.status === "disbursed" || a.status === "approved"
    ).length || 0;

    // Calculate total monthly revenue from all accepted properties
    const totalMonthlyRevenue = properties
      ?.filter((p: any) => p.status === "accepted")
      ?.reduce((sum: number, p: any) => sum + (p.monthlyRent || 0), 0) || 0;

    return [
      {
        label: "My Properties",
        value: propertyStats.total || 0,
        icon: "solar:home-2-bold",
        iconColor: "text-primary-05",
        bgColor: "bg-primary-01",
        subtext: `${propertyStats.accepted || 0} accepted`,
      },
      {
        label: "Available Advances",
        value: `$${Math.round(availableCredit).toLocaleString()}`,
        icon: "solar:wallet-money-bold",
        iconColor: "text-secondary-07",
        bgColor: "bg-secondary-01",
        subtext: hasProperties
          ? `${activeAdvanceCount} active advances`
          : "Add properties to unlock",
      },
      {
        label: "Total Commission",
        value: `$${Math.round(totalCommission).toLocaleString()}`,
        icon: "solar:money-bag-bold",
        iconColor: "text-tertiary-05",
        bgColor: "bg-tertiary-01",
        subtext: `From ${advances?.filter((a: any) => a.status === "disbursed" || a.status === "repaid").length || 0} advances`,
      },
      {
        label: "Monthly Rent",
        value: `$${Math.round(totalMonthlyRevenue).toLocaleString()}`,
        icon: "solar:chart-2-bold",
        iconColor: "text-quaternary-05",
        bgColor: "bg-quaternary-01",
        subtext: `From ${properties?.filter((p: any) => p.status === "accepted").length || 0} properties`,
      },
    ];
  }, [propertyStats, advances, properties]);

  // Get recent advances with property and owner details
  const activeAdvances = React.useMemo(() => {
    if (!advances) return [];

    // Filter and map active advances from real data
    const realData = advances
      .filter((a: any) => a.status === "approved" || a.status === "disbursed")
      .slice(0, 5) // Get first 5 active advances
      .map((advance: any) => {
        // Build the full address string
        const addressParts = [];
        if (advance.property?.address?.street) addressParts.push(advance.property.address.street);
        if (advance.property?.address?.unit) addressParts.push(`Unit ${advance.property.address.unit}`);
        if (advance.property?.address?.city && advance.property?.address?.state) {
          addressParts.push(`${advance.property.address.city}, ${advance.property.address.state}`);
        }

        const fullAddress = addressParts.join(', ') || advance.property?.address?.fullAddress || "Unknown Address";

        return {
          ...advance,
          property: advance.property?.address?.street || advance.property?.propertyName || "Unknown Property",
          owner: advance.owner?.name || "Unknown Owner",
          address: fullAddress,
          remainingBalance: advance.remainingBalance || advance.amount,
        };
      });

    return realData;
  }, [advances]);

  const completedAdvances = React.useMemo(() => {
    if (!advances) return [];

    // Filter and map completed advances from real data
    const realData = advances
      .filter((a: any) => a.status === "repaid")
      .slice(0, 5) // Get first 5 completed advances
      .map((advance: any) => {
        return {
          ...advance,
          property: advance.property?.address?.street || advance.property?.propertyName || "Unknown Property",
          owner: advance.owner?.name || "Unknown Owner",
          address: advance.property?.address?.fullAddress || "",
          repaidAt: advance.completedAt || advance.updatedAt,
        };
      });

    return realData;
  }, [advances]);

  // Calculate active advances metrics
  const activeMetrics = React.useMemo(() => {
    if (!advances) return {
      activeCount: 0,
      amountFunded: 0,
      amountCollected: 0,
      outstanding: 0,
      commissionsEarned: 0,
      commissionsPending: 0
    };

    return {
      activeCount: advances.filter((a: any) => a.status === "approved" || a.status === "disbursed").length,
      amountFunded: advances.filter((a: any) => a.status === "disbursed" || a.status === "repaid")
        .reduce((sum: number, a: any) => sum + a.amount, 0),
      amountCollected: advances.filter((a: any) => a.status === "repaid")
        .reduce((sum: number, a: any) => sum + a.amount, 0),
      outstanding: advances.filter((a: any) => a.status === "disbursed")
        .reduce((sum: number, a: any) => sum + (a.remainingBalance || a.amount), 0),
      commissionsEarned: advances.filter((a: any) => a.status === "repaid")
        .reduce((sum: number, a: any) => sum + (a.commissionAmount || 0), 0),
      commissionsPending: advances.filter((a: any) => a.status === "disbursed")
        .reduce((sum: number, a: any) => sum + (a.commissionAmount || 0), 0)
    };
  }, [advances]);

  // Calculate completed advances metrics
  const completedMetrics = React.useMemo(() => {
    if (!advances) return {
      totalCount: 0,
      totalCommissions: 0
    };

    const repaidAdvances = advances.filter((a: any) => a.status === "repaid");
    return {
      totalCount: repaidAdvances.length,
      totalCommissions: repaidAdvances.reduce((sum: number, a: any) => sum + (a.commissionAmount || 0), 0)
    };
  }, [advances]);

  // Handle advance request
  const handleRequestAdvance = () => {
    setIsRequesting(true);
    // In a real app, this would call a mutation to create an advance
    setTimeout(() => {
      setIsRequesting(false);
      onOpenChange();
      setRequestAmount("");
      setSelectedProperty("");
    }, 2000);
  };

  if (isLoading) {
    return (
      <AppLayout user={user}>
        <div className="flex items-center justify-center min-h-screen">
          <Spinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (!propertyManagerId) {
    return null; // Will redirect via useEffect
  }

  return (
    <AppLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {user?.firstName}!</h1>
            <p className="text-neutral-06">Here's an overview of your property management</p>
          </div>
          <Button
            className="bg-primary text-white"
            startContent={<Icon icon="solar:add-circle-bold" />}
            as="a"
            href="/advances/request"
          >
            Send Advance Request
          </Button>
        </div>

        {/* Integration Sync Alert */}
        {showIntegrationAlert && propertyManager?.integrationSynced?.enabled === false && (
          <Alert
            color="warning"
            variant="flat"
            title="Integration Sync Disabled"
            description={`Your ${
              propertyManager?.integrationSynced?.integrationType
                ? ({
                    rent_manager: "Rent Manager",
                    buildium: "Buildium",
                    neighborly: "Neighborly",
                    appfolio: "AppFolio",
                    propertyware: "Propertyware",
                    yardi: "Yardi",
                    other: "property management"
                  } as const)[propertyManager.integrationSynced.integrationType]
                : "property management"
            } integration sync is currently disabled. Enable it to automatically sync your properties and owners data.`}
            endContent={
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-warning-700 text-white"
                  isLoading={isEnablingSync}
                  onPress={async () => {
                    if (!propertyManagerId || !propertyManager?.integrationSynced) return;

                    setIsEnablingSync(true);
                    setSyncProgress("Connecting to " + ({
                      rent_manager: "Rent Manager",
                      buildium: "Buildium",
                      neighborly: "Neighborly",
                      appfolio: "AppFolio",
                      propertyware: "Propertyware",
                      yardi: "Yardi",
                      other: "integration"
                    } as const)[propertyManager.integrationSynced.integrationType || "other"] + "...");

                    try {
                      // Simulate connection delay
                      await new Promise(resolve => setTimeout(resolve, 1000));
                      setSyncProgress("Fetching properties and owners...");

                      // Sync properties
                      const result = await syncProperties({
                        propertyManagerId: propertyManagerId as Id<"propertyManagers">,
                      });

                      setSyncProgress(`Synced ${result.propertiesCreated} properties and ${result.ownersCreated} owners`);

                      // Wait a moment to show success message
                      await new Promise(resolve => setTimeout(resolve, 1500));

                      setShowIntegrationAlert(false);
                      setSyncProgress(null);
                    } catch (error) {
                      console.error("Failed to enable integration sync:", error);
                      setSyncProgress(null);
                    } finally {
                      setIsEnablingSync(false);
                    }
                  }}
                >
                  Enable Sync
                </Button>
                <Button
                  size="sm"
                  className="text-warning-700 data-[hover=true]:bg-warning-100 data-[hover=true]:text-warning-700"
                  variant="light"
                  onPress={() => setShowIntegrationAlert(false)}
                >
                  Dismiss
                </Button>
              </div>
            }
          />
        )}

        {/* Marketing Alert */}
        {showIntegrationAlert && user?.marketingPreference === "automated" && propertyManager?.integrationSynced?.enabled !== false && (
          <Alert
            color="primary"
            variant="flat"
            title="Automated Marketing Active"
            description="Your marketing campaigns are being sent automatically to property owners."
            endContent={
              <Button
                size="sm"
                variant="light"
                onPress={() => setShowIntegrationAlert(false)}
              >
                Dismiss
              </Button>
            }
          />
        )}

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <Card key={index} className="border border-neutral-02">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                    <Icon icon={metric.icon} className={`text-2xl ${metric.iconColor}`} />
                  </div>
                </div>
                <p className="text-sm text-neutral-06 mb-2">{metric.label}</p>
                <p className="text-2xl font-bold mb-1">{metric.value}</p>
                <p className="text-xs text-neutral-05">{metric.subtext}</p>
              </CardBody>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Advances Table */}
          <Card className="border border-neutral-02 flex flex-col">
            <CardHeader className="px-6 py-4 border-b border-neutral-02">
              <div className="flex justify-between items-center w-full">
                <h2 className="text-lg font-semibold">Active Advances</h2>
                <Button
                  as="a"
                  href="/advances"
                  size="sm"
                  variant="light"
                  endContent={<Icon icon="solar:arrow-right-linear" />}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardBody className="p-6">
              {!activeAdvances || activeAdvances.length === 0 ? (
                <div className="flex items-center justify-center min-h-[300px]">
                  <div className="text-center text-neutral-06">
                    No active advances at this time.
                  </div>
                </div>
              ) : (
                <Table aria-label="Active advances" removeWrapper>
                  <TableHeader>
                    <TableColumn width="40%">Address</TableColumn>
                    <TableColumn width="25%">Owner</TableColumn>
                    <TableColumn width="20%">Remaining</TableColumn>
                    <TableColumn width="15%">Commission</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {activeAdvances.map((advance: any) => (
                      <TableRow key={advance._id} className="h-[52px]">
                        <TableCell className="py-2">
                          <div className="max-w-xs truncate">
                            {advance.address || advance.property}
                          </div>
                        </TableCell>
                        <TableCell className="py-2">{advance.owner}</TableCell>
                        <TableCell className="py-2 font-medium">
                          ${Math.round(advance.remainingBalance || advance.amount).toLocaleString()}
                        </TableCell>
                        <TableCell className="py-2 font-medium">
                          ${Math.round(advance.commissionAmount || 0).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardBody>
            {(activeAdvances && activeAdvances.length > 0) && (
              <div className="px-6 py-4 bg-neutral-01 border-t border-neutral-02">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <Icon icon="solar:chart-square-bold" className="text-primary-06" width={24} height={24} />
                      <span className="text-base text-neutral-07">
                        <span className="font-semibold text-lg">{activeMetrics.activeCount}</span> Active Advances
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-neutral-07 uppercase tracking-wide mb-1">Outstanding</div>
                    <div className="text-lg font-semibold text-neutral-09">
                      ${Math.round(activeMetrics.outstanding).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Completed Advances Summary Table */}
          <Card className="border border-neutral-02 flex flex-col">
            <CardHeader className="px-6 py-4 border-b border-neutral-02">
              <div className="flex justify-between items-center w-full">
                <h2 className="text-lg font-semibold">Completed Advances Summary</h2>
                <Button
                  as="a"
                  href="/advances"
                  size="sm"
                  variant="light"
                  endContent={<Icon icon="solar:arrow-right-linear" />}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardBody className="p-6">
              {!completedAdvances || completedAdvances.length === 0 ? (
                <div className="flex items-center justify-center min-h-[300px]">
                  <div className="text-center text-neutral-06">
                    No completed advances yet.
                  </div>
                </div>
              ) : (
                <Table aria-label="Completed advances" removeWrapper>
                  <TableHeader>
                    <TableColumn width="35%">Property</TableColumn>
                    <TableColumn width="20%">Owner</TableColumn>
                    <TableColumn width="15%">Amount</TableColumn>
                    <TableColumn width="15%">Commission</TableColumn>
                    <TableColumn width="15%">Date</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {completedAdvances.map((advance: any) => (
                      <TableRow key={advance._id} className="h-[52px]">
                        <TableCell className="py-2">
                          <div className="max-w-xs truncate">
                            {advance.property}
                          </div>
                        </TableCell>
                        <TableCell className="py-2">{advance.owner}</TableCell>
                        <TableCell className="py-2 font-medium">
                          ${Math.round(advance.amount).toLocaleString()}
                        </TableCell>
                        <TableCell className="py-2 font-medium">
                          ${Math.round(advance.commissionAmount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="py-2">
                          {new Date(advance.repaidAt || advance.requestedAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardBody>
            {(completedAdvances && completedAdvances.length > 0) && (
              <div className="px-6 py-4 bg-success-50 border-t border-neutral-02">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <Icon icon="solar:check-circle-bold" className="text-success-600" width={24} height={24} />
                      <span className="text-base text-neutral-07">
                        <span className="font-semibold text-lg">{completedMetrics.totalCount}</span> Completed Advances
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-success-700 uppercase tracking-wide mb-1">Total Commissions</div>
                    <div className="text-lg font-semibold text-success-700">
                      ${Math.round(completedMetrics.totalCommissions).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Property Overview */}
        <Card className="border border-neutral-02">
          <CardHeader className="px-6 py-4 border-b border-neutral-02">
            <div className="flex justify-between items-center w-full">
              <h2 className="text-lg font-semibold">Property Overview</h2>
              <Button
                as="a"
                href="/advances"
                size="sm"
                variant="light"
                endContent={<Icon icon="solar:arrow-right-linear" />}
              >
                Manage Properties
              </Button>
            </div>
          </CardHeader>
          <CardBody className="p-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary-01 rounded-lg">
                  <Icon icon="solar:document-add-bold" className="text-secondary-07 text-xl" />
                </div>
                <div>
                  <p className="text-sm text-neutral-06">Requested</p>
                  <p className="text-lg font-semibold">{propertyStats?.total || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning-50 rounded-lg">
                  <Icon icon="solar:clock-circle-bold" className="text-warning-600 text-xl" />
                </div>
                <div>
                  <p className="text-sm text-neutral-06">Under Review</p>
                  <p className="text-lg font-semibold">{propertyStats?.under_review || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-danger-50 rounded-lg">
                  <Icon icon="solar:close-circle-bold" className="text-danger-600 text-xl" />
                </div>
                <div>
                  <p className="text-sm text-neutral-06">Rejected</p>
                  <p className="text-lg font-semibold">{propertyStats?.rejected || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success-50 rounded-lg">
                  <Icon icon="solar:check-circle-bold" className="text-success-600 text-xl" />
                </div>
                <div>
                  <p className="text-sm text-neutral-06">Accepted</p>
                  <p className="text-lg font-semibold">{propertyStats?.accepted || 0}</p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Quick Actions */}
        <Card className="border border-neutral-02">
          <CardHeader className="px-6 py-4 border-b border-neutral-02">
            <h2 className="text-lg font-semibold">Quick Actions</h2>
          </CardHeader>
          <CardBody className="p-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Button
                className="justify-start hover:bg-primary-01 hover:text-primary"
                variant="flat"
                startContent={<Icon icon="solar:home-add-linear" />}
                as="a"
                href="/advances"
              >
                Add New Property
              </Button>
              <Button
                className="justify-start hover:bg-primary-01 hover:text-primary"
                variant="flat"
                startContent={<Icon icon="solar:user-plus-linear" />}
                as="a"
                href="/owners"
              >
                Add Property Owner
              </Button>
              <Button
                className="justify-start hover:bg-primary-01 hover:text-primary"
                variant="flat"
                startContent={<Icon icon="solar:chart-square-linear" />}
                as="a"
                href="/insights"
              >
                View Analytics
              </Button>
              <Button
                className="justify-start hover:bg-primary-01 hover:text-primary"
                variant="flat"
                startContent={<Icon icon="solar:letter-linear" />}
                as="a"
                href="/marketing"
              >
                Send Campaign
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Request Advance Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Request Rent Advance
              </ModalHeader>
              <ModalBody>
                <Select
                  label="Select Property"
                  placeholder="Choose a property"
                  selectedKeys={selectedProperty ? [selectedProperty] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setSelectedProperty(selected);
                  }}
                >
                  {properties?.map((property: any) => (
                    <SelectItem key={property._id}>
                      {property.propertyName || property.address?.fullAddress || "Unknown Property"}
                    </SelectItem>
                  )) || []}
                </Select>
                <Input
                  label="Advance Amount"
                  placeholder="Enter amount"
                  startContent="$"
                  type="number"
                  value={requestAmount}
                  onChange={(e) => setRequestAmount(e.target.value)}
                />
                <div className="bg-primary-01 p-3 rounded-lg">
                  <p className="text-sm text-primary-06">
                    Commission (2%): ${((Number(requestAmount) || 0) * 0.02).toFixed(2)}
                  </p>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  className="bg-primary text-white"
                  onPress={handleRequestAdvance}
                  isLoading={isRequesting}
                  isDisabled={!selectedProperty || !requestAmount}
                >
                  Submit Request
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Sync Progress Modal */}
      <Modal
        isOpen={!!syncProgress}
        hideCloseButton
        isDismissable={false}
        size="2xl"
        classNames={{
          backdrop: "bg-black/60 backdrop-blur-md",
          base: "border-1 border-primary-03",
          body: "py-6",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 pb-2">
            <div className="flex items-center justify-center">
              <h3 className="text-xl font-semibold bg-gradient-to-r from-primary-06 to-secondary-06 bg-clip-text text-transparent">
                Syncing Your Properties
              </h3>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              {/* Animated Spinner Section */}
              <div className="flex justify-center">
                <div className="relative">
                  <Spinner
                    size="lg"
                    color="primary"
                    classNames={{
                      circle1: "border-b-primary-06",
                      circle2: "border-b-secondary-06",
                      wrapper: "w-20 h-20"
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon
                      icon="solar:home-2-bold"
                      className="text-2xl text-primary-06 animate-pulse"
                    />
                  </div>
                </div>
              </div>

              {/* Progress Status */}
              <div className="bg-neutral-01 rounded-lg p-4 border border-neutral-02">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {syncProgress?.includes("Synced") ? (
                      <Icon icon="solar:check-circle-bold" className="text-success-600 text-xl" />
                    ) : (
                      <Icon icon="solar:refresh-circle-line-duotone" className="text-primary-06 text-xl animate-spin" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-08">
                      {syncProgress}
                    </p>
                    <p className="text-xs text-neutral-05 mt-1">
                      {syncProgress?.includes("Connecting") && "Establishing secure connection..."}
                      {syncProgress?.includes("Fetching") && "Retrieving your property data..."}
                      {syncProgress?.includes("Synced") && "Successfully imported your data!"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-neutral-06">
                  <span>Progress</span>
                  <span>{syncProgress?.includes("Synced") ? "Complete!" : "Processing..."}</span>
                </div>
                <Progress
                  value={syncProgress?.includes("Synced") ? 100 : undefined}
                  isIndeterminate={!syncProgress?.includes("Synced")}
                  size="sm"
                  color={syncProgress?.includes("Synced") ? "success" : "primary"}
                  classNames={{
                    track: "bg-neutral-02",
                    indicator: syncProgress?.includes("Synced")
                      ? "bg-gradient-to-r from-success-500 to-success-600"
                      : "bg-gradient-to-r from-primary-06 to-secondary-06",
                  }}
                />
              </div>

              {/* Animated Property Cards */}
              <div className="grid grid-cols-3 gap-3">
                {["Properties", "Owners", "Advances"].map((item, index) => (
                  <div
                    key={item}
                    className={`p-3 rounded-lg border transition-all duration-500 ${
                      syncProgress?.includes("Synced")
                        ? "border-success-200 bg-success-50"
                        : "border-neutral-02 bg-neutral-01"
                    }`}
                    style={{
                      animationDelay: `${index * 100}ms`,
                    }}
                  >
                    <div className="flex flex-col items-center text-center">
                      <Icon
                        icon={
                          item === "Properties" ? "solar:home-2-linear" :
                          item === "Owners" ? "solar:user-circle-linear" :
                          "solar:wallet-money-linear"
                        }
                        className={`text-2xl mb-1 ${
                          syncProgress?.includes("Synced")
                            ? "text-success-600"
                            : "text-neutral-05 animate-pulse"
                        }`}
                      />
                      <span className="text-xs font-medium text-neutral-07">{item}</span>
                      <span className="text-xs text-neutral-05">
                        {syncProgress?.includes("Synced") ? "✓" : "..."}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Fun Loading Messages */}
              {!syncProgress?.includes("Synced") && (
                <div className="text-center">
                  <p className="text-xs text-neutral-05 italic animate-pulse">
                    {[
                      "Organizing your property empire...",
                      "Calculating rental potentials...",
                      "Mapping out your investments...",
                      "Preparing advance opportunities..."
                    ][Math.floor(Date.now() / 2000) % 4]}
                  </p>
                </div>
              )}
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </AppLayout>
  );
}