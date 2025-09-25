import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Mutation to update existing properties to have proper status distribution
export const updateExistingPropertyStatuses = mutation({
  args: {
    propertyManagerId: v.id("propertyManagers"),
  },
  handler: async (ctx, args) => {
    // Get all properties for this property manager
    const properties = await ctx.db
      .query("properties")
      .withIndex("by_property_manager", (q) => q.eq("propertyManagerId", args.propertyManagerId))
      .collect();

    let updatedCount = 0;
    let acceptedCount = 0;
    let underReviewCount = 0;
    let rejectedCount = 0;

    // Shuffle properties to randomize which ones get which status
    const shuffled = [...properties].sort(() => 0.5 - Math.random());

    for (let i = 0; i < shuffled.length; i++) {
      const property = shuffled[i];

      // Skip if property already has a non-under_review status
      if (property.status !== "under_review") {
        if (property.status === "accepted") acceptedCount++;
        else if (property.status === "rejected") rejectedCount++;
        continue;
      }

      // Calculate status based on distribution
      // 90% accepted, 5% under_review, 5% rejected
      const percentage = i / shuffled.length;
      let newStatus: "accepted" | "under_review" | "rejected";
      let rejectionReason = undefined;
      let rejectionNotes = undefined;

      if (percentage < 0.9) {
        newStatus = "accepted";
        acceptedCount++;
      } else if (percentage < 0.95) {
        newStatus = "under_review";
        underReviewCount++;
      } else {
        newStatus = "rejected";
        rejectedCount++;

        // Add random rejection reason
        const reasons = ["no_lease", "lease_ending_soon", "incomplete_documents", "property_condition", "other"];
        const randomReason = reasons[Math.floor(Math.random() * reasons.length)];
        rejectionReason = randomReason as any;
        rejectionNotes = randomReason === "lease_ending_soon" ? "Lease expires in less than 3 months" :
                        randomReason === "no_lease" ? "No valid lease agreement provided" :
                        randomReason === "incomplete_documents" ? "Missing required documentation" :
                        randomReason === "property_condition" ? "Property requires significant repairs" :
                        "Does not meet underwriting criteria";
      }

      // Update property
      await ctx.db.patch(property._id, {
        status: newStatus,
        ...(rejectionReason && { rejectionReason }),
        ...(rejectionNotes && { rejectionNotes }),
        updatedAt: Date.now(),
      });

      updatedCount++;
    }

    return {
      success: true,
      message: `Updated ${updatedCount} properties`,
      stats: {
        total: properties.length,
        updated: updatedCount,
        accepted: acceptedCount,
        underReview: underReviewCount,
        rejected: rejectedCount,
      },
    };
  },
});

// Mutation to accept all under_review properties (useful for testing)
export const acceptAllUnderReview = mutation({
  args: {
    propertyManagerId: v.id("propertyManagers"),
  },
  handler: async (ctx, args) => {
    // Get all under_review properties for this property manager
    const properties = await ctx.db
      .query("properties")
      .withIndex("by_property_manager", (q) => q.eq("propertyManagerId", args.propertyManagerId))
      .filter((q) => q.eq(q.field("status"), "under_review"))
      .collect();

    let updatedCount = 0;

    for (const property of properties) {
      await ctx.db.patch(property._id, {
        status: "accepted",
        rejectionReason: undefined,
        rejectionNotes: undefined,
        updatedAt: Date.now(),
      });
      updatedCount++;
    }

    return {
      success: true,
      message: `Accepted ${updatedCount} properties`,
      updated: updatedCount,
    };
  },
});