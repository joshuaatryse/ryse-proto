"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Spinner,
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  SelectItem,
  Divider,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { AppLayout } from "@/components/layout/app-layout";

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as Id<"properties">;
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    propertyName: "",
    propertyType: "",
    status: "",
    bedrooms: "",
    bathrooms: "",
    squareFeet: "",
    yearBuilt: "",
    monthlyRent: "",
    securityDeposit: "",
    purchasePrice: "",
    purchaseDate: "",
    estimatedValue: "",
    occupancyStatus: "",
    leaseStartDate: "",
    leaseEndDate: "",
    address: {
      street: "",
      unit: "",
      city: "",
      state: "",
      zipCode: "",
    },
  });

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

  // Update mutation
  const updateProperty = useMutation(api.properties.update);

  // Populate form when property loads
  useEffect(() => {
    if (property) {
      setFormData({
        propertyName: property.propertyName || "",
        propertyType: property.propertyType || "",
        status: property.status || "",
        bedrooms: property.bedrooms?.toString() || "",
        bathrooms: property.bathrooms?.toString() || "",
        squareFeet: property.squareFeet?.toString() || "",
        yearBuilt: property.yearBuilt?.toString() || "",
        monthlyRent: property.monthlyRent?.toString() || "",
        securityDeposit: property.securityDeposit?.toString() || "",
        purchasePrice: property.purchasePrice?.toString() || "",
        purchaseDate: property.purchaseDate ? new Date(property.purchaseDate).toISOString().split('T')[0] : "",
        estimatedValue: property.estimatedValue?.toString() || "",
        occupancyStatus: property.occupancyStatus || "",
        leaseStartDate: property.leaseStartDate ? new Date(property.leaseStartDate).toISOString().split('T')[0] : "",
        leaseEndDate: property.leaseEndDate ? new Date(property.leaseEndDate).toISOString().split('T')[0] : "",
        address: {
          street: property.address.street || "",
          unit: property.address.unit || "",
          city: property.address.city || "",
          state: property.address.state || "",
          zipCode: property.address.zipCode || "",
        },
      });
    }
  }, [property]);

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith("address.")) {
      const addressField = field.split(".")[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // The update mutation only accepts limited fields
      await updateProperty({
        id: propertyId,
        monthlyRent: formData.monthlyRent ? parseFloat(formData.monthlyRent) : undefined,
        securityDeposit: formData.securityDeposit ? parseFloat(formData.securityDeposit) : undefined,
        leaseStartDate: formData.leaseStartDate ? new Date(formData.leaseStartDate).getTime() : undefined,
        leaseEndDate: formData.leaseEndDate ? new Date(formData.leaseEndDate).getTime() : undefined,
        status: formData.status as "accepted" | "under_review" | "rejected" || undefined,
      });
      router.push(`/properties/${propertyId}`);
    } catch (error) {
      console.error("Error updating property:", error);
    } finally {
      setIsSaving(false);
    }
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
                The property you're trying to edit doesn't exist.
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

  return (
    <AppLayout user={user}>
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-neutral-06 mb-2">
              <Button
                size="sm"
                variant="light"
                startContent={<Icon icon="solar:arrow-left-linear" />}
                onPress={() => router.push(`/properties/${propertyId}`)}
                className="p-0"
              >
                Back to Property
              </Button>
            </div>
            <h1 className="text-3xl font-bold">Edit Property</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="bordered"
              onPress={() => router.push(`/properties/${propertyId}`)}
            >
              Cancel
            </Button>
            <Button
              className="bg-primary text-white"
              isLoading={isSaving}
              onPress={handleSave}
            >
              Save Changes
            </Button>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Basic Information</h3>
            </CardHeader>
            <Divider />
            <CardBody className="gap-4">
              <Input
                label="Property Name"
                placeholder="Enter property name"
                value={formData.propertyName}
                onValueChange={(value) => handleInputChange("propertyName", value)}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Property Type"
                  placeholder="Select property type"
                  selectedKeys={formData.propertyType ? [formData.propertyType] : []}
                  onSelectionChange={(keys) => handleInputChange("propertyType", Array.from(keys)[0] as string)}
                >
                  <SelectItem key="single_family">Single Family</SelectItem>
                  <SelectItem key="multi_family">Multi Family</SelectItem>
                  <SelectItem key="condo">Condo</SelectItem>
                  <SelectItem key="townhouse">Townhouse</SelectItem>
                  <SelectItem key="apartment">Apartment</SelectItem>
                  <SelectItem key="commercial">Commercial</SelectItem>
                  <SelectItem key="other">Other</SelectItem>
                </Select>
                <Select
                  label="Status"
                  placeholder="Select status"
                  selectedKeys={formData.status ? [formData.status] : []}
                  onSelectionChange={(keys) => handleInputChange("status", Array.from(keys)[0] as string)}
                >
                  <SelectItem key="accepted">Accepted</SelectItem>
                  <SelectItem key="under_review">Under Review</SelectItem>
                  <SelectItem key="rejected">Rejected</SelectItem>
                </Select>
              </div>
            </CardBody>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Address</h3>
            </CardHeader>
            <Divider />
            <CardBody className="gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Street Address"
                  placeholder="123 Main St"
                  value={formData.address.street}
                  onValueChange={(value) => handleInputChange("address.street", value)}
                  className="sm:col-span-2"
                />
                <Input
                  label="Unit/Apt"
                  placeholder="Unit 101"
                  value={formData.address.unit}
                  onValueChange={(value) => handleInputChange("address.unit", value)}
                />
                <Input
                  label="City"
                  placeholder="San Francisco"
                  value={formData.address.city}
                  onValueChange={(value) => handleInputChange("address.city", value)}
                />
                <Input
                  label="State"
                  placeholder="CA"
                  value={formData.address.state}
                  onValueChange={(value) => handleInputChange("address.state", value)}
                />
                <Input
                  label="ZIP Code"
                  placeholder="94102"
                  value={formData.address.zipCode}
                  onValueChange={(value) => handleInputChange("address.zipCode", value)}
                />
              </div>
            </CardBody>
          </Card>

          {/* Property Details */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Property Details</h3>
            </CardHeader>
            <Divider />
            <CardBody className="gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input
                  type="number"
                  label="Bedrooms"
                  placeholder="3"
                  value={formData.bedrooms}
                  onValueChange={(value) => handleInputChange("bedrooms", value)}
                />
                <Input
                  type="number"
                  label="Bathrooms"
                  placeholder="2.5"
                  step="0.5"
                  value={formData.bathrooms}
                  onValueChange={(value) => handleInputChange("bathrooms", value)}
                />
                <Input
                  type="number"
                  label="Square Feet"
                  placeholder="1500"
                  value={formData.squareFeet}
                  onValueChange={(value) => handleInputChange("squareFeet", value)}
                />
                <Input
                  type="number"
                  label="Year Built"
                  placeholder="2010"
                  value={formData.yearBuilt}
                  onValueChange={(value) => handleInputChange("yearBuilt", value)}
                />
                <Select
                  label="Occupancy Status"
                  placeholder="Select occupancy status"
                  selectedKeys={formData.occupancyStatus ? [formData.occupancyStatus] : []}
                  onSelectionChange={(keys) => handleInputChange("occupancyStatus", Array.from(keys)[0] as string)}
                >
                  <SelectItem key="occupied">Occupied</SelectItem>
                  <SelectItem key="vacant">Vacant</SelectItem>
                  <SelectItem key="partially_occupied">Partially Occupied</SelectItem>
                </Select>
              </div>
            </CardBody>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Financial Information</h3>
            </CardHeader>
            <Divider />
            <CardBody className="gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  type="number"
                  label="Monthly Rent"
                  placeholder="2500"
                  startContent={<span className="text-default-400">$</span>}
                  value={formData.monthlyRent}
                  onValueChange={(value) => handleInputChange("monthlyRent", value)}
                />
                <Input
                  type="number"
                  label="Security Deposit"
                  placeholder="2500"
                  startContent={<span className="text-default-400">$</span>}
                  value={formData.securityDeposit}
                  onValueChange={(value) => handleInputChange("securityDeposit", value)}
                />
                <Input
                  type="number"
                  label="Purchase Price"
                  placeholder="500000"
                  startContent={<span className="text-default-400">$</span>}
                  value={formData.purchasePrice}
                  onValueChange={(value) => handleInputChange("purchasePrice", value)}
                />
                <Input
                  type="date"
                  label="Purchase Date"
                  value={formData.purchaseDate}
                  onValueChange={(value) => handleInputChange("purchaseDate", value)}
                />
                <Input
                  type="number"
                  label="Estimated Value"
                  placeholder="550000"
                  startContent={<span className="text-default-400">$</span>}
                  value={formData.estimatedValue}
                  onValueChange={(value) => handleInputChange("estimatedValue", value)}
                />
              </div>
            </CardBody>
          </Card>

          {/* Lease Information */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Lease Information</h3>
            </CardHeader>
            <Divider />
            <CardBody className="gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  type="date"
                  label="Lease Start Date"
                  value={formData.leaseStartDate}
                  onValueChange={(value) => handleInputChange("leaseStartDate", value)}
                />
                <Input
                  type="date"
                  label="Lease End Date"
                  value={formData.leaseEndDate}
                  onValueChange={(value) => handleInputChange("leaseEndDate", value)}
                />
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}