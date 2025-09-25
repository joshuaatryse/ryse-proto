"use client";

import React, { useState, useRef } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  Input,
  Button,
  Select,
  SelectItem,
  Tabs,
  Tab,
  Card,
  CardBody,
  Spinner,
  Chip,
  Progress,
  Divider,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface AddPropertyTrayProps {
  isOpen: boolean;
  onClose: () => void;
  propertyManagerId: string;
}

interface PropertyFormData {
  // Address
  propertyType: string;
  street: string;
  unit: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;

  // Lease
  monthlyRent: string;
  securityDeposit: string;
  leaseStartDate: string;
  leaseEndDate: string;
  occupancyStatus: string;

  // Owner
  ownerIsBusinessEntity?: boolean;
  ownerName: string;
  ownerSignatory?: string;
  ownerEmail: string;
  ownerPhone: string;

  // Signatures
  ownerSignature?: boolean;
  tenantSignature?: boolean;
  tenantName?: string;
  tenantEmail?: string;
  tenantPhone?: string;
}

const initialFormData: PropertyFormData = {
  propertyType: "single_family",
  street: "",
  unit: "",
  city: "",
  state: "",
  zipCode: "",
  country: "USA",
  monthlyRent: "",
  securityDeposit: "",
  leaseStartDate: "",
  leaseEndDate: "",
  occupancyStatus: "occupied",
  ownerIsBusinessEntity: false,
  ownerName: "",
  ownerSignatory: "",
  ownerEmail: "",
  ownerPhone: "",
  ownerSignature: false,
  tenantSignature: false,
  tenantName: "",
  tenantEmail: "",
  tenantPhone: "",
};

