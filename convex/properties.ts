import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    ownerId: v.id("owners"),
    propertyManagerId: v.id("propertyManagers"),
    propertyName: v.optional(v.string()),
    propertyType: v.union(
      v.literal("single_family"),
      v.literal("multi_family"),
      v.literal("condo"),
      v.literal("townhouse"),
      v.literal("apartment"),
      v.literal("commercial"),
      v.literal("other")
    ),
    address: v.object({
      street: v.string(),
      unit: v.optional(v.string()),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
      country: v.string(),
      fullAddress: v.string(),
    }),
    bedrooms: v.optional(v.number()),
    bathrooms: v.optional(v.number()),
    squareFeet: v.optional(v.number()),
    yearBuilt: v.optional(v.number()),
    estimatedValue: v.optional(v.number()),
    purchasePrice: v.optional(v.number()),
    purchaseDate: v.optional(v.number()),
    monthlyRent: v.number(),
    securityDeposit: v.number(),
    leaseUrl: v.optional(v.string()),
    leaseStartDate: v.optional(v.number()),
    leaseEndDate: v.optional(v.number()),
    occupancyStatus: v.union(v.literal("occupied"), v.literal("vacant"), v.literal("maintenance")),
    status: v.optional(v.union(v.literal("active"), v.literal("accepted"), v.literal("under_review"), v.literal("rejected"))),
    rejectionReason: v.optional(v.union(
      v.literal("no_lease"),
      v.literal("lease_ending_soon"),
      v.literal("incomplete_documents"),
      v.literal("property_condition"),
      v.literal("other")
    )),
    rejectionNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const propertyId = await ctx.db.insert("properties", {
      ...args,
      status: args.status || "under_review",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return propertyId;
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("properties").collect();
  },
});

export const getByPropertyManager = query({
  args: { propertyManagerId: v.id("propertyManagers") },
  handler: async (ctx, args) => {
    const properties = await ctx.db
      .query("properties")
      .withIndex("by_property_manager", (q) => q.eq("propertyManagerId", args.propertyManagerId))
      .collect();

    // Get owner information for each property
    const propertiesWithOwners = await Promise.all(
      properties.map(async (property) => {
        const owner = await ctx.db.get(property.ownerId);
        return { ...property, owner };
      })
    );

    return propertiesWithOwners;
  },
});

export const getByOwner = query({
  args: { ownerId: v.id("owners") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("properties")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .collect();
  },
});

