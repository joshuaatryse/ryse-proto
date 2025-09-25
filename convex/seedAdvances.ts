import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const seedAdvances = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("Starting to seed advances...");

    // Get the first property manager
    const propertyManager = await ctx.db
      .query("propertyManagers")
      .first();

    if (!propertyManager) {
      throw new Error("No property manager found. Please create a property manager first.");
    }

    console.log(`Found property manager: ${propertyManager.firstName} ${propertyManager.lastName}`);

    // Get all properties with their owners
    const properties = await ctx.db
      .query("properties")
      .collect();

    if (properties.length === 0) {
      throw new Error("No properties found. Please create properties first.");
    }

    console.log(`Found ${properties.length} properties`);

    // Get unique owners
    const ownerIds = Array.from(new Set(properties.map(p => p.ownerId)));
    console.log(`Found ${ownerIds.length} unique owners`);

    const advances = [];
    const commissionRate = 0.02; // 2% commission rate
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneMonth = 30 * oneDay;

    // Helper function to get random date in range
    const randomDate = (start: number, end: number) => {
      return start + Math.floor(Math.random() * (end - start));
    };

    // Helper function to get random element from array
    const randomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    // Create 75+ advances with various states
    let advanceCount = 0;
    const targetAdvances = 80; // Create a few extra to ensure we have at least 75

    // Distribute advances across different states
    const stateDistribution = {
      new: 15,        // Just created/approved
      disbursed: 20,  // Active, no payments yet
      partial: 20,    // 20-40% paid back
      mostly: 15,     // 60-80% paid back
      completed: 10   // Fully repaid
    };

    // Create advances for each state
    for (const [state, count] of Object.entries(stateDistribution)) {
      for (let i = 0; i < count && advanceCount < targetAdvances; i++) {
        const property = randomElement(properties);
        const monthlyRent = property.monthlyRent || 3000 + Math.floor(Math.random() * 7000);
        const termMonths = 6 + Math.floor(Math.random() * 6); // 6-11 months
        const amount = Math.floor(monthlyRent * termMonths * 0.9); // 90% of lease value
        const commissionAmount = Math.floor(amount * commissionRate);

        let advance: any = {
          propertyId: property._id,
          ownerId: property.ownerId,
          propertyManagerId: propertyManager._id,
          amount,
          requestedAmount: amount,
          termMonths,
          monthlyRentAmount: monthlyRent,
          commissionRate,
          commissionAmount,
          createdAt: now,
          updatedAt: now,
        };

        // Set dates and status based on state
        switch (state) {
          case 'new':
            // Recently approved/disbursed (within last week)
            advance.status = Math.random() > 0.5 ? "approved" : "disbursed";
            advance.requestedAt = randomDate(now - 7 * oneDay, now - oneDay);
            advance.approvedAt = advance.requestedAt + 2 * oneDay;
            if (advance.status === "disbursed") {
              advance.disbursedAt = advance.approvedAt + oneDay;
              advance.startDate = advance.disbursedAt;
              advance.endDate = advance.disbursedAt + (termMonths * oneMonth);
              advance.monthsUtilized = 0;
              advance.remainingBalance = amount;
            }
            break;

          case 'disbursed':
            // Active with no payments (1-2 months old)
            advance.status = "disbursed";
            advance.requestedAt = randomDate(now - 60 * oneDay, now - 30 * oneDay);
            advance.approvedAt = advance.requestedAt + 2 * oneDay;
            advance.disbursedAt = advance.approvedAt + oneDay;
            advance.startDate = advance.disbursedAt;
            advance.endDate = advance.disbursedAt + (termMonths * oneMonth);
            advance.monthsUtilized = 0;
            advance.remainingBalance = amount;
            break;

          case 'partial':
            // 20-40% paid back (2-4 months old)
            advance.status = "disbursed";
            const partialMonths = Math.floor(termMonths * (0.2 + Math.random() * 0.2));
            advance.requestedAt = randomDate(now - 120 * oneDay, now - 60 * oneDay);
            advance.approvedAt = advance.requestedAt + 2 * oneDay;
            advance.disbursedAt = advance.approvedAt + oneDay;
            advance.startDate = advance.disbursedAt;
            advance.endDate = advance.disbursedAt + (termMonths * oneMonth);
            advance.monthsUtilized = partialMonths;
            advance.remainingBalance = Math.floor(amount * (1 - partialMonths / termMonths));
            advance.lastUtilizationDate = now - 15 * oneDay;
            break;

          case 'mostly':
            // 60-80% paid back (4-8 months old)
            advance.status = "disbursed";
            const mostlyMonths = Math.floor(termMonths * (0.6 + Math.random() * 0.2));
            advance.requestedAt = randomDate(now - 240 * oneDay, now - 120 * oneDay);
            advance.approvedAt = advance.requestedAt + 2 * oneDay;
            advance.disbursedAt = advance.approvedAt + oneDay;
            advance.startDate = advance.disbursedAt;
            advance.endDate = advance.disbursedAt + (termMonths * oneMonth);
            advance.monthsUtilized = mostlyMonths;
            advance.remainingBalance = Math.floor(amount * (1 - mostlyMonths / termMonths));
            advance.lastUtilizationDate = now - 10 * oneDay;
            break;

          case 'completed':
            // Fully repaid (6-12 months old)
            advance.status = "repaid";
            advance.requestedAt = randomDate(now - 365 * oneDay, now - 180 * oneDay);
            advance.approvedAt = advance.requestedAt + 2 * oneDay;
            advance.disbursedAt = advance.approvedAt + oneDay;
            advance.startDate = advance.disbursedAt;
            advance.endDate = advance.disbursedAt + (termMonths * oneMonth);
            advance.monthsUtilized = termMonths;
            advance.remainingBalance = 0;
            advance.completedAt = advance.disbursedAt + (termMonths * oneMonth);
            advance.lastUtilizationDate = advance.completedAt;
            break;
        }

        // Add owner response for approved/disbursed advances
        if (["approved", "disbursed", "repaid"].includes(advance.status)) {
          advance.ownerResponseType = "accept";
          advance.ownerRespondedAt = advance.approvedAt - oneDay;
        }

        advances.push(advance);
        advanceCount++;
      }
    }

    // Insert all advances
    console.log(`Creating ${advances.length} advances...`);
    const createdAdvanceIds = [];

    for (const advance of advances) {
      try {
        const id = await ctx.db.insert("advances", advance);
        createdAdvanceIds.push(id);
      } catch (error) {
        console.error("Error creating advance:", error);
      }
    }

    console.log(`Successfully created ${createdAdvanceIds.length} advances`);

    // Return summary statistics
    const summary = {
      totalCreated: createdAdvanceIds.length,
      byStatus: {
        approved: advances.filter(a => a.status === "approved").length,
        disbursed: advances.filter(a => a.status === "disbursed").length,
        repaid: advances.filter(a => a.status === "repaid").length,
      },
      byUtilization: {
        new: advances.filter(a => a.monthsUtilized === 0 && a.status !== "repaid").length,
        partial: advances.filter(a => a.monthsUtilized > 0 && a.monthsUtilized < a.termMonths * 0.4).length,
        mostly: advances.filter(a => a.monthsUtilized >= a.termMonths * 0.6 && a.status !== "repaid").length,
        completed: advances.filter(a => a.status === "repaid").length,
      },
      totalAmount: advances.reduce((sum, a) => sum + a.amount, 0),
      totalCommission: advances.reduce((sum, a) => sum + a.commissionAmount, 0),
      totalOutstanding: advances.filter(a => a.status === "disbursed").reduce((sum, a) => sum + (a.remainingBalance || 0), 0),
    };

    return summary;
  },
});

// Optional: Clear all advances (useful for testing)
export const clearAdvances = mutation({
  args: {},
  handler: async (ctx) => {
    const advances = await ctx.db.query("advances").collect();
    console.log(`Deleting ${advances.length} advances...`);

    for (const advance of advances) {
      await ctx.db.delete(advance._id);
    }

    return { deleted: advances.length };
  },
});