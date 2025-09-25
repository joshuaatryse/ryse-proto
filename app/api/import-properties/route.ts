import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "");

interface PropertyRow {
  propertyName?: string;
  propertyType?: string;
  street: string;
  unit?: string;
  city: string;
  state: string;
  zipCode: string;
  bedrooms: string | number;
  bathrooms: string | number;
  squareFeet?: string | number;
  yearBuilt?: string | number;
  estimatedValue?: string | number;
  purchasePrice?: string | number;
  purchaseDate?: string;
  monthlyRent: string | number;
  securityDeposit: string | number;
  leaseStartDate?: string;
  leaseEndDate?: string;
  occupancyStatus?: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
}

function parseCSV(csvText: string): PropertyRow[] {
  const lines = csvText.split("\n").filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error("CSV file must have headers and at least one data row");
  }

  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  const properties: PropertyRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue;

    const property: any = {};
    headers.forEach((header, index) => {
      let value = values[index]?.trim().replace(/^"|"$/g, "") || "";
      property[header] = value;
    });

    // Validate required fields
    if (property.street && property.city && property.state && property.zipCode &&
        property.monthlyRent && property.securityDeposit && property.ownerName && property.ownerEmail) {
      properties.push(property as PropertyRow);
    }
  }

  return properties;
}

function parseCSVLine(line: string): string[] {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip the next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current); // Don't forget the last field
  return result;
}

function validatePropertyType(type: string): string {
  const validTypes = ["single_family", "multi_family", "condo", "townhouse", "apartment", "commercial", "other"];
  const normalized = type?.toLowerCase().replace(/\s+/g, "_");
  return validTypes.includes(normalized) ? normalized : "single_family";
}

function validateOccupancyStatus(status: string): "occupied" | "vacant" | "maintenance" {
  const normalized = status?.toLowerCase();
  if (normalized === "vacant") return "vacant";
  if (normalized === "maintenance") return "maintenance";
  return "occupied";
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const propertyManagerId = formData.get("propertyManagerId") as string;

    if (!file || !propertyManagerId) {
      return NextResponse.json(
        { error: "Missing file or propertyManagerId" },
        { status: 400 }
      );
    }

    // Read and parse CSV
    const csvText = await file.text();
    let properties: PropertyRow[];

    try {
      properties = parseCSV(csvText);
    } catch (parseError: any) {
      return NextResponse.json(
        { error: `CSV parsing error: ${parseError.message}` },
        { status: 400 }
      );
    }

    if (properties.length === 0) {
      return NextResponse.json(
        { error: "No valid properties found in CSV" },
        { status: 400 }
      );
    }

    // Process each property
    const results = [];
    const errors = [];
    const ownerCache = new Map<string, Id<"owners">>();

    for (let i = 0; i < properties.length; i++) {
      const property = properties[i];

      try {
        // Get or create owner
        let ownerId = ownerCache.get(property.ownerEmail);

        if (!ownerId) {
          // Check if owner already exists
          const existingOwners = await convex.query(api.owners.getByPropertyManager, {
            propertyManagerId: propertyManagerId as Id<"propertyManagers">,
          });

          const existingOwner = existingOwners.find(o => o.email === property.ownerEmail);

          if (existingOwner) {
            ownerId = existingOwner._id;
          } else {
            // Create new owner
            ownerId = await convex.mutation(api.owners.create, {
              name: property.ownerName,
              email: property.ownerEmail,
              phone: property.ownerPhone || undefined,
              propertyManagerId: propertyManagerId as Id<"propertyManagers">,
            });
          }

          ownerCache.set(property.ownerEmail, ownerId);
        }

        // Create property
        const propertyId = await convex.mutation(api.properties.create, {
          propertyManagerId: propertyManagerId as Id<"propertyManagers">,
          ownerId: ownerId,
          propertyName: property.propertyName || undefined,
          propertyType: validatePropertyType(property.propertyType || "single_family") as any,
          address: {
            street: property.street,
            unit: property.unit || undefined,
            city: property.city,
            state: property.state.toUpperCase(),
            zipCode: property.zipCode,
            country: "USA",
            fullAddress: `${property.street}${property.unit ? ` ${property.unit}` : ""}, ${property.city}, ${property.state} ${property.zipCode}`,
          },
          bedrooms: Number(property.bedrooms) || 0,
          bathrooms: Number(property.bathrooms) || 0,
          squareFeet: property.squareFeet ? Number(property.squareFeet) : undefined,
          yearBuilt: property.yearBuilt ? Number(property.yearBuilt) : undefined,
          estimatedValue: property.estimatedValue ? Number(property.estimatedValue) : Number(property.monthlyRent) * 12 * 10,
          purchasePrice: property.purchasePrice ? Number(property.purchasePrice) : undefined,
          purchaseDate: property.purchaseDate ? new Date(property.purchaseDate).getTime() : undefined,
          monthlyRent: Number(property.monthlyRent),
          securityDeposit: Number(property.securityDeposit),
          leaseStartDate: property.leaseStartDate ? new Date(property.leaseStartDate).getTime() : undefined,
          leaseEndDate: property.leaseEndDate ? new Date(property.leaseEndDate).getTime() : undefined,
          occupancyStatus: validateOccupancyStatus(property.occupancyStatus || "occupied"),
          status: "under_review",
        });

        results.push({
          row: i + 2, // Row number in CSV (accounting for header and 0-index)
          propertyId,
          address: `${property.street}${property.unit ? ` ${property.unit}` : ""}, ${property.city}, ${property.state}`,
          status: "success",
        });

      } catch (error: any) {
        errors.push({
          row: i + 2,
          address: `${property.street}${property.unit ? ` ${property.unit}` : ""}, ${property.city}, ${property.state}`,
          error: error.message || "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      total: properties.length,
      imported: results,
      errors: errors,
      summary: {
        successful: results.length,
        failed: errors.length,
        total: properties.length,
      },
    });

  } catch (error) {
    console.error("Error in import-properties API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}