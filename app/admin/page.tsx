"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppLayout } from "@/components/layout/app-layout";
import StatusBadge from "@/components/ui/status-badge";
import AdvanceRequestsCard from "@/components/admin/advance-requests-card";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Input } from "@heroui/input";
import { Icon } from "@iconify/react";
import { Chip } from "@heroui/chip";

export default function AdminDashboard() {
  const router = useRouter();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const createInvitation = useMutation(api.invitations.create);

  // Fetch real data from Convex
  const propertyManagers = useQuery(api.propertyManagers.getAll);
  const properties = useQuery(api.properties.getAll);
  const advanceStats = useQuery(api.advances.getAdvanceStats);
  const invitations = useQuery(api.invitations.getRecent, { limit: 5 });

  // Form state
  const [inviteEmail, setInviteEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  // Mock user data
  const mockUser = {
    email: "sean.mitchell@rysemarket.com",
    firstName: "Sean",
    lastName: "Mitchell",
    role: "Admin",
  };

  // Build metrics from real data
  const metrics = [
    {
      label: "Total Property Managers",
      value: propertyManagers?.length || 0,
      icon: "solar:users-group-two-rounded-bold",
      iconColor: "text-primary-05",
      bgColor: "bg-primary-01",
      trend: { value: 12, isPositive: true },
    },
    {
      label: "Total Properties",
      value: properties?.length || 0,
      icon: "solar:buildings-2-bold",
      iconColor: "text-tertiary-05",
      bgColor: "bg-tertiary-01",
      trend: { value: 8, isPositive: true },
    },
    {
      label: "Active Advances",
      value: `$${((advanceStats?.totalAmount || 0) / 1000000).toFixed(1)}M`,
      icon: "solar:dollar-minimalistic-bold",
      iconColor: "text-secondary-07",
      bgColor: "bg-secondary-01",
      trend: { value: 23, isPositive: true },
    },
    {
      label: "Pending Review",
      value: advanceStats?.approved || 0,
      icon: "solar:document-text-bold",
      iconColor: "text-quaternary-05",
      bgColor: "bg-quaternary-01",
    },
  ];

  const recentInvitations = invitations || [];

  const handleSendInvitation = async () => {
    setError("");
    setIsSending(true);

    try {
      // Create invitation in Convex
      const result = await createInvitation({
        email: inviteEmail,
        firstName,
        lastName,
        companyName,
        sentBy: mockUser.email,
      });

      // Send invitation email via API
      const emailResponse = await fetch('/api/invitations/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail,
          firstName,
          lastName,
          companyName,
          token: result.token,
          adminName: `${mockUser.firstName} ${mockUser.lastName}`,
        }),
      });

      if (!emailResponse.ok) {
        throw new Error('Failed to send invitation email');
      }

      // Reset form
      setInviteEmail("");
      setFirstName("");
      setLastName("");
      setCompanyName("");
      onOpenChange();
    } catch (err) {
      console.error('Error sending invitation:', err);
      setError('Failed to send invitation. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <AppLayout user={mockUser}>
      <div className="min-h-screen py-8">
        <div className="w-full space-y-6">
          {/* Welcome Card with Deep Blue Gradient */}
          <Card className="w-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
            <CardBody
              className="p-8"
              style={{
                background: "linear-gradient(291.85deg, #00269F 2.29%, #070E24 99.99%)",
              }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-medium text-white leading-tight mb-2">
                    {getGreeting()}, {mockUser.firstName}
                  </h1>
                  <p className="text-white/90">
                    Welcome to your admin dashboard. Manage property managers and monitor system activity.
                  </p>
                </div>
                <Button
                  className="bg-white text-[#00269F] hover:bg-white/90 font-medium"
                  startContent={<Icon className="w-4 h-4" icon="solar:add-circle-bold" />}
                  onPress={onOpen}
                >
                  Send Invitation
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Metrics Grid with Clean Design */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric, index) => (
              <Card
                key={index}
                className="border border-neutral-02 hover:border-primary-04 hover:shadow-lg transition-all duration-200 group cursor-pointer bg-white"
              >
                <CardBody className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${metric.bgColor} group-hover:scale-105 transition-transform duration-200`}>
                      <Icon
                        className={`w-6 h-6 ${metric.iconColor}`}
                        icon={metric.icon}
                      />
                    </div>
                    {metric.trend && (
                      <div className="flex items-center gap-1">
                        <Icon
                          className={`w-4 h-4 ${metric.trend.isPositive ? 'text-green-600' : 'text-red-600'}`}
                          icon={metric.trend.isPositive ? 'solar:arrow-up-bold' : 'solar:arrow-down-bold'}
                        />
                        <span className={`text-sm font-medium ${metric.trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {metric.trend.value}%
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-2xl font-medium text-neutral-08 mb-1">
                    {metric.value.toLocaleString()}
                  </p>
                  <p className="text-sm text-neutral-06">{metric.label}</p>
                </CardBody>
              </Card>
            ))}
          </div>

          {/* Advance Requests Section - Full Width Priority Card */}
          <AdvanceRequestsCard />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
            {/* Recent Invitations - Left Side */}
            <div className="lg:col-span-7">
              <Card className="border border-neutral-02 hover:border-primary-04 hover:shadow-lg transition-all duration-200 bg-white">
                <CardHeader className="flex flex-row items-center justify-between px-6 py-5 border-b border-neutral-01">
                  <div className="flex items-center gap-2">
                    <Icon
                      className="w-5 h-5 text-primary-05"
                      icon="solar:letter-bold"
                    />
                    <h3 className="text-xl font-medium text-neutral-08">Recent Invitations</h3>
                  </div>
                  <Chip size="sm" className="bg-neutral-01 text-neutral-07">
                    {recentInvitations.length} total
                  </Chip>
                </CardHeader>
                <CardBody className="p-6">
                  <Table
                    aria-label="Recent invitations"
                    className="min-h-[400px]"
                    removeWrapper
                  >
                    <TableHeader>
                      <TableColumn>EMAIL</TableColumn>
                      <TableColumn>STATUS</TableColumn>
                      <TableColumn>SENT AT</TableColumn>
                      <TableColumn>SENT BY</TableColumn>
                      <TableColumn>ACCEPTED AT</TableColumn>
                      <TableColumn>ACTIONS</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {recentInvitations.map((invitation) => (
                        <TableRow key={invitation.id}>
                          <TableCell className="font-medium">{invitation.email}</TableCell>
                          <TableCell>
                            <StatusBadge status={invitation.status} />
                          </TableCell>
                          <TableCell className="text-neutral-06">
                            {invitation.sentAt}
                          </TableCell>
                          <TableCell>{invitation.sentBy}</TableCell>
                          <TableCell className="text-neutral-06">
                            {invitation.acceptedAt || "-"}
                          </TableCell>
                          <TableCell>
                            {invitation.status === "pending" && (
                              <Button size="sm" variant="light" className="text-primary-06">
                                Resend
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardBody>
              </Card>
            </div>

            {/* Quick Actions - Right Side */}
            <div className="lg:col-span-3 space-y-6">
              {/* Quick Stats */}
              <Card className="border border-neutral-02 hover:border-primary-04 hover:shadow-lg transition-all duration-200 bg-white">
                <CardHeader className="flex flex-row items-center px-6 py-5 border-b border-neutral-01">
                  <div className="flex items-center gap-2">
                    <Icon
                      className="w-5 h-5 text-primary-05"
                      icon="solar:chart-bold"
                    />
                    <h3 className="text-xl font-medium text-neutral-08">Quick Stats</h3>
                  </div>
                </CardHeader>
                <CardBody className="px-6 py-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-07">Avg Properties/Manager</span>
                      <span className="font-medium text-neutral-08">30.6</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-07">Active Managers</span>
                      <span className="font-medium text-neutral-08">38</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-07">Pending Approvals</span>
                      <span className="font-medium text-neutral-08">12</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-07">System Health</span>
                      <Chip size="sm" className="bg-secondary-01 text-secondary-08">
                        Operational
                      </Chip>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Quick Actions */}
              <Card className="border border-neutral-02 hover:border-primary-04 hover:shadow-lg transition-all duration-200 bg-white">
                <CardHeader className="flex flex-row items-center px-6 py-5 border-b border-neutral-01">
                  <div className="flex items-center gap-2">
                    <Icon
                      className="w-5 h-5 text-primary-05"
                      icon="solar:bolt-circle-bold"
                    />
                    <h3 className="text-xl font-medium text-neutral-08">Quick Actions</h3>
                  </div>
                </CardHeader>
                <CardBody className="px-6 py-6">
                  <div className="space-y-3">
                    <button
                      className="w-full text-left bg-neutral-01 hover:bg-primary-01 rounded-lg p-4 transition-all duration-200 group"
                      type="button"
                      onClick={onOpen}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Icon
                          className="w-5 h-5 flex-shrink-0 text-primary-05 group-hover:text-primary-06 transition-colors"
                          icon="solar:user-plus-bold"
                        />
                        <p className="text-base font-medium text-neutral-07 group-hover:text-primary-06 transition-colors">
                          Invite Property Manager
                        </p>
                      </div>
                    </button>
                    <button
                      className="w-full text-left bg-neutral-01 hover:bg-primary-01 rounded-lg p-4 transition-all duration-200 group"
                      type="button"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Icon
                          className="w-5 h-5 flex-shrink-0 text-neutral-07 group-hover:text-primary-06 transition-colors"
                          icon="solar:document-text-bold"
                        />
                        <p className="text-base font-medium text-neutral-07 group-hover:text-primary-06 transition-colors">
                          Generate Report
                        </p>
                      </div>
                    </button>
                    <button
                      className="w-full text-left bg-neutral-01 hover:bg-primary-01 rounded-lg p-4 transition-all duration-200 group"
                      type="button"
                      onClick={() => router.push('/admin/advances')}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Icon
                          className="w-5 h-5 flex-shrink-0 text-secondary-07 group-hover:text-primary-06 transition-colors"
                          icon="solar:dollar-minimalistic-bold"
                        />
                        <p className="text-base font-medium text-neutral-07 group-hover:text-primary-06 transition-colors">
                          View All Advances
                        </p>
                      </div>
                    </button>
                    <button
                      className="w-full text-left bg-neutral-01 hover:bg-primary-01 rounded-lg p-4 transition-all duration-200 group"
                      type="button"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Icon
                          className="w-5 h-5 flex-shrink-0 text-neutral-07 group-hover:text-primary-06 transition-colors"
                          icon="solar:settings-bold"
                        />
                        <p className="text-base font-medium text-neutral-07 group-hover:text-primary-06 transition-colors">
                          System Settings
                        </p>
                      </div>
                    </button>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Invitation Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Send Invitation
              </ModalHeader>
              <ModalBody>
                <p className="text-sm text-neutral-06 mb-4">
                  Invite a property manager to join the Ryse platform. They'll receive an email with instructions to set up their account.
                </p>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      isRequired
                      label="First Name"
                      placeholder="Enter first name"
                      value={firstName}
                      variant="bordered"
                      classNames={{
                        inputWrapper: "border-1 border-neutral-03 hover:border-primary-06 focus-within:border-primary-06",
                      }}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                    <Input
                      isRequired
                      label="Last Name"
                      placeholder="Enter last name"
                      value={lastName}
                      variant="bordered"
                      classNames={{
                        inputWrapper: "border-1 border-neutral-03 hover:border-primary-06 focus-within:border-primary-06",
                      }}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                  <Input
                    isRequired
                    label="Email Address"
                    placeholder="Enter property manager email"
                    type="email"
                    value={inviteEmail}
                    variant="bordered"
                    classNames={{
                      inputWrapper: "border-1 border-neutral-03 hover:border-primary-06 focus-within:border-primary-06",
                    }}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <Input
                    isRequired
                    label="Company Name"
                    placeholder="Enter company name"
                    value={companyName}
                    variant="bordered"
                    classNames={{
                      inputWrapper: "border-1 border-neutral-03 hover:border-primary-06 focus-within:border-primary-06",
                    }}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                  {error && (
                    <p className="text-sm text-red-500">{error}</p>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="danger"
                  variant="light"
                  onPress={onClose}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-primary-05 text-white"
                  color="primary"
                  isLoading={isSending}
                  onPress={handleSendInvitation}
                  isDisabled={!inviteEmail || !inviteEmail.includes("@") || !firstName || !lastName || !companyName}
                >
                  Send Invitation
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </AppLayout>
  );
}