export default function AddPropertyTray({
  isOpen,
  onClose,
  propertyManagerId,
}: AddPropertyTrayProps) {
  const [activeTab, setActiveTab] = useState("manual");
  const [formData, setFormData] = useState<PropertyFormData>(initialFormData);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const createProperty = useMutation(api.properties.create);
  const createOwner = useMutation(api.owners.create);
  const createBulkProperties = useMutation(api.properties.createBulk);

  const handleInputChange = (field: keyof PropertyFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePDFUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== "application/pdf") {
      alert("Please upload a PDF file");
      return;
    }

    setIsProcessing(true);
    setUploadProgress(20);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("propertyManagerId", propertyManagerId);

    try {
      setUploadProgress(40);
      const response = await fetch("/api/extract-lease", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(60);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to extract lease data");
      }
      setUploadProgress(80);

      // Update form with extracted data
      if (data.extracted) {
        setFormData(prev => ({
          ...prev,
          ...data.extracted,
        }));
        setExtractedData(data.extracted);
      }

      setUploadProgress(100);
      setTimeout(() => {
        setIsProcessing(false);
        setUploadProgress(0);
      }, 500);
    } catch (error) {
      console.error("Error extracting lease data:", error);
      setIsProcessing(false);
      setUploadProgress(0);

      // Check if we got a specific error message from the API
      let errorMessage = "Failed to extract lease data. Please enter manually.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      alert(errorMessage);
    }
  };

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.name.endsWith(".csv")) {
      alert("Please upload a CSV file");
      return;
    }

    setIsProcessing(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("propertyManagerId", propertyManagerId);

    try {
      const response = await fetch("/api/import-properties", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to import properties");
      }

      const data = await response.json();
      alert(`Successfully imported ${data.count} properties`);
      onClose();
    } catch (error) {
      console.error("Error importing properties:", error);
      alert("Failed to import properties. Please check your CSV format.");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadCSVTemplate = () => {
    const csvContent = `propertyType,street,unit,city,state,zipCode,monthlyRent,securityDeposit,leaseStartDate,leaseEndDate,occupancyStatus,ownerName,ownerEmail,ownerPhone
"apartment","123 Main St","204","Los Angeles","CA","90210",2500,2500,"2024-01-01","2024-12-31","occupied","John Smith","john@example.com","(555) 123-4567"
"single_family","456 Oak Ave","","San Francisco","CA","94102",4500,4500,"2024-03-01","2025-02-28","occupied","Jane Doe","jane@example.com","(555) 987-6543"`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "property_import_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleSubmit = async () => {
    try {
      setIsProcessing(true);

      // Create owner first
      const ownerId = await createOwner({
        name: formData.ownerName,
        email: formData.ownerEmail,
        phone: formData.ownerPhone || undefined,
        propertyManagerId: propertyManagerId as Id<"propertyManagers">,
      });

      // Create property
      await createProperty({
        propertyManagerId: propertyManagerId as Id<"propertyManagers">,
        ownerId: ownerId,
        propertyType: formData.propertyType as any,
        address: {
          street: formData.street,
          unit: formData.unit || undefined,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country || "USA",
          fullAddress: `${formData.street}${formData.unit ? ` ${formData.unit}` : ""}, ${formData.city}, ${formData.state} ${formData.zipCode}`,
        },
        monthlyRent: Number(formData.monthlyRent),
        securityDeposit: Number(formData.securityDeposit),
        leaseStartDate: formData.leaseStartDate ? new Date(formData.leaseStartDate).getTime() : undefined,
        leaseEndDate: formData.leaseEndDate ? new Date(formData.leaseEndDate).getTime() : undefined,
        occupancyStatus: formData.occupancyStatus as any,
        status: "under_review",
      });

      // Reset form and close
      setFormData(initialFormData);
      onClose();
    } catch (error) {
      console.error("Error creating property:", error);
      alert("Failed to create property. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.street &&
      formData.city &&
      formData.state &&
      formData.zipCode &&
      formData.monthlyRent &&
      formData.securityDeposit &&
      formData.ownerName &&
      formData.ownerEmail
    );
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      placement="right"
      classNames={{
        base: "data-[placement=right]:sm:max-w-[600px]",
        body: "px-6 py-4",
      }}
    >
      <DrawerContent>
        <DrawerHeader className="flex flex-col gap-1 pb-4">
          <h2 className="text-xl font-bold">Add Property</h2>
          <p className="text-sm text-neutral-06">
            Add a new property to your portfolio
          </p>
        </DrawerHeader>

        <DrawerBody className="overflow-y-auto">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
            className="mb-6"
          >
            <Tab
              key="manual"
              title={
                <div className="flex items-center gap-2">
                  <Icon icon="solar:pen-linear" />
                  <span>Manual Entry</span>
                </div>
              }
            />
            <Tab
              key="pdf"
              title={
                <div className="flex items-center gap-2">
                  <Icon icon="solar:document-linear" />
                  <span>Upload Lease PDF</span>
                </div>
              }
            />
            <Tab
              key="csv"
              title={
                <div className="flex items-center gap-2">
                  <Icon icon="solar:file-text-linear" />
                  <span>Bulk CSV Import</span>
                </div>
              }
            />
          </Tabs>

          {activeTab === "manual" && (
            <div className="space-y-6">
              {/* Address & Property Type */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Property Details</h3>
                <div className="space-y-4">
                  <Select
                    label="Property Type"
                    selectedKeys={[formData.propertyType]}
                    onChange={(e) => handleInputChange("propertyType", e.target.value)}
                    variant="bordered"
                  >
                    <SelectItem key="single_family">Single Family</SelectItem>
                    <SelectItem key="multi_family">Multi Family</SelectItem>
                    <SelectItem key="condo">Condo</SelectItem>
                    <SelectItem key="townhouse">Townhouse</SelectItem>
                    <SelectItem key="apartment">Apartment</SelectItem>
                    <SelectItem key="commercial">Commercial</SelectItem>
                    <SelectItem key="other">Other</SelectItem>
                  </Select>

                  <div className="grid grid-cols-3 gap-4">
                    <Input
                      label="Street Address"
                      placeholder="123 Main Street"
                      value={formData.street}
                      onChange={(e) => handleInputChange("street", e.target.value)}
                      variant="bordered"
                      isRequired
                      className="col-span-2"
                    />
                    <Input
                      label="Unit/Apt"
                      placeholder="204"
                      value={formData.unit}
                      onChange={(e) => handleInputChange("unit", e.target.value)}
                      variant="bordered"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <Input
                      label="City"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      variant="bordered"
                      isRequired
                    />
                    <Input
                      label="State"
                      value={formData.state}
                      onChange={(e) => handleInputChange("state", e.target.value)}
                      variant="bordered"
                      maxLength={2}
                      isRequired
                    />
                    <Input
                      label="ZIP Code"
                      value={formData.zipCode}
                      onChange={(e) => handleInputChange("zipCode", e.target.value)}
                      variant="bordered"
                      isRequired
                    />
                  </div>
                </div>
              </div>

              <Divider />

              {/* Lease Information */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Lease Information</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Monthly Rent"
                      type="number"
                      value={formData.monthlyRent}
                      onChange={(e) => handleInputChange("monthlyRent", e.target.value)}
                      variant="bordered"
                      startContent="$"
                      isRequired
                    />
                    <Input
                      label="Security Deposit"
                      type="number"
                      value={formData.securityDeposit}
                      onChange={(e) => handleInputChange("securityDeposit", e.target.value)}
                      variant="bordered"
                      startContent="$"
                      isRequired
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Lease Start Date"
                      type="date"
                      value={formData.leaseStartDate}
                      onChange={(e) => handleInputChange("leaseStartDate", e.target.value)}
                      variant="bordered"
                    />
                    <Input
                      label="Lease End Date"
                      type="date"
                      value={formData.leaseEndDate}
                      onChange={(e) => handleInputChange("leaseEndDate", e.target.value)}
                      variant="bordered"
                    />
                  </div>

                  <Select
                    label="Occupancy Status"
                    selectedKeys={[formData.occupancyStatus]}
                    onChange={(e) => handleInputChange("occupancyStatus", e.target.value)}
                    variant="bordered"
                  >
                    <SelectItem key="occupied">Occupied</SelectItem>
                    <SelectItem key="vacant">Vacant</SelectItem>
                    <SelectItem key="maintenance">Under Maintenance</SelectItem>
                  </Select>
                </div>
              </div>

              <Divider />

              {/* Owner Information */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Owner Information</h3>
                <div className="space-y-4">
                  <Input
                    label={formData.ownerIsBusinessEntity ? "Business/Company Name" : "Owner Name"}
                    value={formData.ownerName}
                    onChange={(e) => handleInputChange("ownerName", e.target.value)}
                    variant="bordered"
                    isRequired
                  />
                  {formData.ownerIsBusinessEntity && (
                    <Input
                      label="Authorized Signatory"
                      placeholder="e.g., John Smith, Property Manager"
                      value={formData.ownerSignatory}
                      onChange={(e) => handleInputChange("ownerSignatory", e.target.value)}
                      variant="bordered"
                      description="Name and title of person signing on behalf of the business"
                    />
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Owner Email"
                      type="email"
                      value={formData.ownerEmail}
                      onChange={(e) => handleInputChange("ownerEmail", e.target.value)}
                      variant="bordered"
                      isRequired
                    />
                    <Input
                      label="Owner Phone"
                      type="tel"
                      value={formData.ownerPhone}
                      onChange={(e) => handleInputChange("ownerPhone", e.target.value)}
                      variant="bordered"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "pdf" && (
            <div className="space-y-6">
              <Card>
                <CardBody className="p-6">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-primary-01 rounded-full mx-auto flex items-center justify-center">
                      <Icon icon="solar:document-bold" className="text-primary-06" width={40} />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Upload Lease PDF</h3>
                      <p className="text-sm text-neutral-06 mb-4">
                        Upload a lease agreement PDF and we'll extract the property details automatically using AI
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      onChange={handlePDFUpload}
                      className="hidden"
                    />
                    <Button
                      className="bg-primary text-white"
                      startContent={<Icon icon="solar:upload-bold" />}
                      onPress={() => fileInputRef.current?.click()}
                      isDisabled={isProcessing}
                    >
                      Select PDF File
                    </Button>
                  </div>
                </CardBody>
              </Card>

              {isProcessing && (
                <Card>
                  <CardBody className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Processing lease document...</span>
                        <Chip size="sm" className="bg-primary-01 text-primary-06">
                          {uploadProgress}%
                        </Chip>
                      </div>
                      <Progress value={uploadProgress} className="h-2" color="primary" />
                      <div className="flex items-center gap-2">
                        <Spinner size="sm" />
                        <span className="text-sm text-neutral-06">
                          Extracting data with Ryse AI...
                        </span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )}

              {extractedData && !isProcessing && (
                <div className="space-y-4">
                  <Card>
                    <CardBody className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-success-600">
                          <Icon icon="solar:check-circle-bold" width={24} />
                          <span className="font-semibold">Data Extracted Successfully!</span>
                        </div>

                        {/* Check for expired lease */}
                        {extractedData.leaseEndDate && new Date(extractedData.leaseEndDate) < new Date() && (
                          <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-warning-600">
                              <Icon icon="solar:danger-triangle-bold" width={20} />
                              <span className="font-semibold">Lease Expired</span>
                            </div>
                            <p className="text-sm text-warning-600 mt-1">
                              This lease ended on {new Date(extractedData.leaseEndDate).toLocaleDateString()}.
                              Consider updating the lease terms or marking the property as vacant.
                            </p>
                          </div>
                        )}

                        {/* Owner Type Information */}
                        {extractedData.ownerIsBusinessEntity && (
                          <div className="border border-primary-02 bg-primary-01 rounded-lg p-4">
                            <div className="flex items-start gap-2">
                              <Icon icon="solar:buildings-bold" className="text-primary-06 mt-1" width={20} />
                              <div className="flex-1">
                                <h4 className="font-medium text-primary-07 mb-1">Business Entity Owner</h4>
                                <div className="text-sm text-neutral-06 space-y-1">
                                  <p>Business: {extractedData.ownerName}</p>
                                  {extractedData.ownerSignatory && (
                                    <p>Signed by: {extractedData.ownerSignatory}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Signature verification */}
                        <div className="border border-neutral-02 rounded-lg p-4">
                          <h4 className="font-medium mb-3">Signature Verification</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-neutral-06">
                                {extractedData.ownerIsBusinessEntity ? "Business Representative" : "Owner/Landlord"} Signature
                              </span>
                              {extractedData.ownerSignature ? (
                                <Chip size="sm" className="bg-success-50 text-success-600">
                                  <div className="flex items-center gap-1">
                                    <Icon icon="solar:check-circle-bold" width={16} />
                                    <span>Present</span>
                                  </div>
                                </Chip>
                              ) : (
                                <Chip size="sm" className="bg-error-50 text-error-600">
                                  <div className="flex items-center gap-1">
                                    <Icon icon="solar:close-circle-bold" width={16} />
                                    <span>Missing</span>
                                  </div>
                                </Chip>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-neutral-06">Tenant Signature</span>
                              {extractedData.tenantSignature ? (
                                <Chip size="sm" className="bg-success-50 text-success-600">
                                  <div className="flex items-center gap-1">
                                    <Icon icon="solar:check-circle-bold" width={16} />
                                    <span>Present</span>
                                  </div>
                                </Chip>
                              ) : (
                                <Chip size="sm" className="bg-error-50 text-error-600">
                                  <div className="flex items-center gap-1">
                                    <Icon icon="solar:close-circle-bold" width={16} />
                                    <span>Missing</span>
                                  </div>
                                </Chip>
                              )}
                            </div>
                          </div>
                          {(!extractedData.ownerSignature || !extractedData.tenantSignature) && (
                            <p className="text-xs text-warning-600 mt-3">
                              <Icon icon="solar:info-circle-linear" width={14} className="inline mr-1" />
                              Missing signatures may indicate an incomplete or invalid lease agreement.
                            </p>
                          )}
                        </div>

                        {/* Tenant Information if extracted */}
                        {extractedData.tenantName && (
                          <div className="border border-neutral-02 rounded-lg p-4">
                            <h4 className="font-medium mb-2">Tenant Information</h4>
                            <div className="text-sm text-neutral-06 space-y-1">
                              {extractedData.tenantName && <p>Name: {extractedData.tenantName}</p>}
                              {extractedData.tenantEmail && <p>Email: {extractedData.tenantEmail}</p>}
                              {extractedData.tenantPhone && <p>Phone: {extractedData.tenantPhone}</p>}
                            </div>
                          </div>
                        )}

                        <p className="text-sm text-neutral-06">
                          Review the extracted information below and make any necessary edits:
                        </p>
                        <Button
                          variant="bordered"
                          onPress={() => setActiveTab("manual")}
                          startContent={<Icon icon="solar:pen-linear" />}
                        >
                          Review & Edit Extracted Data
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              )}
            </div>
          )}

          {activeTab === "csv" && (
            <div className="space-y-6">
              <Card>
                <CardBody className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-secondary-01 rounded-full flex items-center justify-center">
                        <Icon icon="solar:file-text-bold" className="text-secondary-06" width={28} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">Download CSV Template</h3>
                        <p className="text-sm text-neutral-06">
                          Get our template with all required fields and example data
                        </p>
                      </div>
                      <Button
                        variant="bordered"
                        startContent={<Icon icon="solar:download-linear" />}
                        onPress={downloadCSVTemplate}
                      >
                        Download Template
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody className="p-6">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-tertiary-01 rounded-full mx-auto flex items-center justify-center">
                      <Icon icon="solar:cloud-upload-bold" className="text-tertiary-06" width={40} />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Upload CSV File</h3>
                      <p className="text-sm text-neutral-06 mb-4">
                        Import multiple properties at once using our CSV format
                      </p>
                    </div>
                    <input
                      ref={csvInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                      className="hidden"
                    />
                    <Button
                      className="bg-primary text-white"
                      startContent={<Icon icon="solar:upload-bold" />}
                      onPress={() => csvInputRef.current?.click()}
                      isDisabled={isProcessing}
                    >
                      {isProcessing ? "Importing..." : "Select CSV File"}
                    </Button>
                  </div>
                </CardBody>
              </Card>

              <Card className="bg-warning-50 border border-warning-200">
                <CardBody className="p-4">
                  <div className="flex gap-3">
                    <Icon icon="solar:info-circle-linear" className="text-warning-600 mt-1" width={20} />
                    <div className="text-sm">
                      <p className="font-medium text-warning-700 mb-1">CSV Format Requirements:</p>
                      <ul className="text-warning-600 space-y-1">
                        <li>• First row must contain column headers</li>
                        <li>• Dates should be in YYYY-MM-DD format</li>
                        <li>• Property types: single_family, multi_family, condo, townhouse, apartment</li>
                        <li>• Occupancy status: occupied, vacant, maintenance</li>
                      </ul>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}
        </DrawerBody>

        <DrawerFooter className="border-t border-neutral-02 pt-4">
          <Button variant="light" onPress={onClose}>
            Cancel
          </Button>
          {activeTab === "manual" && (
            <Button
              className="bg-primary text-white"
              onPress={handleSubmit}
              isDisabled={!isFormValid() || isProcessing}
              isLoading={isProcessing}
            >
              Add Property
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}