export const update = mutation({
  args: {
    id: v.id("properties"),
    monthlyRent: v.optional(v.number()),
    securityDeposit: v.optional(v.number()),
    leaseUrl: v.optional(v.string()),
    leaseStartDate: v.optional(v.number()),
    leaseEndDate: v.optional(v.number()),
    status: v.optional(v.union(v.literal("active"), v.literal("accepted"), v.literal("under_review"), v.literal("rejected"))),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const getStats = query({
  args: { propertyManagerId: v.id("propertyManagers") },
  handler: async (ctx, args) => {
    const properties = await ctx.db
      .query("properties")
      .withIndex("by_property_manager", (q) => q.eq("propertyManagerId", args.propertyManagerId))
      .collect();

    const activeCount = properties.filter(p => p.status === "active").length;
    const acceptedCount = properties.filter(p => p.status === "accepted").length;
    const activeAndAcceptedProperties = properties.filter(p => p.status === "active" || p.status === "accepted");
    const totalMonthlyRent = activeAndAcceptedProperties
      .reduce((sum, p) => sum + p.monthlyRent, 0);
    const averageRent = activeAndAcceptedProperties.length > 0 ? totalMonthlyRent / activeAndAcceptedProperties.length : 0;

    return {
      total: properties.length,
      active: activeCount,
      accepted: acceptedCount,
      under_review: properties.filter(p => p.status === "under_review").length,
      rejected: properties.filter(p => p.status === "rejected").length,
      totalMonthlyRent,
      averageRent,
    };
  },
});

// Get all properties with owner and advance information for the table
export const getPropertiesWithDetails = query({
  args: { propertyManagerId: v.id("propertyManagers") },
  handler: async (ctx, args) => {
    const properties = await ctx.db
      .query("properties")
      .withIndex("by_property_manager", (q) => q.eq("propertyManagerId", args.propertyManagerId))
      .collect();

    // Get owner and advance information for each property
    const propertiesWithDetails = await Promise.all(
      properties.map(async (property) => {
        const owner = await ctx.db.get(property.ownerId);

        // Get all advances for this property (simplified - each advance has one propertyId)
        const advances = await ctx.db
          .query("advances")
          .withIndex("by_property", (q) => q.eq("propertyId", property._id))
          .collect();

        // Find the most recent advance
        const latestAdvance = advances.sort((a, b) =>
          (b.requestedAt || 0) - (a.requestedAt || 0)
        )[0];

        const hasActiveAdvance = advances.some(adv =>
          adv.status === "approved" || adv.status === "disbursed"
        );
        const activeAdvanceAmount = advances
          .filter(adv => adv.status === "approved" || adv.status === "disbursed")
          .reduce((sum, adv) => sum + adv.amount, 0);

        return {
          ...property,
          owner,
          hasActiveAdvance,
          activeAdvanceAmount,
          advanceStatus: latestAdvance?.status || null,
          latestAdvance: latestAdvance || null,
          propertyType: property.propertyType || "single_family",
          propertyName: property.propertyName || `${property.address.street}${property.address.unit ? ` Unit ${property.address.unit}` : ""}`
        };
      })
    );

    return propertiesWithDetails;
  },
});

// Get property by ID with full details
export const createBulk = mutation({
  args: {
    properties: v.array(v.object({
      ownerId: v.id("owners"),
      propertyManagerId: v.id("propertyManagers"),
      propertyName: v.optional(v.string()),
      propertyType: v.union(
        v.literal("single_family"),
        v.literal("multi_family"),
        v.literal("condo"),
        v.literal("townhouse"),
        v.literal("apartment"),
        v.literal("commercial"),
        v.literal("other")
      ),
      address: v.object({
        street: v.string(),
        unit: v.optional(v.string()),
        city: v.string(),
        state: v.string(),
        zipCode: v.string(),
        country: v.string(),
        fullAddress: v.string(),
      }),
      bedrooms: v.optional(v.number()),
      bathrooms: v.optional(v.number()),
      squareFeet: v.optional(v.number()),
      yearBuilt: v.optional(v.number()),
      estimatedValue: v.optional(v.number()),
      purchasePrice: v.optional(v.number()),
      purchaseDate: v.optional(v.number()),
      monthlyRent: v.number(),
      securityDeposit: v.number(),
      leaseUrl: v.optional(v.string()),
      leaseStartDate: v.optional(v.number()),
      leaseEndDate: v.optional(v.number()),
      occupancyStatus: v.union(v.literal("occupied"), v.literal("vacant"), v.literal("maintenance")),
      status: v.optional(v.union(v.literal("active"), v.literal("accepted"), v.literal("under_review"), v.literal("rejected"))),
    })),
  },
  handler: async (ctx, args) => {
    const propertyIds = [];
    for (const property of args.properties) {
      const propertyId = await ctx.db.insert("properties", {
        ...property,
        status: property.status || "under_review",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      propertyIds.push(propertyId);
    }
    return propertyIds;
  },
});

export const getPropertyById = query({
  args: { propertyId: v.id("properties") },
  handler: async (ctx, args) => {
    const property = await ctx.db.get(args.propertyId);
    if (!property) return null;

    const owner = await ctx.db.get(property.ownerId);

    // Get all advances for this property (simplified - each advance has one propertyId)
    const advances = await ctx.db
      .query("advances")
      .withIndex("by_property", (q) => q.eq("propertyId", property._id))
      .order("desc")
      .collect();

    // Get properties at the same address (for multi-family)
    const relatedProperties = await ctx.db
      .query("properties")
      .filter((q) =>
        q.and(
          q.eq(q.field("address.street"), property.address.street),
          q.eq(q.field("address.city"), property.address.city),
          q.eq(q.field("address.state"), property.address.state),
          q.neq(q.field("_id"), property._id)
        )
      )
      .collect();

    return {
      ...property,
      owner,
      advances,
      relatedUnits: relatedProperties,
      propertyType: property.propertyType || "single_family",
    };
  },
});