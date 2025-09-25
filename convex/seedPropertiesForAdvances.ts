import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const seedPropertiesForAdvances = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("Starting to create properties for advances...");

    // Get all advances
    const advances = await ctx.db.query("advances").collect();

    if (advances.length === 0) {
      throw new Error("No advances found. Please seed advances first.");
    }

    console.log(`Found ${advances.length} advances`);

    // Get all existing properties to avoid duplicates
    const existingProperties = await ctx.db.query("properties").collect();
    const existingPropertyIds = new Set(existingProperties.map(p => p._id));

    // Get the first property manager
    const propertyManager = await ctx.db.query("propertyManagers").first();

    if (!propertyManager) {
      throw new Error("No property manager found");
    }

    // Track unique property IDs that need to be created
    const propertiesToCreate = new Map<string, any>();

    // Property type options
    const propertyTypes = ["single_family", "multi_family", "condo", "townhouse", "apartment"];

    // Cities and states for addresses
    const locations = [
      { city: "Los Angeles", state: "CA", zipCodes: ["90001", "90210", "90405", "90024", "90291"] },
      { city: "San Francisco", state: "CA", zipCodes: ["94102", "94110", "94114", "94122", "94133"] },
      { city: "San Diego", state: "CA", zipCodes: ["92101", "92109", "92122", "92130", "92037"] },
      { city: "Austin", state: "TX", zipCodes: ["78701", "78702", "78703", "78704", "78705"] },
      { city: "Denver", state: "CO", zipCodes: ["80202", "80203", "80204", "80205", "80206"] },
      { city: "Seattle", state: "WA", zipCodes: ["98101", "98102", "98103", "98104", "98105"] },
      { city: "Portland", state: "OR", zipCodes: ["97201", "97202", "97203", "97204", "97205"] },
      { city: "Phoenix", state: "AZ", zipCodes: ["85001", "85002", "85003", "85004", "85005"] },
    ];

    // Street names for generating addresses
    const streetNames = [
      "Maple", "Oak", "Elm", "Pine", "Cedar", "Birch", "Willow", "Cherry",
      "Main", "First", "Second", "Third", "Park", "Lake", "River", "Ocean",
      "Sunset", "Sunrise", "Mountain", "Valley", "Highland", "Meadow", "Forest",
      "Washington", "Jefferson", "Lincoln", "Madison", "Monroe", "Jackson"
    ];

    const streetTypes = ["Street", "Avenue", "Boulevard", "Drive", "Lane", "Road", "Way", "Court"];

    // Process each advance that doesn't have a property yet
    for (const advance of advances) {
      // Skip if property already exists
      if (existingPropertyIds.has(advance.propertyId)) {
        console.log(`Property ${advance.propertyId} already exists, skipping`);
        continue;
      }

      // Skip if we already planned to create this property
      if (propertiesToCreate.has(advance.propertyId)) {
        continue;
      }

      // Generate property data based on advance
      const location = locations[Math.floor(Math.random() * locations.length)];
      const streetNum = 100 + Math.floor(Math.random() * 9900);
      const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
      const streetType = streetTypes[Math.floor(Math.random() * streetTypes.length)];
      const unit = Math.random() > 0.5 ? `${Math.floor(Math.random() * 999) + 1}` : undefined;

      const propertyData = {
        _id: advance.propertyId,
        propertyName: `${streetNum} ${streetName} ${unit ? `Unit ${unit}` : ""}`,
        address: {
          street: `${streetNum} ${streetName} ${streetType}`,
          unit,
          city: location.city,
          state: location.state,
          zipCode: location.zipCodes[Math.floor(Math.random() * location.zipCodes.length)],
          fullAddress: `${streetNum} ${streetName} ${streetType}${unit ? ` Unit ${unit}` : ""}, ${location.city}, ${location.state}`,
        },
        ownerId: advance.ownerId,
        propertyManagerId: propertyManager._id,
        propertyType: propertyTypes[Math.floor(Math.random() * propertyTypes.length)],
        monthlyRent: advance.monthlyRentAmount || 3000 + Math.floor(Math.random() * 7000),
        securityDeposit: Math.floor((advance.monthlyRentAmount || 4000) * 1.5),
        status: "accepted", // All properties with advances should be accepted
        hasActiveAdvance: ["disbursed", "approved"].includes(advance.status),
        activeAdvanceAmount: ["disbursed", "approved"].includes(advance.status) ? advance.amount : 0,
        advanceStatus: advance.status,
        latestAdvance: {
          _id: advance._id,
          amount: advance.amount,
          status: advance.status,
          remainingBalance: advance.remainingBalance,
          commissionAmount: advance.commissionAmount
        },
        leaseStartDate: Date.now() - (365 * 24 * 60 * 60 * 1000), // 1 year ago
        leaseEndDate: Date.now() + (advance.termMonths || 6) * 30 * 24 * 60 * 60 * 1000, // Based on advance term
        occupancyStatus: "occupied",
        ownerSignature: true,
        ownerIsBusinessEntity: Math.random() > 0.7,
        createdAt: advance.requestedAt || Date.now(),
        updatedAt: Date.now(),
      };

      propertiesToCreate.set(advance.propertyId, propertyData);
    }

    // Create all the properties
    console.log(`Creating ${propertiesToCreate.size} properties...`);
    const createdPropertyIds = [];
    const errors = [];

    for (const [propertyId, propertyData] of Array.from(propertiesToCreate)) {
      try {
        // Remove the _id from the data as Convex will generate it
        const { _id, ...dataToInsert } = propertyData;

        // Insert the property with a specific ID if needed
        const id = await ctx.db.insert("properties", dataToInsert);
        createdPropertyIds.push(id);

        // Update the advance with the correct property ID
        await ctx.db.patch(propertyData.latestAdvance._id, {
          propertyId: id
        });

      } catch (error) {
        console.error(`Error creating property for advance ${propertyData.latestAdvance._id}:`, error);
        errors.push({
          advanceId: propertyData.latestAdvance._id,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    console.log(`Successfully created ${createdPropertyIds.length} properties`);

    // Return summary
    return {
      totalCreated: createdPropertyIds.length,
      totalAdvances: advances.length,
      existingProperties: existingPropertyIds.size,
      errors: errors.length,
      errorDetails: errors,
      propertyTypes: {
        single_family: Array.from(propertiesToCreate.values()).filter(p => p.propertyType === "single_family").length,
        multi_family: Array.from(propertiesToCreate.values()).filter(p => p.propertyType === "multi_family").length,
        condo: Array.from(propertiesToCreate.values()).filter(p => p.propertyType === "condo").length,
        townhouse: Array.from(propertiesToCreate.values()).filter(p => p.propertyType === "townhouse").length,
        apartment: Array.from(propertiesToCreate.values()).filter(p => p.propertyType === "apartment").length,
      }
    };
  },
});

// Clear all properties (useful for testing)
export const clearProperties = mutation({
  args: {},
  handler: async (ctx) => {
    const properties = await ctx.db.query("properties").collect();
    console.log(`Deleting ${properties.length} properties...`);

    for (const property of properties) {
      await ctx.db.delete(property._id);
    }

    return { deleted: properties.length };
  },
});