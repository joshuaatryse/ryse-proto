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
  const { isOpen: isRecipientsOpen, onOpen: onRecipientsOpen, onClose: onRecipientsClose } = useDisclosure();
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [user, setUser] = useState<any>(null);
  const [propertyManagerId, setPropertyManagerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCampaignForRecipients, setSelectedCampaignForRecipients] = useState<any>(null);
  const [campaignRecipients, setCampaignRecipients] = useState<any[]>([]);
  const [sortDescriptor, setSortDescriptor] = useState<{ column: string; direction: "ascending" | "descending" }>({
    column: "dateSent",
    direction: "ascending"
  });

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

  // Mock campaigns data
  const mockCampaigns = React.useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;

    return [
      // Past sent campaigns
      {
        _id: "campaign1" as any,
        name: "Summer Rent Advance Offer",
        status: "delivered",
        dateSent: new Date(now - 14 * oneDay).toISOString(),
        lastAction: new Date(now - 13 * oneDay).toISOString(),
        recipientCount: 24,
        metrics: { sent: 24, delivered: 23, opened: 18, clicked: 5, advanceRequested: 2 }
      },
      {
        _id: "campaign2" as any,
        name: "Quick Cash for Property Upgrades",
        status: "opened",
        dateSent: new Date(now - 7 * oneDay).toISOString(),
        lastAction: new Date(now - 6 * oneDay).toISOString(),
        recipientCount: 18,
        metrics: { sent: 18, delivered: 18, opened: 12, clicked: 3, advanceRequested: 1 }
      },
      {
        _id: "campaign3" as any,
        name: "End of Month Liquidity Boost",
        status: "advance requested",
        dateSent: new Date(now - 3 * oneDay).toISOString(),
        lastAction: new Date(now - 2 * oneDay).toISOString(),
        recipientCount: 31,
        metrics: { sent: 31, delivered: 30, opened: 22, clicked: 8, advanceRequested: 3 }
      },
      // Upcoming campaigns (max 2 per week)
      {
        _id: "campaign4" as any,
        name: "Holiday Season Advance Special",
        status: "clicked",
        dateSent: new Date(now + 2 * oneDay).toISOString(),
        lastAction: new Date(now + 2 * oneDay + 3 * 60 * 60 * 1000).toISOString(),
        recipientCount: 28,
        metrics: { sent: 28, delivered: 27, opened: 19, clicked: 7, advanceRequested: 0 }
      },
      {
        _id: "campaign5" as any,
        name: "New Year Property Investment Fund",
        status: "queued",
        dateSent: new Date(now + 5 * oneDay).toISOString(),
        lastAction: null,
        recipientCount: 35,
        metrics: null
      },
      {
        _id: "campaign6" as any,
        name: "Tax Season Cash Advance",
        status: "queued",
        dateSent: new Date(now + 9 * oneDay).toISOString(),
        lastAction: null,
        recipientCount: 22,
        metrics: null
      },
      {
        _id: "campaign7" as any,
        name: "Spring Maintenance Fund Offer",
        status: "queued",
        dateSent: new Date(now + 12 * oneDay).toISOString(),
        lastAction: null,
        recipientCount: 26,
        metrics: null
      },
      {
        _id: "campaign8" as any,
        name: "Property Portfolio Expansion Advance",
        status: "queued",
        dateSent: new Date(now + 16 * oneDay).toISOString(),
        lastAction: null,
        recipientCount: 19,
        metrics: null
      }
    ];
  }, []);

  // Mock recipients for modal
  const mockRecipients = React.useMemo(() => [
    { _id: "owner1", name: "John Smith", email: "john@example.com", properties: 3, included: true },
    { _id: "owner2", name: "Sarah Johnson", email: "sarah@example.com", properties: 2, included: true },
    { _id: "owner3", name: "Michael Chen", email: "michael@example.com", properties: 5, included: true },
    { _id: "owner4", name: "Emily Davis", email: "emily@example.com", properties: 1, included: true },
    { _id: "owner5", name: "Robert Wilson", email: "robert@example.com", properties: 4, included: false },
  ], []);

  // Sort campaigns based on sortDescriptor
  const sortedCampaigns = React.useMemo(() => {
    const sorted = [...mockCampaigns].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortDescriptor.column) {
        case "name":
          aValue = a.name;
          bValue = b.name;
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "dateSent":
          aValue = new Date(a.dateSent).getTime();
          bValue = new Date(b.dateSent).getTime();
          break;
        case "lastAction":
          aValue = a.lastAction ? new Date(a.lastAction).getTime() : 0;
          bValue = b.lastAction ? new Date(b.lastAction).getTime() : 0;
          break;
        case "recipientCount":
          aValue = a.recipientCount;
          bValue = b.recipientCount;
          break;
        default:
          return 0;
      }

      if (sortDescriptor.direction === "ascending") {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return sorted;
  }, [mockCampaigns, sortDescriptor]);

  // Filter campaigns by automation status
  const automatedCampaigns = campaigns?.filter(c => c.isAutomated) || [];
  const manualCampaigns = campaigns?.filter(c => !c.isAutomated) || [];

  // Filter owners by search
  const filteredOwners = owners?.filter(owner =>
    owner.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    owner.email.toLowerCase().includes(searchFilter.toLowerCase())
  ) || [];

  const handlePreviewEmail = (campaign: any) => {
    // Generate different email content based on campaign name using Nomad's language
    let emailContent = "";
    let subject = "";

    if (campaign.name.includes("Summer")) {
      subject = "Access Your Future Rental Income Today";
      emailContent = `Hi Sarah,

As a Nomad property owner, you know how expensive repairs or necessary home improvements can pop up at any time. We want to ensure you don't have any financial stress as these moments arise.

Your Properties with Guaranteed Rent:
• 245 Oak Street, San Francisco - $4,500/month
• 1127 Pine Avenue, Unit 3B - $3,200/month
• 890 Market Street, Suite 200 - $5,800/month

Available Rent Advance: Up to $148,500
(11 months of future rental income)

Why Nomad Rent Advance?
✓ No credit checks - we've already vetted your tenant
✓ No hoops to jump through or hidden fees
✓ Instantly fund home improvements, new investments, or that unexpected repair
✓ 1 minute to request your advance
✓ Cash in your account today

There are no limitations for how you use the funds - it's totally up to you.

Nomad takes the stress out of rental property finances.`;
    } else if (campaign.name.includes("Tax Season")) {
      subject = "Tax Season: Get Cash When You Need It Most";
      emailContent = `Dear Michael,

Tax season often brings unexpected expenses and opportunities. Access your future rental income today to maximize your property investments.

Your Nomad Properties Qualify for: $127,000
(Up to 11 months of rent available today)

Perfect for Tax Season:
• Fund home improvements (tax-deductible expenses)
• Invest in energy-efficient upgrades
• Cover unexpected tax obligations
• Take advantage of year-end investment opportunities

Quick Facts:
✓ No credit check required
✓ No administrative hassles
✓ Your tenant is already approved for Guaranteed Rent
✓ 1 minute to request
✓ Future rent in your bank account today

As long as you have a lease in place through the end of the period, you'll receive your Rent Advance.`;
    } else if (campaign.name.includes("Holiday")) {
      subject = "Holiday Special: Instant Access to Your Rental Income";
      emailContent = `Season's Greetings, Emily!

The holidays can bring unexpected expenses. With Nomad Rent Advance, quickly and easily access up to 11 months of future rental income today.

Your Property: 567 Maple Drive
Monthly Rent: $6,200
Available Today: Up to $68,200

Use Your Advance For:
• Holiday home improvements
• End-of-year investment opportunities
• Emergency repairs that pop up
• Whatever you need - no limitations

The Nomad Advantage:
✓ Future rent in your bank account today
✓ No credit checks or hoops to jump through
✓ No hidden fees or administrative hassles
✓ Your tenant continues paying as normal

Nomad takes the stress out of rental property finances.`;
    } else {
      subject = `Access Your Future Rental Income Today with Nomad`;
      emailContent = `Dear Property Owner,

Great news! As a Nomad property owner with Guaranteed Rent, you can instantly access up to 11 months of future rental income.

Your property at ${user?.company || "your property management company"} qualifies for our Rent Advance product, allowing you to quickly tap into future rent payments.

The Nomad Rent Advance:
• Up to 11 months of rent available today
• 1 minute to request your advance
• No credit checks - your tenant is already approved
• No hoops to jump through
• No hidden fees
• No administrative hassles

Instantly fund home improvements, new investments, or that unexpected repair. There are no limitations for how you use the funds.

As long as you have a lease in place through the end of the period, you'll receive your Rent Advance.`;
    }

    const mockEmailContent = {
      _id: campaign._id,
      _creationTime: Date.now(),
      name: campaign.name,
      subject: subject,
      content: emailContent,
      templateType: "advance_offer" as const,
      status: campaign.status,
      recipientType: "owners" as const,
      recipientCount: campaign.recipientCount,
      recipients: [],
      propertyManagerId: propertyManagerId as Id<"propertyManagers">,
    };
    setSelectedCampaign(mockEmailContent);
    onPreviewOpen();
  };

  const handleSendCampaign = async (campaignId: Id<"emailCampaigns">) => {
    await sendCampaign({ campaignId });
  };

  const handleExcludeOwner = async (campaignId: Id<"emailCampaigns">, ownerId: Id<"owners">) => {
    await excludeOwner({ campaignId, ownerId });
  };

  const handleViewRecipients = (campaign: any) => {
    setSelectedCampaignForRecipients(campaign);
    setCampaignRecipients(mockRecipients);
    onRecipientsOpen();
  };

  const handleRemoveRecipient = (recipientId: string) => {
    setCampaignRecipients(prev =>
      prev.map(r => r._id === recipientId ? { ...r, included: false } : r)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "queued": return "default";
      case "sent": return "primary";
      case "delivered": return "primary";
      case "opened": return "warning";
      case "clicked": return "default";
      case "advance requested": return "success";
      default: return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "queued": return "solar:clock-circle-linear";
      case "sent": return "solar:letter-linear";
      case "delivered": return "solar:check-circle-linear";
      case "opened": return "solar:eye-linear";
      case "clicked": return "solar:cursor-square-linear";
      case "advance requested": return "solar:wallet-money-linear";
      default: return "solar:question-circle-linear";
    }
  };

  const EmailPreview = () => {
    if (!selectedCampaign) return null;

    const nomadColor = "#027468";

    return (
      <div className="bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Email Header with Nomad branding */}
          <div className="text-center py-6 border-b border-gray-200 bg-white">
            <img
              src="/nomad.svg"
              alt="Nomad"
              className="h-8 mx-auto mb-3"
            />
            <p className="text-xs font-medium tracking-wide uppercase" style={{ color: nomadColor }}>
              Manage Your Property Like a Pro
            </p>
          </div>

          {/* Email Subject Bar */}
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Subject:</p>
            <p className="font-semibold text-gray-900">{selectedCampaign.subject}</p>
          </div>

          {/* Email Content */}
          <div className="p-6">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {selectedCampaign.content}
            </div>

            {/* Call to Action Button */}
            <div className="text-center mt-8">
              <a
                href="#"
                className="inline-block text-white font-semibold px-8 py-3 rounded-lg transition-all hover:opacity-90"
                style={{ backgroundColor: nomadColor }}
              >
                Get Rent Advance →
              </a>
            </div>

            {/* Trust Badges */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold" style={{ color: nomadColor }}>11</div>
                  <div className="text-xs text-gray-500">Months Available</div>
                </div>
                <div>
                  <div className="text-2xl font-bold" style={{ color: nomadColor }}>1</div>
                  <div className="text-xs text-gray-500">Minute to Request</div>
                </div>
                <div>
                  <div className="text-2xl font-bold" style={{ color: nomadColor }}>No</div>
                  <div className="text-xs text-gray-500">Credit Check</div>
                </div>
              </div>
            </div>

            {/* Email Signature */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Best regards,<br />
                <strong>{user?.firstName || "Your"} {user?.lastName || "Property Manager"}</strong><br />
                {user?.company || "Property Management Company"}<br />
                <span className="text-xs" style={{ color: nomadColor }}>Powered by Nomad</span>
              </p>
            </div>
          </div>

          {/* Email Footer */}
          <div className="bg-gray-50 px-6 py-4 text-center border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2">
              This email was sent by {user?.company || "your property management company"} in partnership with Nomad.
            </p>
            <p className="text-xs">
              <a href="#" className="hover:underline" style={{ color: nomadColor }}>Unsubscribe</a>
              <span className="text-gray-400 mx-2">|</span>
              <a href="#" className="hover:underline" style={{ color: nomadColor }}>Update Preferences</a>
              <span className="text-gray-400 mx-2">|</span>
              <a href="#" className="hover:underline" style={{ color: nomadColor }}>Privacy Policy</a>
            </p>
            <p className="text-xs text-gray-400 mt-2">
              © 2025 Nomad. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    );
  };

  const BrandingEditor = () => {
    const nomadPrimaryColor = "#027468";  // Teal from Nomad logo
    const nomadSecondaryColor = "#023A41"; // Darker teal from their theme-color meta tag
    const defaultBranding = {
      companyName: user?.company || "Your Company",
      tagline: "Manage Your Property Like a Pro",
      logo: "/nomad.svg",
      primaryColor: nomadPrimaryColor,
      secondaryColor: nomadSecondaryColor,
      textColor: "#1F2937",
      backgroundColor: "#ffffff",
      fontFamily: "Inter, sans-serif",
      emailSignature: `Best regards,\n\n${user?.firstName || "Your"} ${user?.lastName || "Property Manager"}\n${user?.company || "Property Management Company"}\nPowered by Nomad`
    };

    // Always use Nomad's default branding
    const [brandingData, setBrandingData] = useState(defaultBranding);

    return (
      <div className="space-y-4">
        {/* Logo Preview */}
        <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
          <img src="/nomad.svg" alt="Nomad" className="h-12" />
        </div>

        <Input
          label="Company Name"
          value={brandingData.companyName || ""}
          onChange={(e) => setBrandingData({ ...brandingData, companyName: e.target.value })}
          placeholder={user?.company || "Your Company Name"}
        />
        <Input
          label="Tagline"
          value={brandingData.tagline || ""}
          onChange={(e) => setBrandingData({ ...brandingData, tagline: e.target.value })}
          placeholder="Manage Your Property Like a Pro"
        />
        <Input
          label="Logo URL"
          value={brandingData.logo || ""}
          onChange={(e) => setBrandingData({ ...brandingData, logo: e.target.value })}
          placeholder="/nomad.svg"
          disabled
          description="Using Nomad branding"
        />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Primary Color</label>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={brandingData.primaryColor || nomadPrimaryColor}
                onChange={(e) => setBrandingData({ ...brandingData, primaryColor: e.target.value })}
                className="w-20"
              />
              <span className="text-sm text-gray-500">{brandingData.primaryColor || nomadPrimaryColor}</span>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Secondary Color</label>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={brandingData.secondaryColor || nomadSecondaryColor}
                onChange={(e) => setBrandingData({ ...brandingData, secondaryColor: e.target.value })}
                className="w-20"
              />
              <span className="text-sm text-gray-500">{brandingData.secondaryColor || nomadSecondaryColor}</span>
            </div>
          </div>
        </div>

        <Textarea
          label="Email Signature"
          value={brandingData.emailSignature || ""}
          onChange={(e) => setBrandingData({ ...brandingData, emailSignature: e.target.value })}
          rows={4}
          placeholder={`Best regards,\n\n${user?.firstName || "Your"} ${user?.lastName || "Property Manager"}\n${user?.company || "Property Management Company"}\nPowered by Nomad`}
        />

        {/* Preview Section */}
        <div className="mt-6 p-4 border border-gray-200 rounded-lg">
          <p className="text-sm font-medium mb-3">Preview</p>
          <div className="text-center">
            <div className="inline-block p-3 rounded" style={{ backgroundColor: brandingData.primaryColor || nomadPrimaryColor }}>
              <span className="text-white font-medium">Primary Color</span>
            </div>
            <div className="inline-block p-3 rounded ml-2" style={{ backgroundColor: brandingData.secondaryColor || nomadSecondaryColor }}>
              <span className="text-white font-medium">Secondary Color</span>
            </div>
          </div>
        </div>
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
            <div className="mt-4 space-y-6">
              {/* Header section */}
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Email Marketing Campaigns</h3>
                  <p className="text-sm text-default-500 mt-1">Ryse automated campaigns to property owners</p>
                </div>
              </div>

              {/* Table */}
              <Table
                aria-label="Marketing campaigns table"
                sortDescriptor={sortDescriptor}
                onSortChange={(descriptor) => {
                  if (descriptor.column && descriptor.direction) {
                    setSortDescriptor({
                      column: descriptor.column as string,
                      direction: descriptor.direction
                    });
                  }
                }}
              >
                <TableHeader>
                  <TableColumn key="name" allowsSorting>Campaign Name</TableColumn>
                  <TableColumn key="status" allowsSorting>Status</TableColumn>
                  <TableColumn key="dateSent" allowsSorting>Date Sent</TableColumn>
                  <TableColumn key="lastAction" allowsSorting>Last Action</TableColumn>
                  <TableColumn key="recipientCount" allowsSorting>Recipients</TableColumn>
                  <TableColumn align="center">Actions</TableColumn>
                </TableHeader>
                <TableBody>
                  {sortedCampaigns.map((campaign) => (
                        <TableRow key={campaign._id}>
                          <TableCell>
                            <div className="font-medium">{campaign.name}</div>
                          </TableCell>
                          <TableCell>
                            <Chip
                              startContent={<Icon icon={getStatusIcon(campaign.status)} width={16} />}
                              color={getStatusColor(campaign.status)}
                              variant="flat"
                              size="sm"
                              className={
                                campaign.status === "delivered" ? "bg-primary-01 text-primary-06" :
                                campaign.status === "clicked" ? "bg-tertiary-01 text-tertiary-06" : ""
                              }
                            >
                              {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                            </Chip>
                          </TableCell>
                          <TableCell>
                            {new Date(campaign.dateSent).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric"
                            })}
                          </TableCell>
                          <TableCell>
                            {campaign.lastAction ? (
                              <div className="text-sm">
                                {new Date(campaign.lastAction).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </div>
                            ) : (
                              <span className="text-default-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="flat"
                              className="bg-primary-01 text-primary-06"
                              onPress={() => handleViewRecipients(campaign)}
                            >
                              {campaign.recipientCount} owners
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 justify-center">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onPress={() => handlePreviewEmail(campaign)}
                              >
                                <Icon icon="solar:eye-linear" width={18} />
                              </Button>
                              {campaign.status === "queued" && (
                                <Button
                                  isIconOnly
                                  size="sm"
                                  className="bg-danger-50 text-danger-600 hover:bg-danger-100"
                                >
                                  <Icon icon="solar:close-circle-linear" width={18} />
                                </Button>
                              )}
                              {campaign.metrics && (
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                >
                                  <Icon icon="solar:chart-square-linear" width={18} />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Campaign Performance Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
                <Card>
                  <CardBody className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-success-50 rounded-lg">
                        <Icon icon="solar:wallet-money-bold" className="text-success-600 text-xl" />
                      </div>
                      <div>
                        <p className="text-sm text-default-500">Total Advances Requested</p>
                        <p className="text-xl font-semibold">6</p>
                        <p className="text-xs text-success-600">+20% from last month</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-warning-50 rounded-lg">
                        <Icon icon="solar:eye-bold" className="text-warning-600 text-xl" />
                      </div>
                      <div>
                        <p className="text-sm text-default-500">Average Open Rate</p>
                        <p className="text-xl font-semibold">68%</p>
                        <p className="text-xs text-warning-600">Industry avg: 45%</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary-01 rounded-lg">
                        <Icon icon="solar:cursor-square-bold" className="text-primary-06 text-xl" />
                      </div>
                      <div>
                        <p className="text-sm text-default-500">Click Rate</p>
                        <p className="text-xl font-semibold">28%</p>
                        <p className="text-xs text-primary-06">+5% from last campaign</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>
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

        {/* Campaign Recipients Modal */}
        <Modal
          isOpen={isRecipientsOpen}
          onClose={onRecipientsClose}
          size="2xl"
          scrollBehavior="inside"
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader>
                  <div>
                    <h3 className="text-lg font-semibold">Campaign Recipients</h3>
                    {selectedCampaignForRecipients && (
                      <p className="text-sm text-default-500 mt-1">{selectedCampaignForRecipients.name}</p>
                    )}
                  </div>
                </ModalHeader>
                <ModalBody>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-sm text-default-600">
                        {campaignRecipients.filter(r => r.included).length} of {campaignRecipients.length} recipients selected
                      </p>
                      <Button size="sm" variant="flat">
                        Export List
                      </Button>
                    </div>
                    <Table aria-label="Campaign recipients">
                      <TableHeader>
                        <TableColumn>Owner</TableColumn>
                        <TableColumn>Properties</TableColumn>
                        <TableColumn>Status</TableColumn>
                        <TableColumn align="center">Action</TableColumn>
                      </TableHeader>
                      <TableBody>
                        {campaignRecipients.map((recipient) => (
                          <TableRow key={recipient._id} className={!recipient.included ? "opacity-50" : ""}>
                            <TableCell>
                              <User
                                name={recipient.name}
                                description={recipient.email}
                                avatarProps={{
                                  size: "sm",
                                  name: recipient.name,
                                }}
                              />
                            </TableCell>
                            <TableCell>{recipient.properties}</TableCell>
                            <TableCell>
                              <Chip
                                size="sm"
                                color={recipient.included ? "success" : "default"}
                                variant="flat"
                              >
                                {recipient.included ? "Included" : "Removed"}
                              </Chip>
                            </TableCell>
                            <TableCell>
                              {recipient.included ? (
                                <Button
                                  size="sm"
                                  color="danger"
                                  variant="light"
                                  onPress={() => handleRemoveRecipient(recipient._id)}
                                >
                                  Remove
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  color="primary"
                                  variant="light"
                                  onPress={() => setCampaignRecipients(prev =>
                                    prev.map(r => r._id === recipient._id ? { ...r, included: true } : r)
                                  )}
                                >
                                  Re-add
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button variant="light" onPress={onClose}>
                    Cancel
                  </Button>
                  <Button className="bg-primary text-white" onPress={onClose}>
                    Save Changes
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