"use client";

import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button, Card, CardBody, CardHeader, Spinner, Code } from "@heroui/react";
import { Icon } from "@iconify/react";

export default function SeedAdvancesPage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const seedAdvances = useMutation(api.seedAdvances.seedAdvances);
  const clearAdvances = useMutation(api.seedAdvances.clearAdvances);

  const handleSeed = async () => {
    setIsSeeding(true);
    setError(null);
    setResult(null);

    try {
      const summary = await seedAdvances();
      setResult(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to seed advances");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("Are you sure you want to delete all advances? This cannot be undone.")) {
      return;
    }

    setIsSeeding(true);
    setError(null);
    setResult(null);

    try {
      const result = await clearAdvances();
      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear advances");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-01 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Seed Advances Data</h1>
          <p className="text-neutral-06">
            Generate test advances data for development and testing purposes.
          </p>
        </div>

        <Card>
          <CardHeader className="bg-primary-01">
            <h2 className="text-lg font-semibold">Generate Test Advances</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="bg-neutral-01 rounded-lg p-4">
              <h3 className="font-medium mb-2">This will create:</h3>
              <ul className="space-y-1 text-sm text-neutral-07">
                <li className="flex items-start gap-2">
                  <Icon icon="solar:check-circle-bold" className="text-success-600 mt-0.5" />
                  <span>80 test advances across existing properties</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon icon="solar:check-circle-bold" className="text-success-600 mt-0.5" />
                  <span>15 newly created/approved advances</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon icon="solar:check-circle-bold" className="text-success-600 mt-0.5" />
                  <span>20 active advances with no payments</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon icon="solar:check-circle-bold" className="text-success-600 mt-0.5" />
                  <span>20 partially paid (20-40% complete)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon icon="solar:check-circle-bold" className="text-success-600 mt-0.5" />
                  <span>15 mostly paid (60-80% complete)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon icon="solar:check-circle-bold" className="text-success-600 mt-0.5" />
                  <span>10 fully completed/repaid advances</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                className="bg-primary text-white"
                size="lg"
                startContent={
                  isSeeding ? <Spinner size="sm" color="white" /> : <Icon icon="solar:database-bold" />
                }
                onPress={handleSeed}
                isDisabled={isSeeding}
              >
                {isSeeding ? "Generating Advances..." : "Generate Test Advances"}
              </Button>

              <Button
                color="danger"
                variant="flat"
                size="lg"
                startContent={<Icon icon="solar:trash-bin-trash-bold" />}
                onPress={handleClear}
                isDisabled={isSeeding}
              >
                Clear All Advances
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
                      {result.deleted !== undefined ? 'Advances Cleared' : 'Advances Created Successfully!'}
                    </p>
                    {result.deleted !== undefined ? (
                      <p className="text-sm text-success-600 mt-1">
                        Deleted {result.deleted} advances
                      </p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-neutral-06">Total Created:</p>
                            <p className="font-semibold text-neutral-09">{result.totalCreated}</p>
                          </div>
                          <div>
                            <p className="text-neutral-06">Total Amount:</p>
                            <p className="font-semibold text-neutral-09">
                              ${result.totalAmount?.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-neutral-06">Total Commission:</p>
                            <p className="font-semibold text-neutral-09">
                              ${result.totalCommission?.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-neutral-06">Outstanding:</p>
                            <p className="font-semibold text-neutral-09">
                              ${result.totalOutstanding?.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="border-t border-success-200 pt-2 mt-3">
                          <p className="text-sm font-medium text-success-700 mb-2">By Status:</p>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div className="bg-white rounded px-2 py-1">
                              <span className="text-neutral-06">Approved:</span>{" "}
                              <span className="font-medium">{result.byStatus?.approved}</span>
                            </div>
                            <div className="bg-white rounded px-2 py-1">
                              <span className="text-neutral-06">Disbursed:</span>{" "}
                              <span className="font-medium">{result.byStatus?.disbursed}</span>
                            </div>
                            <div className="bg-white rounded px-2 py-1">
                              <span className="text-neutral-06">Repaid:</span>{" "}
                              <span className="font-medium">{result.byStatus?.repaid}</span>
                            </div>
                          </div>
                        </div>
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
              To run this seeding script, make sure you have:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-neutral-07">
              <li>At least one property manager account created</li>
              <li>Properties with owners already in the system</li>
              <li>Your Convex backend running</li>
            </ol>
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 mt-4">
              <p className="text-sm text-warning-700">
                <strong>Note:</strong> This is for development purposes only. Do not run in production.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}