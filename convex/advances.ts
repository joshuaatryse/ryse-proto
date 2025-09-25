import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new advance request (from PM to Owner)
export const createAdvanceRequest = mutation({
  args: {
    propertyManagerId: v.id("propertyManagers"),
    ownerId: v.id("owners"),
    properties: v.array(v.object({
      propertyId: v.id("properties"),
      amount: v.number(),
      termMonths: v.number(),
      monthlyRent: v.number(),
    })),
    commissionRate: v.number(),
  },
  handler: async (ctx, args) => {
    // Get PM info
    const propertyManager = await ctx.db.get(args.propertyManagerId);
    if (!propertyManager) {
      throw new Error("Property manager not found");
    }

    // Get owner info for email
    const owner = await ctx.db.get(args.ownerId);
    if (!owner) throw new Error("Owner not found");

    // Generate group ID and secure token
    const groupId = `grp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const token = Math.random().toString(36).substring(2, 15) +
                  Math.random().toString(36).substring(2, 15);

    // Create individual advance for each property
    const advanceIds = [];
    for (const property of args.properties) {
      // Calculate commission for this property
      const commissionAmount = property.amount * args.commissionRate;

      // Create the advance request with "requested" status
      const advanceId = await ctx.db.insert("advances", {
        propertyId: property.propertyId,
        ownerId: args.ownerId,
        propertyManagerId: args.propertyManagerId,
        groupId,
        amount: property.amount,
        requestedAmount: property.amount,
        termMonths: property.termMonths,
        monthlyRentAmount: property.monthlyRent,
        commissionRate: args.commissionRate,
        commissionAmount,
        status: "requested",
        token,
        requestedAt: Date.now(),
        sentAt: Date.now(),
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Update to pending status
      await ctx.db.patch(advanceId, { status: "pending" });
      advanceIds.push(advanceId);
    }

    // TODO: Send email notification to owner

    return { groupId, token, advanceIds };
  },
});

// Owner responds to advance request (updates all advances in group)
export const respondToAdvanceRequest = mutation({
  args: {
    token: v.string(),
    responseType: v.union(v.literal("accept"), v.literal("counter"), v.literal("decline")),
    counterAmount: v.optional(v.number()),
    counterTermMonths: v.optional(v.number()),
    declineReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find all advances by token
    const advances = await ctx.db
      .query("advances")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .collect();

    if (advances.length === 0) {
      throw new Error("Invalid or expired request");
    }

    // Check the first advance for validation
    const firstAdvance = advances[0];
    if (firstAdvance.status !== "pending") {
      throw new Error("This request has already been processed");
    }

    if (firstAdvance.expiresAt && Date.now() > firstAdvance.expiresAt) {
      // Mark all advances in group as expired
      for (const advance of advances) {
        await ctx.db.patch(advance._id, { status: "expired" });
      }
      throw new Error("This request has expired");
    }

    // Update based on response type
    const updates: any = {
      ownerResponseType: args.responseType,
      ownerRespondedAt: Date.now(),
      updatedAt: Date.now(),
    };

    switch (args.responseType) {
      case "accept":
        updates.status = "approved";
        updates.approvedAt = Date.now();
        break;
      case "counter":
        updates.status = "countered";
        // For counter offers, we might need to handle amounts per property
        // For now, apply the same counter to all
        if (args.counterAmount) {
          updates.counterAmount = args.counterAmount / advances.length; // Split evenly
        }
        if (args.counterTermMonths) {
          updates.counterTermMonths = args.counterTermMonths;
        }
        break;
      case "decline":
        updates.status = "owner_declined";
        updates.declineReason = args.declineReason;
        break;
    }

    // Update all advances in the group
    const updatedIds = [];
    for (const advance of advances) {
      await ctx.db.patch(advance._id, updates);
      updatedIds.push(advance._id);
    }

    return {
      updatedCount: updatedIds.length,
      advanceIds: updatedIds,
      groupId: firstAdvance.groupId
    };
  },
});

// Get advance request by token (for owner response page)
export const getAdvanceRequestByToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Get all advances with this token
    const advances = await ctx.db
      .query("advances")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .collect();

    if (advances.length === 0) return null;

    const firstAdvance = advances[0];

    // Get related data
    const propertyManager = await ctx.db.get(firstAdvance.propertyManagerId);
    const owner = await ctx.db.get(firstAdvance.ownerId);

    // Get all properties for these advances
    const properties = await Promise.all(
      advances.map(async (advance) => {
        const property = await ctx.db.get(advance.propertyId);
        return {
          ...property,
          advanceAmount: advance.amount,
          advanceTermMonths: advance.termMonths,
          advanceCommission: advance.commissionAmount,
        };
      })
    );

    // Return aggregated data for the group
    const totalAmount = advances.reduce((sum, a) => sum + a.amount, 0);
    const totalCommission = advances.reduce((sum, a) => sum + a.commissionAmount, 0);

    return {
      ...firstAdvance,
      advances, // Include all individual advances
      groupId: firstAdvance.groupId,
      totalAmount,
      totalCommission,
      propertyManager,
      owner,
      properties: properties.filter(Boolean),
    };
  },
});

// Get all advances for an owner
export const getOwnerAdvances = query({
  args: {
    ownerId: v.id("owners"),
  },
  handler: async (ctx, args) => {
    const advances = await ctx.db
      .query("advances")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .collect();

    return Promise.all(
      advances.map(async (advance) => {
        const propertyManager = await ctx.db.get(advance.propertyManagerId);
        const property = await ctx.db.get(advance.propertyId);
        const properties = property ? [property] : [];

        return {
          ...advance,
          propertyManager,
          properties: properties.filter(Boolean),
        };
      })
    );
  },
});

// Get all advances for a property manager
export const getPropertyManagerAdvances = query({
  args: {
    propertyManagerId: v.id("propertyManagers"),
  },
  handler: async (ctx, args) => {
    const advances = await ctx.db
      .query("advances")
      .withIndex("by_property_manager", (q) => q.eq("propertyManagerId", args.propertyManagerId))
      .collect();

    return Promise.all(
      advances.map(async (advance) => {
        const owner = await ctx.db.get(advance.ownerId);
        const property = await ctx.db.get(advance.propertyId);
        const properties = property ? [property] : [];

        return {
          ...advance,
          owner,
          properties: properties.filter(Boolean),
        };
      })
    );
  },
});

// Get advance for a specific property
export const getPropertyAdvance = query({
  args: {
    propertyId: v.id("properties"),
  },
  handler: async (ctx, args) => {
    // Check if property is part of any advance
    const advances = await ctx.db
      .query("advances")
      .collect();

    // Filter for advances that include this property
    // Filter advances for this specific property
    const relevantAdvances = advances.filter(advance =>
      advance.propertyId === args.propertyId
    );

    // Return the most recent active advance
    const activeAdvance = relevantAdvances
      .filter(a => ["approved", "disbursed"].includes(a.status))
      .sort((a, b) => (b.approvedAt || 0) - (a.approvedAt || 0))[0];

    if (activeAdvance) {
      const propertyManager = await ctx.db.get(activeAdvance.propertyManagerId);
      const owner = await ctx.db.get(activeAdvance.ownerId);

      return {
        ...activeAdvance,
        propertyManager,
        owner,
      };
    }

    return null;
  },
});

// Get advance history for a specific property
export const getPropertyAdvanceHistory = query({
  args: {
    propertyId: v.id("properties"),
  },
  handler: async (ctx, args) => {
    // Get all advances for this property
    const advances = await ctx.db
      .query("advances")
      .collect();

    // Filter advances for this specific property
    const propertyAdvances = advances.filter(advance =>
      advance.propertyId === args.propertyId
    );

    // Separate advances by status
    const activeAdvances = propertyAdvances.filter(a =>
      ["approved", "disbursed"].includes(a.status)
    );
    const pendingAdvances = propertyAdvances.filter(a =>
      ["pending", "owner_accepted"].includes(a.status)
    );
    const historicalAdvances = propertyAdvances.filter(a =>
      ["completed", "declined", "rejected"].includes(a.status)
    );

    // Get the current active advance (most recent approved/disbursed)
    const active = activeAdvances
      .sort((a, b) => (b.approvedAt || 0) - (a.approvedAt || 0))[0] || null;

    // Calculate total advanced amount
    const totalAdvanced = propertyAdvances
      .filter(a => ["approved", "disbursed", "completed"].includes(a.status))
      .reduce((sum, advance) => sum + advance.amount, 0);

    // Calculate current utilization if there's an active advance
    let currentUtilization = null;
    if (active) {
      const monthsUtilized = active.monthsUtilized || 0;
      const percentUtilized = (monthsUtilized / active.termMonths) * 100;
      const amountUtilized = (active.amount / active.termMonths) * monthsUtilized;
      const remainingBalance = active.amount - amountUtilized;

      currentUtilization = {
        percentUtilized,
        amountUtilized,
        remainingBalance,
        monthsRemaining: active.termMonths - monthsUtilized,
      };
    }

    return {
      active,
      pending: pendingAdvances,
      historical: historicalAdvances,
      all: propertyAdvances,
      totalAdvanced,
      currentUtilization,
    };
  },
});

// Admin approves advance after owner acceptance
export const adminApproveAdvance = mutation({
  args: {
    advanceId: v.id("advances"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // TODO: Re-enable auth when authentication is set up
    // const identity = await ctx.auth.getUserIdentity();
    // if (!identity) throw new Error("Unauthorized");

    // For now, use a dummy admin ID
    const admin = await ctx.db
      .query("admins")
      .first();

    if (!admin) {
      throw new Error("No admin found in database");
    }

    const advance = await ctx.db.get(args.advanceId);
    if (!advance) throw new Error("Advance not found");

    // Log the current status for debugging
    console.log("Advance status:", advance.status, "ownerResponseType:", advance.ownerResponseType);

    // Admin can approve advances that are either approved or countered by owner
    if (advance.status !== "approved" && advance.status !== "countered") {
      throw new Error(`Advance must be approved or countered by owner first. Current status: ${advance.status}, ownerResponseType: ${advance.ownerResponseType}`);
    }

    // Get all advances in the same group
    let advancesToUpdate = [advance];
    if (advance.groupId) {
      const groupAdvances = await ctx.db
        .query("advances")
        .filter(q => q.eq(q.field("groupId"), advance.groupId))
        .collect();
      if (groupAdvances.length > 0) {
        advancesToUpdate = groupAdvances;
      }
    }

    // Use counter amounts if this was a countered advance
    const finalAmount = advance.status === "countered" && advance.counterAmount
      ? advance.counterAmount
      : advance.amount;
    const finalTermMonths = advance.status === "countered" && advance.counterTermMonths
      ? advance.counterTermMonths
      : advance.termMonths;

    // Update all advances in the group
    for (const adv of advancesToUpdate) {
      const advFinalAmount = adv.status === "countered" && adv.counterAmount
        ? adv.counterAmount
        : adv.amount;

      await ctx.db.patch(adv._id, {
        status: "disbursed",
        disbursedAt: Date.now(),
        adminReviewedBy: admin._id,
        adminReviewedAt: Date.now(),
        adminApprovalNotes: args.notes,
        startDate: Date.now(),
        endDate: Date.now() + (finalTermMonths * 30 * 24 * 60 * 60 * 1000),
        monthsUtilized: 0,
        remainingBalance: advFinalAmount,
        amount: advFinalAmount, // Update to final approved amount
        termMonths: finalTermMonths, // Update to final approved term
      });
    }

    return args.advanceId;
  },
});

// Admin rejects advance
export const adminRejectAdvance = mutation({
  args: {
    advanceId: v.id("advances"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    // TODO: Re-enable auth when authentication is set up
    // const identity = await ctx.auth.getUserIdentity();
    // if (!identity) throw new Error("Unauthorized");

    // For now, use a dummy admin ID
    const admin = await ctx.db
      .query("admins")
      .first();

    if (!admin) {
      throw new Error("No admin found in database");
    }

    const advance = await ctx.db.get(args.advanceId);
    if (!advance) throw new Error("Advance not found");

    // Get all advances in the same group
    let advancesToUpdate = [advance];
    if (advance.groupId) {
      const groupAdvances = await ctx.db
        .query("advances")
        .filter(q => q.eq(q.field("groupId"), advance.groupId))
        .collect();
      if (groupAdvances.length > 0) {
        advancesToUpdate = groupAdvances;
      }
    }

    // Update all advances in the group
    for (const adv of advancesToUpdate) {
      await ctx.db.patch(adv._id, {
        status: "denied",
        rejectionReason: args.reason,
        adminReviewedBy: admin._id,
        adminReviewedAt: Date.now(),
      });
    }

    return args.advanceId;
  },
});

// Update advance utilization (called monthly)
export const updateAdvanceUtilization = mutation({
  args: {
    advanceId: v.id("advances"),
    monthlyAmount: v.number(),
  },
  handler: async (ctx, args) => {
    const advance = await ctx.db.get(args.advanceId);
    if (!advance) throw new Error("Advance not found");

    if (advance.status !== "disbursed") {
      throw new Error("Advance is not active");
    }

    const monthsUtilized = (advance.monthsUtilized || 0) + 1;
    const remainingBalance = (advance.remainingBalance || advance.amount) - args.monthlyAmount;

    const updates: any = {
      monthsUtilized,
      remainingBalance,
      lastUtilizationDate: Date.now(),
    };

    // Check if advance is fully utilized
    if (monthsUtilized >= advance.termMonths || remainingBalance <= 0) {
      updates.status = "repaid";
      updates.completedAt = Date.now();
    }

    await ctx.db.patch(args.advanceId, updates);
    return args.advanceId;
  },
});

// Update identity verification
export const updateIdentityVerification = mutation({
  args: {
    token: v.string(),
    verified: v.boolean(),
    verificationId: v.string(),
  },
  handler: async (ctx, args) => {
    const advance = await ctx.db
      .query("advances")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!advance) {
      throw new Error("Invalid request");
    }

    await ctx.db.patch(advance._id, {
      identityVerified: args.verified,
      identityVerificationId: args.verificationId,
      updatedAt: Date.now(),
    });

    return advance._id;
  },
});

// Update document signature
export const updateDocumentSignature = mutation({
  args: {
    token: v.string(),
    signed: v.boolean(),
    signatureId: v.string(),
  },
  handler: async (ctx, args) => {
    const advance = await ctx.db
      .query("advances")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!advance) {
      throw new Error("Invalid request");
    }

    await ctx.db.patch(advance._id, {
      documentSigned: args.signed,
      documentSignatureId: args.signatureId,
      updatedAt: Date.now(),
    });

    return advance._id;
  },
});

// Create multiple advances at once (bulk advance request)
export const createBulkAdvances = mutation({
  args: {
    propertyManagerId: v.id("propertyManagers"),
    advances: v.array(v.object({
      propertyId: v.id("properties"),
      ownerId: v.id("owners"),
      amount: v.number(),
      termMonths: v.number(),
      monthlyRentAmount: v.number(),
      notes: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const commissionRate = 0.02; // 2% commission
    const createdAdvances = [];
    const errors = [];

    for (const advanceData of args.advances) {
      try {
        // Check if property already has an active advance
        const existingActiveAdvance = await ctx.db
          .query("advances")
          .collect()
          .then(advances => advances.find(a =>
            a.propertyId === advanceData.propertyId &&
            ["disbursed", "approved", "pending", "requested"].includes(a.status)
          ));

        if (existingActiveAdvance) {
          errors.push({
            propertyId: advanceData.propertyId,
            error: "Property already has an active or pending advance",
          });
          continue;
        }

        // Create the advance
        const commissionAmount = advanceData.amount * commissionRate;
        const advanceId = await ctx.db.insert("advances", {
          propertyId: advanceData.propertyId,
          ownerId: advanceData.ownerId,
          propertyManagerId: args.propertyManagerId,
          amount: advanceData.amount,
          termMonths: advanceData.termMonths,
          monthlyRentAmount: advanceData.monthlyRentAmount,
          commissionRate,
          commissionAmount,
          status: "requested",
          requestedAt: Date.now(),
          monthsUtilized: 0,
          remainingBalance: advanceData.amount,
          notes: advanceData.notes || `Bulk advance request - ${new Date().toLocaleDateString()}`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        createdAdvances.push(advanceId);
      } catch (error) {
        errors.push({
          propertyId: advanceData.propertyId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      success: createdAdvances.length > 0,
      createdCount: createdAdvances.length,
      createdAdvances,
      errors,
      totalRequested: args.advances.length,
    };
  },
});

// Get advance statistics for dashboard
export const getAdvanceStats = query({
  args: {},
  handler: async (ctx) => {
    // TODO: Re-enable auth when authentication is set up
    // const identity = await ctx.auth.getUserIdentity();
    // if (!identity) return null;

    // For now, allow stats access without auth
    // In production, this should check for admin access

    const advances = await ctx.db.query("advances").collect();

    const stats = {
      total: advances.length,
      requested: advances.filter(a => a.status === "requested").length,
      pending: advances.filter(a => a.status === "pending").length,
      approved: advances.filter(a => a.status === "approved").length,
      disbursed: advances.filter(a => a.status === "disbursed").length,
      repaid: advances.filter(a => a.status === "repaid").length,
      denied: advances.filter(a => a.status === "denied").length,
      totalAmount: advances
        .filter(a => a.status === "disbursed")
        .reduce((sum, a) => sum + a.amount, 0),
      totalCommission: advances
        .filter(a => a.status === "disbursed")
        .reduce((sum, a) => sum + a.commissionAmount, 0),
    };

    return stats;
  },
});

// Get advance requests for admin dashboard with prioritization
export const getAdminAdvanceRequests = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const advances = await ctx.db.query("advances").collect();

    // Filter out advances that don't need admin review
    const relevantAdvances = advances.filter(advance =>
      advance.status === "approved" ||
      advance.status === "countered" ||
      advance.status === "pending"
    );

    // Group advances by groupId or individual advance
    const groupedAdvances = relevantAdvances.reduce((acc, advance) => {
      const key = advance.groupId || advance._id;
      if (!acc[key]) {
        acc[key] = {
          groupId: advance.groupId,
          advances: [],
          totalAmount: 0,
          totalCommission: 0,
          status: advance.status,
          priority: "normal" as "high" | "normal" | "low",
          requestedAt: advance.requestedAt,
          ownerRespondedAt: advance.ownerRespondedAt,
          propertyManagerId: advance.propertyManagerId,
          ownerId: advance.ownerId,
        };
      }
      acc[key].advances.push(advance);
      acc[key].totalAmount += advance.amount;
      acc[key].totalCommission += advance.commissionAmount;

      // Update priority based on status
      // High priority: approved or countered by owner (needs admin review)
      // Normal priority: pending (waiting on owner)
      // Low priority: other statuses
      if (advance.status === "approved" || advance.status === "countered") {
        acc[key].priority = "high";
        acc[key].status = advance.status; // Update group status to latest
      } else if (advance.status === "pending" && acc[key].priority !== "high") {
        acc[key].priority = "normal";
        acc[key].status = advance.status; // Update group status to latest
      }

      return acc;
    }, {} as Record<string, any>);

    // Convert to array and fetch additional details
    const requestsWithDetails = await Promise.all(
      Object.values(groupedAdvances).map(async (group) => {
        const propertyManager = await ctx.db.get(group.propertyManagerId);
        const owner = await ctx.db.get(group.ownerId);

        // Get property details for each advance in the group
        const properties = await Promise.all(
          group.advances.map(async (advance: any) => {
            const property = await ctx.db.get(advance.propertyId);
            return {
              ...property,
              advanceAmount: advance.amount,
              advanceStatus: advance.status,
            };
          })
        );

        return {
          ...group,
          propertyManager,
          owner,
          properties: properties.filter(Boolean),
          propertyCount: properties.length,
        };
      })
    );

    // Sort by priority and date
    const sortedRequests = requestsWithDetails.sort((a, b) => {
      // First sort by priority
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority as keyof typeof priorityOrder] -
                           priorityOrder[b.priority as keyof typeof priorityOrder];
      if (priorityDiff !== 0) return priorityDiff;

      // Then sort by date (most recent first)
      return (b.ownerRespondedAt || b.requestedAt || 0) - (a.ownerRespondedAt || a.requestedAt || 0);
    });

    return sortedRequests.slice(0, limit);
  },
});

// Get all advances for a property manager with property details
export const getAdvancesByPropertyManager = query({
  args: {
    propertyManagerId: v.id("propertyManagers"),
    includeRepaid: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("advances")
      .withIndex("by_property_manager", (q) => q.eq("propertyManagerId", args.propertyManagerId));

    const advances = await query.collect();

    // Filter out repaid if requested
    const filteredAdvances = args.includeRepaid === false
      ? advances.filter(a => a.status !== "repaid")
      : advances;

    // Get property and owner details for each advance
    const advancesWithDetails = await Promise.all(
      filteredAdvances.map(async (advance) => {
        const property = await ctx.db.get(advance.propertyId);
        const owner = await ctx.db.get(advance.ownerId);

        return {
          ...advance,
          property,
          owner,
        };
      })
    );

    // Sort by requestedAt descending
    return advancesWithDetails.sort((a, b) => (b.requestedAt || 0) - (a.requestedAt || 0));
  },
});

// Get advances grouped by groupId for display
export const getAdvancesGrouped = query({
  args: {
    propertyManagerId: v.id("propertyManagers"),
  },
  handler: async (ctx, args) => {
    const advances = await ctx.db
      .query("advances")
      .withIndex("by_property_manager", (q) => q.eq("propertyManagerId", args.propertyManagerId))
      .collect();

    // Group advances by groupId
    const grouped = advances.reduce((acc, advance) => {
      const key = advance.groupId || advance._id; // Use advance._id if no groupId
      if (!acc[key]) {
        acc[key] = {
          groupId: advance.groupId,
          advances: [],
          totalAmount: 0,
          totalCommission: 0,
          status: advance.status,
          requestedAt: advance.requestedAt,
          ownerId: advance.ownerId,
          propertyCount: 0,
        };
      }
      acc[key].advances.push(advance);
      acc[key].totalAmount += advance.amount;
      acc[key].totalCommission += advance.commissionAmount;
      acc[key].propertyCount += 1;
      return acc;
    }, {} as Record<string, any>);

    // Get owner details for each group
    const groupsWithDetails = await Promise.all(
      Object.values(grouped).map(async (group) => {
        const owner = await ctx.db.get(group.ownerId);
        return {
          ...group,
          owner,
        };
      })
    );

    return groupsWithDetails.sort((a, b) => (b.requestedAt || 0) - (a.requestedAt || 0));
  },
});

// Get all admin info for notifications
export const getAdminInfo = query({
  args: {},
  handler: async (ctx) => {
    const admins = await ctx.db.query("admins").collect();
    return admins.map(admin => ({
      email: admin.email,
      firstName: admin.firstName || 'Admin',
      lastName: admin.lastName || '',
    }));
  },
});