import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Property Manager Authentication
export const loginPropertyManager = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const pm = await ctx.db
      .query("propertyManagers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!pm || pm.password !== args.password) {
      throw new Error("Invalid email or password");
    }

    // Update last login
    await ctx.db.patch(pm._id, {
      lastLoginAt: Date.now(),
    });

    return {
      id: pm._id,
      email: pm.email,
      firstName: pm.firstName,
      lastName: pm.lastName,
      company: pm.company,
    };
  },
});

export const registerPropertyManager = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.string(),
    company: v.string(),
    companyAddress: v.object({
      street: v.string(),
      unit: v.optional(v.string()),
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
    // Check if email already exists
    const existing = await ctx.db
      .query("propertyManagers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      throw new Error("An account with this email already exists");
    }

    const pmId = await ctx.db.insert("propertyManagers", {
      ...args,
      integrationSynced: {
        enabled: false,
        integrationType: "rent_manager",
        syncType: "all",
      },
      createdAt: Date.now(),
    });

    return {
      id: pmId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      company: args.company,
    };
  },
});

// Admin Authentication
export const loginAdmin = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!admin || admin.password !== args.password) {
      throw new Error("Invalid email or password");
    }

    // Update last login
    await ctx.db.patch(admin._id, {
      lastLoginAt: Date.now(),
    });

    return {
      id: admin._id,
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      role: admin.role,
    };
  },
});

// Get current property manager
export const getPropertyManager = query({
  args: { id: v.id("propertyManagers") },
  handler: async (ctx, args) => {
    const pm = await ctx.db.get(args.id);
    if (!pm) return null;

    return {
      id: pm._id,
      email: pm.email,
      firstName: pm.firstName,
      lastName: pm.lastName,
      company: pm.company,
      phone: pm.phone,
      companyAddress: pm.companyAddress,
      propertiesManaged: pm.propertiesManaged,
      averageRent: pm.averageRent,
      marketingPreference: pm.marketingPreference,
      integrationSynced: pm.integrationSynced,
    };
  },
});

// Get current admin
export const getAdmin = query({
  args: { id: v.id("admins") },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.id);
    if (!admin) return null;

    return {
      id: admin._id,
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      role: admin.role,
    };
  },
});