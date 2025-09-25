import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.string(),
    company: v.string(),
    companyAddress: v.object({
      street: v.string(),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
      country: v.string(),
      fullAddress: v.string(),
    }),
    propertiesManaged: v.number(),
    averageRent: v.number(),
    marketingPreference: v.union(v.literal("automated"), v.literal("diy")),
    termsAccepted: v.boolean(),
  },
  handler: async (ctx, args) => {
    const propertyManagerId = await ctx.db.insert("propertyManagers", {
      ...args,
      password: "password123", // Default password - in production use proper auth
      createdAt: Date.now(),
    });
    return propertyManagerId;
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("propertyManagers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const getById = query({
  args: { id: v.id("propertyManagers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("propertyManagers").collect();
  },
});

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("propertyManagers").order("desc").collect();
  },
});

export const updateIntegrationStatus = mutation({
  args: {
    id: v.id("propertyManagers"),
    integrationSynced: v.object({
      enabled: v.boolean(),
      integrationType: v.union(
        v.literal("rent_manager"),
        v.literal("buildium"),
        v.literal("neighborly"),
        v.literal("appfolio"),
        v.literal("propertyware"),
        v.literal("yardi"),
        v.literal("other")
      ),
      syncType: v.union(v.literal("all"), v.literal("subset")),
      lastSyncedAt: v.optional(v.number()),
      metadata: v.optional(v.any()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      integrationSynced: args.integrationSynced,
    });
  },
});

export const getDashboardMetrics = query({
  args: { propertyManagerId: v.id("propertyManagers") },
  handler: async (ctx, args) => {
    const properties = await ctx.db
      .query("properties")
      .withIndex("by_property_manager", (q) => q.eq("propertyManagerId", args.propertyManagerId))
      .collect();

    const advances = await ctx.db
      .query("advances")
      .withIndex("by_property_manager", (q) => q.eq("propertyManagerId", args.propertyManagerId))
      .collect();

    const activeProperties = properties.filter(p => p.status === "active");
    const totalPotentialAdvance = activeProperties.reduce((sum, p) => sum + (p.monthlyRent * 12), 0);
    const totalActualAdvance = advances
      .filter(a => a.status === "disbursed" || a.status === "repaid")
      .reduce((sum, a) => sum + a.amount, 0);
    const totalCommissions = advances
      .filter(a => a.status === "disbursed" || a.status === "repaid")
      .reduce((sum, a) => sum + a.commissionAmount, 0);

    return {
      totalProperties: properties.length,
      activeProperties: activeProperties.length,
      totalPotentialAdvance,
      totalActualAdvance,
      totalCommissions,
      recentAdvances: advances.slice(0, 5),
    };
  },
});