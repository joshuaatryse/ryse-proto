"use client";

import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button, Card, CardBody, CardHeader, Spinner, Code } from "@heroui/react";
import { Icon } from "@iconify/react";

export default function SeedPropertiesPage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const seedProperties = useMutation(api.seedPropertiesForAdvances.seedPropertiesForAdvances);
  const clearProperties = useMutation(api.seedPropertiesForAdvances.clearProperties);

  const handleSeed = async () => {
    setIsSeeding(true);
    setError(null);
    setResult(null);

    try {
      const summary = await seedProperties();
      setResult(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to seed properties");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("Are you sure you want to delete all properties? This cannot be undone.")) {
      return;
    }

    setIsSeeding(true);
    setError(null);
    setResult(null);

    try {
      const result = await clearProperties();
      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear properties");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-01 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Seed Properties for Advances</h1>
          <p className="text-neutral-06">
            Generate properties for all existing advances to ensure data consistency.
          </p>
        </div>

        <Card>
          <CardHeader className="bg-primary-01">
            <h2 className="text-lg font-semibold">Generate Properties</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="bg-neutral-01 rounded-lg p-4">
              <h3 className="font-medium mb-2">This will create:</h3>
              <ul className="space-y-1 text-sm text-neutral-07">
                <li className="flex items-start gap-2">
                  <Icon icon="solar:check-circle-bold" className="text-success-600 mt-0.5" />
                  <span>Properties for all advances that don't have matching properties</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon icon="solar:check-circle-bold" className="text-success-600 mt-0.5" />
                  <span>Realistic addresses in major US cities</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon icon="solar:check-circle-bold" className="text-success-600 mt-0.5" />
                  <span>All properties set to "accepted" status</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon icon="solar:check-circle-bold" className="text-success-600 mt-0.5" />
                  <span>Properties linked to existing owners and PM</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon icon="solar:check-circle-bold" className="text-success-600 mt-0.5" />
                  <span>Monthly rent matching advance amounts</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon icon="solar:check-circle-bold" className="text-success-600 mt-0.5" />
                  <span>Lease dates based on advance terms</span>
                </li>
              </ul>
            </div>

            <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Icon icon="solar:info-circle-bold" className="text-warning-600 mt-0.5" />
                <div>
                  <p className="font-medium text-warning-700">Important</p>
                  <p className="text-sm text-warning-600 mt-1">
                    Run this AFTER seeding advances to ensure all advances have corresponding properties.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                className="bg-primary text-white"
                size="lg"
                startContent={
                  isSeeding ? <Spinner size="sm" color="white" /> : <Icon icon="solar:home-add-bold" />
                }
                onPress={handleSeed}
                isDisabled={isSeeding}
              >
                {isSeeding ? "Generating Properties..." : "Generate Properties"}
              </Button>

              <Button
                color="danger"
                variant="flat"
                size="lg"
                startContent={<Icon icon="solar:trash-bin-trash-bold" />}
                onPress={handleClear}
                isDisabled={isSeeding}
              >
                Clear All Properties
              </Button>
            </div>

            {error && (
              <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Icon icon="solar:danger-triangle-bold" className="text-danger-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-danger-700">Error</p>
                    <p className="text-sm text-danger-600 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {result && (
              <div className="bg-success-50 border border-success-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Icon icon="solar:check-circle-bold" className="text-success-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-success-700">
                      {result.deleted !== undefined ? 'Properties Cleared' : 'Properties Created Successfully!'}
                    </p>
                    {result.deleted !== undefined ? (
                      <p className="text-sm text-success-600 mt-1">
                        Deleted {result.deleted} properties
                      </p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-neutral-06">Total Created:</p>
                            <p className="font-semibold text-neutral-09">{result.totalCreated}</p>
                          </div>
                          <div>
                            <p className="text-neutral-06">Total Advances:</p>
                            <p className="font-semibold text-neutral-09">{result.totalAdvances}</p>
                          </div>
                          <div>
                            <p className="text-neutral-06">Existing Properties:</p>
                            <p className="font-semibold text-neutral-09">{result.existingProperties}</p>
                          </div>
                          <div>
                            <p className="text-neutral-06">Errors:</p>
                            <p className="font-semibold text-neutral-09">{result.errors}</p>
                          </div>
                        </div>

                        {result.propertyTypes && (
                          <div className="border-t border-success-200 pt-2 mt-3">
                            <p className="text-sm font-medium text-success-700 mb-2">Property Types Created:</p>
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div className="bg-white rounded px-2 py-1">
                                <span className="text-neutral-06">Single Family:</span>{" "}
                                <span className="font-medium">{result.propertyTypes.single_family}</span>
                              </div>
                              <div className="bg-white rounded px-2 py-1">
                                <span className="text-neutral-06">Multi Family:</span>{" "}
                                <span className="font-medium">{result.propertyTypes.multi_family}</span>
                              </div>
                              <div className="bg-white rounded px-2 py-1">
                                <span className="text-neutral-06">Condo:</span>{" "}
                                <span className="font-medium">{result.propertyTypes.condo}</span>
                              </div>
                              <div className="bg-white rounded px-2 py-1">
                                <span className="text-neutral-06">Townhouse:</span>{" "}
                                <span className="font-medium">{result.propertyTypes.townhouse}</span>
                              </div>
                              <div className="bg-white rounded px-2 py-1">
                                <span className="text-neutral-06">Apartment:</span>{" "}
                                <span className="font-medium">{result.propertyTypes.apartment}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {result.errorDetails && result.errorDetails.length > 0 && (
                          <div className="border-t border-success-200 pt-2 mt-3">
                            <p className="text-sm font-medium text-danger-700 mb-2">Errors Encountered:</p>
                            <div className="bg-danger-50 rounded p-2 max-h-32 overflow-y-auto">
                              {result.errorDetails.map((err: any, idx: number) => (
                                <div key={idx} className="text-xs text-danger-600">
                                  Advance {err.advanceId}: {err.error}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Instructions</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="text-sm text-neutral-07">
              To use this seeding script:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-neutral-07">
              <li>First run the "Seed Advances" script at /seed-advances</li>
              <li>Then run this script to create matching properties</li>
              <li>All properties will be linked to the correct owners and PM</li>
              <li>Properties will have realistic addresses and data</li>
            </ol>
            <div className="bg-info-50 border border-info-200 rounded-lg p-3 mt-4">
              <p className="text-sm text-info-700">
                <strong>Tip:</strong> After running both scripts, you'll have a complete dataset with
                properties and advances that match real-world scenarios.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}