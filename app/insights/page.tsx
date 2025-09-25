"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Card,
  CardBody,
  CardHeader,
  Spinner,
  Select,
  SelectItem,
  Tab,
  Tabs,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Progress,
  User,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { AppLayout } from "@/components/layout/app-layout";
import MetricCard from "@/components/ui/metric-card";

// Chart colors matching the brand
const CHART_COLORS = {
  primary: "#9333EA", // primary-06
  secondary: "#10B981", // secondary-06
  tertiary: "#F59E0B", // tertiary-06
  quaternary: "#EC4899", // quaternary-06
  neutral: "#6B7280",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
};

const PIE_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.tertiary,
  CHART_COLORS.quaternary,
];

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white dark:bg-neutral-08 p-3 rounded-lg shadow-lg border border-neutral-02">
      <p className="text-sm font-medium mb-1">{label}</p>
      {payload.map((item: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-xs text-default-600">
            {item.name}: ${item.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function InsightsPage() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = React.useState("overview");
  const [dateRange, setDateRange] = React.useState("6M");
  const [user, setUser] = React.useState<any>(null);
  const [propertyManagerId, setPropertyManagerId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

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

  // Fetch analytics data
  const analytics = useQuery(
    api.insights.getAnalytics,
    propertyManagerId ? { propertyManagerId: propertyManagerId as Id<"propertyManagers"> } : "skip"
  );

  const ownerDistribution = useQuery(
    api.insights.getOwnerDistribution,
    propertyManagerId ? { propertyManagerId: propertyManagerId as Id<"propertyManagers"> } : "skip"
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

  if (!propertyManagerId) {
    return null; // Will redirect via useEffect
  }

  if (!analytics || !ownerDistribution) {
    return (
      <AppLayout user={user}>
        <div className="flex items-center justify-center min-h-screen">
          <Spinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  // Prepare chart data
  const propertyTypeData = [
    { name: "Single-family", value: analytics.properties.byType.singleFamily },
    { name: "Multi-family", value: analytics.properties.byType.multiFamily },
  ];

  const propertyStatusData = [
    { name: "Active", value: analytics.properties.byStatus.active, color: CHART_COLORS.success },
    { name: "Accepted", value: analytics.properties.byStatus.accepted, color: CHART_COLORS.primary },
    { name: "Under Review", value: analytics.properties.byStatus.under_review, color: CHART_COLORS.warning },
    { name: "Rejected", value: analytics.properties.byStatus.rejected, color: CHART_COLORS.danger },
  ];

  const advanceStatusData = Object.entries(analytics.advances.byStatus).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
  }));

  return (
    <AppLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Insights</h1>
            <p className="text-default-500 mt-1">
              Deep dive into your property management analytics
            </p>
          </div>
          <Select
            size="sm"
            variant="bordered"
            selectedKeys={[dateRange]}
            className="w-32"
            onSelectionChange={(keys) => setDateRange(Array.from(keys)[0] as string)}
          >
            <SelectItem key="1M">1 Month</SelectItem>
            <SelectItem key="3M">3 Months</SelectItem>
            <SelectItem key="6M">6 Months</SelectItem>
            <SelectItem key="1Y">1 Year</SelectItem>
            <SelectItem key="ALL">All Time</SelectItem>
          </Select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total Properties"
            value={analytics.overview.totalProperties}
            icon={<Icon icon="solar:home-2-linear" className="text-primary-06" width={24} />}
          />
          <MetricCard
            label="Monthly Revenue"
            value={analytics.overview.totalMonthlyRent}
            format="currency"
            icon={<Icon icon="solar:dollar-linear" className="text-primary-06" width={24} />}
          />
          <MetricCard
            label="Active Advances"
            value={analytics.advances.totalAmount}
            format="currency"
            icon={<Icon icon="solar:wallet-2-linear" className="text-primary-06" width={24} />}
          />
          <MetricCard
            label="Total Commissions"
            value={analytics.commissions.total}
            format="currency"
            icon={<Icon icon="solar:chart-2-linear" className="text-primary-06" width={24} />}
            trend={{
              value: analytics.advances.averageCommissionRate,
              isPositive: true
            }}
          />
        </div>

        {/* Tabs */}
        <Tabs
          selectedKey={selectedTab}
          onSelectionChange={(key) => setSelectedTab(key as string)}
          className="w-full"
        >
          <Tab key="overview" title="Overview">
            <div className="space-y-6 mt-6">
              {/* Charts Row 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Trends */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Monthly Advance Trends</h3>
                  </CardHeader>
                  <CardBody>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={analytics.trends.monthly}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis
                          dataKey="month"
                          stroke="#9CA3AF"
                          fontSize={12}
                        />
                        <YAxis
                          stroke="#9CA3AF"
                          fontSize={12}
                          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="amount"
                          name="Advance Amount"
                          stroke={CHART_COLORS.primary}
                          fill={CHART_COLORS.primary}
                          fillOpacity={0.1}
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          dataKey="commissions"
                          name="Commissions"
                          stroke={CHART_COLORS.secondary}
                          fill={CHART_COLORS.secondary}
                          fillOpacity={0.1}
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardBody>
                </Card>

                {/* Property Distribution */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Property Distribution</h3>
                  </CardHeader>
                  <CardBody>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Property Type Pie Chart */}
                      <div>
                        <p className="text-sm text-default-500 mb-2 text-center">By Type</p>
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={propertyTypeData}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              fill={CHART_COLORS.primary}
                              dataKey="value"
                              label={({ name, value }) => `${name}: ${value}`}
                            >
                              {propertyTypeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Property Status Bar Chart */}
                      <div>
                        <p className="text-sm text-default-500 mb-2 text-center">By Status</p>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={propertyStatusData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
                            <YAxis stroke="#9CA3AF" fontSize={12} />
                            <Tooltip />
                            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                              {propertyStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>

              {/* Occupancy Rate */}
              <Card>
                <CardBody>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">Occupancy Rate</h3>
                      <p className="text-sm text-default-500">Properties with active leases</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{analytics.overview.occupancyRate.toFixed(1)}%</p>
                      <p className="text-sm text-default-500">
                        {Math.round((analytics.overview.totalProperties * analytics.overview.occupancyRate) / 100)} of {analytics.overview.totalProperties} properties
                      </p>
                    </div>
                  </div>
                  <Progress
                    value={analytics.overview.occupancyRate}
                    className="h-3"
                    classNames={{
                      indicator: "bg-gradient-to-r from-primary-06 to-secondary-06",
                    }}
                  />
                </CardBody>
              </Card>

              {/* Top Performing Properties */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Top Performing Properties</h3>
                </CardHeader>
                <CardBody>
                  <Table aria-label="Top performing properties">
                    <TableHeader>
                      <TableColumn>Property</TableColumn>
                      <TableColumn>Owner</TableColumn>
                      <TableColumn>Monthly Rent</TableColumn>
                      <TableColumn>Total Advances</TableColumn>
                      <TableColumn>Advance Count</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {analytics.properties.topPerforming.map((property: any) => (
                        <TableRow key={property._id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{property.address.street}</p>
                              <p className="text-xs text-default-400">
                                {property.address.city}, {property.address.state}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {property.owner ? property.owner.name : "-"}
                          </TableCell>
                          <TableCell>${property.monthlyRent.toLocaleString()}</TableCell>
                          <TableCell>
                            <Chip size="sm" className="bg-quaternary-01 text-quaternary-06">
                              ${property.totalAdvances.toLocaleString()}
                            </Chip>
                          </TableCell>
                          <TableCell>{property.advanceCount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardBody>
              </Card>
            </div>
          </Tab>

          <Tab key="commissions" title="Commissions">
            <div className="space-y-6 mt-6">
              {/* Commission Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardBody>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary-01 rounded-lg">
                        <Icon icon="solar:dollar-linear" className="text-primary-06" width={24} />
                      </div>
                      <div>
                        <p className="text-sm text-default-500">Total Earned</p>
                        <p className="text-xl font-bold">${analytics.commissions.total.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-secondary-01 rounded-lg">
                        <Icon icon="solar:percentage-square-linear" className="text-secondary-06" width={24} />
                      </div>
                      <div>
                        <p className="text-sm text-default-500">Average Rate</p>
                        <p className="text-xl font-bold">{analytics.advances.averageCommissionRate}%</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-tertiary-01 rounded-lg">
                        <Icon icon="solar:users-group-rounded-linear" className="text-tertiary-06" width={24} />
                      </div>
                      <div>
                        <p className="text-sm text-default-500">Unique Owners</p>
                        <p className="text-xl font-bold">{analytics.commissions.byOwner.length}</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>

              {/* Commission by Owner */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Commission Breakdown by Owner</h3>
                </CardHeader>
                <CardBody>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={analytics.commissions.byOwner.slice(0, 10)}
                      layout="horizontal"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis
                        type="number"
                        stroke="#9CA3AF"
                        fontSize={12}
                        tickFormatter={(value) => `$${value.toLocaleString()}`}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        stroke="#9CA3AF"
                        fontSize={12}
                        width={100}
                      />
                      <Tooltip
                        formatter={(value: any) => `$${value.toLocaleString()}`}
                      />
                      <Bar
                        dataKey="amount"
                        fill={CHART_COLORS.primary}
                        radius={[0, 8, 8, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardBody>
              </Card>

              {/* Commission Table */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">All Owners Commission Details</h3>
                </CardHeader>
                <CardBody>
                  <Table aria-label="Commission details">
                    <TableHeader>
                      <TableColumn>Owner</TableColumn>
                      <TableColumn>Total Commission</TableColumn>
                      <TableColumn>Number of Advances</TableColumn>
                      <TableColumn>Average per Advance</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {analytics.commissions.byOwner.map((owner: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>
                            <User
                              name={owner.name}
                              avatarProps={{
                                size: "sm",
                                name: owner.name,
                                className: "bg-secondary-02",
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold">${owner.amount.toLocaleString()}</span>
                          </TableCell>
                          <TableCell>{owner.count}</TableCell>
                          <TableCell>
                            ${Math.round(owner.amount / owner.count).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardBody>
              </Card>
            </div>
          </Tab>

          <Tab key="portfolio" title="Portfolio Analysis">
            <div className="space-y-6 mt-6">
              {/* Owner Distribution */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Owner Portfolio Distribution</h3>
                </CardHeader>
                <CardBody>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={Object.entries(ownerDistribution.ranges).map(([range, count]) => ({
                          name: range,
                          value: count,
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        fill={CHART_COLORS.primary}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {Object.entries(ownerDistribution.ranges).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardBody>
              </Card>

              {/* Owner Details Table */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Owner Portfolio Details</h3>
                </CardHeader>
                <CardBody>
                  <Table aria-label="Owner portfolio details">
                    <TableHeader>
                      <TableColumn>Owner</TableColumn>
                      <TableColumn>Properties</TableColumn>
                      <TableColumn>Total Monthly Rent</TableColumn>
                      <TableColumn>Portfolio Size</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {ownerDistribution.distribution.map((owner: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>
                            <User
                              name={owner.owner}
                              avatarProps={{
                                size: "sm",
                                name: owner.owner,
                                className: "bg-tertiary-02",
                              }}
                            />
                          </TableCell>
                          <TableCell>{owner.propertyCount}</TableCell>
                          <TableCell>${owner.totalRent.toLocaleString()}</TableCell>
                          <TableCell>
                            <Chip
                              size="sm"
                              className={
                                owner.propertyCount >= 6
                                  ? "bg-quaternary-01 text-quaternary-06"
                                  : owner.propertyCount >= 4
                                  ? "bg-tertiary-01 text-tertiary-06"
                                  : owner.propertyCount >= 2
                                  ? "bg-secondary-01 text-secondary-06"
                                  : "bg-primary-01 text-primary-06"
                              }
                            >
                              {owner.propertyCount >= 6
                                ? "Large"
                                : owner.propertyCount >= 4
                                ? "Medium"
                                : owner.propertyCount >= 2
                                ? "Small"
                                : "Single"}
                            </Chip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardBody>
              </Card>
            </div>
          </Tab>

          <Tab key="advances" title="Advance Analysis">
            <div className="space-y-6 mt-6">
              {/* Advance Status Distribution */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Advance Status Distribution</h3>
                </CardHeader>
                <CardBody>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={advanceStatusData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
                      <YAxis stroke="#9CA3AF" fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="value" fill={CHART_COLORS.quaternary} radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardBody>
              </Card>

              {/* Advance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardBody>
                    <p className="text-sm text-default-500">Active Advances</p>
                    <p className="text-2xl font-bold">{analytics.advances.activeCount}</p>
                    <p className="text-xs text-default-400 mt-1">Properties with advances</p>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <p className="text-sm text-default-500">Total Advanced</p>
                    <p className="text-2xl font-bold">${analytics.advances.totalAmount.toLocaleString()}</p>
                    <p className="text-xs text-default-400 mt-1">Currently outstanding</p>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <p className="text-sm text-default-500">Average Advance</p>
                    <p className="text-2xl font-bold">
                      ${analytics.advances.activeCount > 0
                        ? Math.round(analytics.advances.totalAmount / analytics.advances.activeCount).toLocaleString()
                        : 0}
                    </p>
                    <p className="text-xs text-default-400 mt-1">Per property</p>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <p className="text-sm text-default-500">Commission Rate</p>
                    <p className="text-2xl font-bold">{analytics.advances.averageCommissionRate}%</p>
                    <p className="text-xs text-default-400 mt-1">Standard rate</p>
                  </CardBody>
                </Card>
              </div>
            </div>
          </Tab>
        </Tabs>
      </div>
    </AppLayout>
  );
}