import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    propertyManagerId: v.id("propertyManagers"),
  },
  handler: async (ctx, args) => {
    // Check if owner already exists for this property manager
    const existing = await ctx.db
      .query("owners")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .filter((q) => q.eq(q.field("propertyManagerId"), args.propertyManagerId))
      .first();

    if (existing) {
      return existing._id;
    }

    const ownerId = await ctx.db.insert("owners", {
      ...args,
      createdAt: Date.now(),
    });
    return ownerId;
  },
});

export const getByPropertyManager = query({
  args: { propertyManagerId: v.id("propertyManagers") },
  handler: async (ctx, args) => {
    const owners = await ctx.db
      .query("owners")
      .withIndex("by_property_manager", (q) => q.eq("propertyManagerId", args.propertyManagerId))
      .collect();

    // Get property count for each owner
    const ownersWithStats = await Promise.all(
      owners.map(async (owner) => {
        const properties = await ctx.db
          .query("properties")
          .withIndex("by_owner", (q) => q.eq("ownerId", owner._id))
          .collect();

        return {
          ...owner,
          propertyCount: properties.length,
          totalMonthlyRent: properties.reduce((sum, p) => sum + p.monthlyRent, 0),
        };
      })
    );

    return ownersWithStats;
  },
});

export const getById = query({
  args: { id: v.id("owners") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const update = mutation({
  args: {
    id: v.id("owners"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});