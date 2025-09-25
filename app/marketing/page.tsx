"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Tabs,
  Tab,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Avatar,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Textarea,
  Select,
  SelectItem,
  Switch,
  Divider,
  User,
  Badge,
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { AppLayout } from "@/components/layout/app-layout";
import { Id } from "@/convex/_generated/dataModel";

interface EmailCampaign {
  _id: Id<"emailCampaigns">;
  _creationTime: number;
  name: string;
  subject: string;
  content: string;
  templateType?: "advance_offer" | "newsletter" | "announcement" | "custom";
  status: string;
  isAutomated?: boolean;
  automationTrigger?: string;
  recipientType: "owners" | "property_managers" | "selected" | "all";
  recipientCount: number;
  recipients: any[];
  sentAt?: number;
  scheduledFor?: number;
  updatedAt?: number;
  propertyManagerId?: Id<"propertyManagers">;
  createdAt?: number;
  metrics?: {
    sent: number;
    opened: number;
    clicked: number;
    bounced?: number;
    unsubscribed?: number;
  };
}

export default function MarketingPage() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState("automated");
  const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();
  const { isOpen: isBrandingOpen, onOpen: onBrandingOpen, onClose: onBrandingClose } = useDisclosure();
  const { isOpen: isOwnersOpen, onOpen: onOwnersOpen, onClose: onOwnersClose } = useDisclosure();
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [user, setUser] = useState<any>(null);
  const [propertyManagerId, setPropertyManagerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Handle authentication check
  React.useEffect(() => {
    const userData = sessionStorage.getItem("ryse-pm-user");
    if (!userData) {
      router.push("/login");
    } else {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setPropertyManagerId(parsedUser.id || parsedUser._id); // Handle both 'id' and '_id'
    }
    setIsLoading(false);
  }, [router]);

  // Fetch data
  const campaigns = useQuery(
    api.marketing.getCampaigns,
    propertyManagerId ? { propertyManagerId: propertyManagerId as Id<"propertyManagers"> } : "skip"
  );

  const branding = useQuery(
    api.marketing.getBranding,
    propertyManagerId ? { propertyManagerId: propertyManagerId as Id<"propertyManagers"> } : "skip"
  );

  const owners = useQuery(
    api.marketing.getOwnersWithPreferences,
    propertyManagerId ? { propertyManagerId: propertyManagerId as Id<"propertyManagers"> } : "skip"
  );

  const sendCampaign = useMutation(api.marketing.sendCampaign);
  const excludeOwner = useMutation(api.marketing.excludeOwnerFromMarketing);

  // Filter campaigns by automation status
  const automatedCampaigns = campaigns?.filter(c => c.isAutomated) || [];
  const manualCampaigns = campaigns?.filter(c => !c.isAutomated) || [];

  // Filter owners by search
  const filteredOwners = owners?.filter(owner =>
    owner.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    owner.email.toLowerCase().includes(searchFilter.toLowerCase())
  ) || [];

  const handlePreviewEmail = (campaign: EmailCampaign) => {
    setSelectedCampaign(campaign);
    onPreviewOpen();
  };

  const handleSendCampaign = async (campaignId: Id<"emailCampaigns">) => {
    await sendCampaign({ campaignId });
  };

  const handleExcludeOwner = async (campaignId: Id<"emailCampaigns">, ownerId: Id<"owners">) => {
    await excludeOwner({ campaignId, ownerId });
  };

  const EmailPreview = () => {
    if (!selectedCampaign || !branding) return null;

    return (
      <div
        className="rounded-lg overflow-hidden"
        style={{
          backgroundColor: branding.backgroundColor || "#ffffff",
          fontFamily: branding.fontFamily || "Inter, sans-serif",
        }}
      >
        {/* Email Header */}
        <div
          className="p-6 text-center"
          style={{ backgroundColor: branding.primaryColor || "#3B82F6" }}
        >
          {branding.logo ? (
            <img src={branding.logo} alt="Logo" className="h-12 mx-auto mb-4" />
          ) : (
            <h2 className="text-2xl font-bold text-white mb-2">
              {branding.companyName || user.company}
            </h2>
          )}
          {branding.tagline && (
            <p className="text-white/90">{branding.tagline}</p>
          )}
        </div>

        {/* Email Content */}
        <div className="p-6" style={{ color: branding.textColor || "#1F2937" }}>
          <h3 className="text-xl font-semibold mb-4">{selectedCampaign.subject}</h3>
          <div className="prose max-w-none whitespace-pre-wrap">
            {selectedCampaign.content}
          </div>

          {/* Call to Action Button */}
          <div className="text-center mt-6">
            <button
              className="px-6 py-3 rounded-lg text-white font-medium"
              style={{ backgroundColor: branding.secondaryColor || "#10B981" }}
            >
              Learn More About Rent Advances
            </button>
          </div>

          {/* Email Signature */}
          {branding.emailSignature && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm whitespace-pre-wrap">{branding.emailSignature}</p>
            </div>
          )}
        </div>

        {/* Email Footer */}
        <div className="bg-gray-100 p-4 text-center text-xs text-gray-600">
          <p>© 2024 {branding.companyName || user.company}. All rights reserved.</p>
          <p className="mt-2">
            <a href="#" className="text-blue-600 hover:underline">Unsubscribe</a> |
            <a href="#" className="text-blue-600 hover:underline ml-2">Update Preferences</a>
          </p>
        </div>
      </div>
    );
  };

  const BrandingEditor = () => {
    const [brandingData, setBrandingData] = useState(branding || {});

    return (
      <div className="space-y-4">
        <Input
          label="Company Name"
          value={brandingData.companyName || ""}
          onChange={(e) => setBrandingData({ ...brandingData, companyName: e.target.value })}
        />
        <Input
          label="Tagline"
          value={brandingData.tagline || ""}
          onChange={(e) => setBrandingData({ ...brandingData, tagline: e.target.value })}
        />
        <Input
          label="Logo URL"
          value={brandingData.logo || ""}
          onChange={(e) => setBrandingData({ ...brandingData, logo: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Primary Color"
            type="color"
            value={brandingData.primaryColor || "#3B82F6"}
            onChange={(e) => setBrandingData({ ...brandingData, primaryColor: e.target.value })}
          />
          <Input
            label="Secondary Color"
            type="color"
            value={brandingData.secondaryColor || "#10B981"}
            onChange={(e) => setBrandingData({ ...brandingData, secondaryColor: e.target.value })}
          />
          <Input
            label="Text Color"
            type="color"
            value={brandingData.textColor || "#1F2937"}
            onChange={(e) => setBrandingData({ ...brandingData, textColor: e.target.value })}
          />
          <Input
            label="Background Color"
            type="color"
            value={brandingData.backgroundColor || "#FFFFFF"}
            onChange={(e) => setBrandingData({ ...brandingData, backgroundColor: e.target.value })}
          />
        </div>
        <Textarea
          label="Email Signature"
          value={brandingData.emailSignature || ""}
          onChange={(e) => setBrandingData({ ...brandingData, emailSignature: e.target.value })}
          rows={4}
        />
      </div>
    );
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
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Marketing</h1>
            <p className="text-default-500 mt-1">
              Manage your automated marketing campaigns and owner communications
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="bordered"
              startContent={<Icon icon="solar:palette-linear" width={16} />}
              onPress={onBrandingOpen}
            >
              Branding
            </Button>
            <Button
              className="bg-primary-01 text-primary-06"
              startContent={<Icon icon="solar:add-circle-linear" width={16} />}
            >
              New Campaign
            </Button>
          </div>
        </div>

        {/* Marketing Preference Alert */}
        {user.marketingPreference === "automated" && (
          <Card className="bg-primary-01/10 border-primary-03">
            <CardBody className="flex-row items-center gap-3">
              <Icon icon="solar:automation-bold" className="text-primary-06" width={24} />
              <div className="flex-1">
                <p className="font-medium text-primary-06">Automated Marketing Active</p>
                <p className="text-sm text-default-600 mt-1">
                  Your marketing campaigns are being sent automatically to property owners based on your configured triggers.
                </p>
              </div>
              <Button
                size="sm"
                variant="flat"
                className="bg-primary-01 text-primary-06"
                onPress={onOwnersOpen}
              >
                Manage Recipients
              </Button>
            </CardBody>
          </Card>
        )}

        {/* Tabs */}
        <Tabs
          selectedKey={selectedTab}
          onSelectionChange={(key) => setSelectedTab(key as string)}
          className="w-full"
        >
          <Tab key="automated" title="Automated Campaigns">
            <div className="space-y-4 mt-4">
              {automatedCampaigns.length === 0 ? (
                <Card>
                  <CardBody className="text-center py-12">
                    <Icon icon="solar:automation-linear" className="text-default-300 mx-auto mb-4" width={48} />
                    <p className="text-default-500">No automated campaigns configured</p>
                  </CardBody>
                </Card>
              ) : (
                automatedCampaigns.map((campaign) => (
                  <Card key={campaign._id}>
                    <CardBody>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{campaign.name}</h3>
                            <Chip size="sm" className="bg-secondary-01 text-secondary-06">
                              {campaign.automationTrigger?.replace("_", " ")}
                            </Chip>
                            <Badge content={campaign.recipientCount} color="primary">
                              <Icon icon="solar:users-group-rounded-linear" width={20} />
                            </Badge>
                          </div>
                          <p className="text-default-600 mb-2">{campaign.subject}</p>

                          {/* Metrics */}
                          {campaign.metrics && (
                            <div className="flex gap-6 mt-4">
                              <div className="flex items-center gap-2">
                                <Icon icon="solar:letter-linear" className="text-default-400" width={16} />
                                <span className="text-sm">{campaign.metrics.sent} sent</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Icon icon="solar:eye-linear" className="text-default-400" width={16} />
                                <span className="text-sm">{campaign.metrics.opened} opened</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Icon icon="solar:cursor-linear" className="text-default-400" width={16} />
                                <span className="text-sm">{campaign.metrics.clicked} clicked</span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="light"
                            startContent={<Icon icon="solar:eye-linear" width={16} />}
                            onPress={() => handlePreviewEmail(campaign)}
                          >
                            Preview
                          </Button>
                          <Button
                            size="sm"
                            className="bg-primary-01 text-primary-06"
                            startContent={<Icon icon="solar:restart-linear" width={16} />}
                            onPress={() => handleSendCampaign(campaign._id)}
                          >
                            Trigger Now
                          </Button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))
              )}
            </div>
          </Tab>

          <Tab key="manual" title="Manual Campaigns">
            <div className="space-y-4 mt-4">
              {manualCampaigns.length === 0 ? (
                <Card>
                  <CardBody className="text-center py-12">
                    <Icon icon="solar:letter-linear" className="text-default-300 mx-auto mb-4" width={48} />
                    <p className="text-default-500">No manual campaigns created</p>
                    <Button
                      className="bg-primary-01 text-primary-06 mt-4"
                      startContent={<Icon icon="solar:add-circle-linear" width={16} />}
                    >
                      Create Campaign
                    </Button>
                  </CardBody>
                </Card>
              ) : (
                <Table aria-label="Manual campaigns">
                  <TableHeader>
                    <TableColumn>Campaign</TableColumn>
                    <TableColumn>Recipients</TableColumn>
                    <TableColumn>Status</TableColumn>
                    <TableColumn>Sent</TableColumn>
                    <TableColumn>Actions</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {manualCampaigns.map((campaign) => (
                      <TableRow key={campaign._id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{campaign.name}</p>
                            <p className="text-sm text-default-400">{campaign.subject}</p>
                          </div>
                        </TableCell>
                        <TableCell>{campaign.recipientCount}</TableCell>
                        <TableCell>
                          <Chip
                            size="sm"
                            className={
                              campaign.status === "sent"
                                ? "bg-success-50 text-success-600"
                                : campaign.status === "scheduled"
                                ? "bg-warning-50 text-warning-600"
                                : "bg-default-100 text-default-600"
                            }
                          >
                            {campaign.status}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          {campaign.sentAt
                            ? new Date(campaign.sentAt).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="light"
                              isIconOnly
                              onPress={() => handlePreviewEmail(campaign)}
                            >
                              <Icon icon="solar:eye-linear" width={16} />
                            </Button>
                            {campaign.status === "draft" && (
                              <Button
                                size="sm"
                                className="bg-primary-01 text-primary-06"
                                onPress={() => handleSendCampaign(campaign._id)}
                              >
                                Send
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </Tab>

          <Tab key="templates" title="Email Templates">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {["Advance Offer", "Monthly Newsletter", "Lease Renewal", "Welcome Email"].map((template) => (
                <Card key={template}>
                  <CardBody>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-primary-01 rounded-lg">
                        <Icon icon="solar:document-text-linear" className="text-primary-06" width={20} />
                      </div>
                      <h3 className="font-semibold">{template}</h3>
                    </div>
                    <p className="text-sm text-default-500 mb-4">
                      Pre-configured template for {template.toLowerCase()} communications
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="flat"
                        className="flex-1"
                        startContent={<Icon icon="solar:eye-linear" width={16} />}
                      >
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        variant="flat"
                        className="flex-1"
                        startContent={<Icon icon="solar:pen-linear" width={16} />}
                      >
                        Use Template
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </Tab>
        </Tabs>

        {/* Email Preview Modal */}
        <Modal
          isOpen={isPreviewOpen}
          onClose={onPreviewClose}
          size="3xl"
          scrollBehavior="inside"
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader>Email Preview</ModalHeader>
                <ModalBody>
                  <EmailPreview />
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

        {/* Branding Modal */}
        <Modal
          isOpen={isBrandingOpen}
          onClose={onBrandingClose}
          size="2xl"
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader>Customize Branding</ModalHeader>
                <ModalBody>
                  <BrandingEditor />
                </ModalBody>
                <ModalFooter>
                  <Button variant="light" onPress={onClose}>
                    Cancel
                  </Button>
                  <Button className="bg-primary-01 text-primary-06">
                    Save Branding
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* Manage Recipients Modal */}
        <Modal
          isOpen={isOwnersOpen}
          onClose={onOwnersClose}
          size="3xl"
          scrollBehavior="inside"
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader>Manage Marketing Recipients</ModalHeader>
                <ModalBody>
                  <Input
                    placeholder="Search owners..."
                    value={searchFilter}
                    onValueChange={setSearchFilter}
                    startContent={<Icon icon="solar:magnifer-linear" width={16} />}
                    className="mb-4"
                  />
                  <Table aria-label="Property owners">
                    <TableHeader>
                      <TableColumn>Owner</TableColumn>
                      <TableColumn>Properties</TableColumn>
                      <TableColumn>Total Rent</TableColumn>
                      <TableColumn>Marketing Status</TableColumn>
                      <TableColumn>Actions</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {filteredOwners.map((owner) => (
                        <TableRow key={owner._id}>
                          <TableCell>
                            <User
                              name={owner.name}
                              description={owner.email}
                              avatarProps={{
                                size: "sm",
                                name: owner.name,
                                className: "bg-secondary-02",
                              }}
                            />
                          </TableCell>
                          <TableCell>{owner.propertyCount}</TableCell>
                          <TableCell>${owner.totalRentValue.toLocaleString()}</TableCell>
                          <TableCell>
                            <Chip
                              size="sm"
                              className={
                                owner.isExcludedFromMarketing
                                  ? "bg-danger-50 text-danger-600"
                                  : "bg-success-50 text-success-600"
                              }
                            >
                              {owner.isExcludedFromMarketing ? "Excluded" : "Active"}
                            </Chip>
                          </TableCell>
                          <TableCell>
                            <Switch
                              size="sm"
                              isSelected={!owner.isExcludedFromMarketing}
                            >
                              Include
                            </Switch>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
      </div>
    </AppLayout>
  );
}