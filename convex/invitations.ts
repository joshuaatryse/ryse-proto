import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    companyName: v.string(),
    sentBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Generate a unique token
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);

    // Check if invitation already exists
    const existing = await ctx.db
      .query("invitations")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    if (existing) {
      // Update existing invitation
      await ctx.db.patch(existing._id, {
        token,
        firstName: args.firstName,
        lastName: args.lastName,
        companyName: args.companyName,
        sentAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      return { id: existing._id, token };
    }

    // Create new invitation
    const invitationId = await ctx.db.insert("invitations", {
      email: args.email,
      token,
      firstName: args.firstName,
      lastName: args.lastName,
      companyName: args.companyName,
      status: "pending",
      sentAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      sentBy: args.sentBy,
    });

    return { id: invitationId, token };
  },
});

export const getByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invitation) return null;

    // Check if expired
    if (invitation.expiresAt < Date.now() && invitation.status === "pending") {
      return { ...invitation, isExpired: true };
    }

    return { ...invitation, isExpired: false };
  },
});

export const accept = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    if (invitation.status !== "pending") {
      throw new Error("Invitation already used");
    }

    if (invitation.expiresAt < Date.now()) {
      throw new Error("Invitation expired");
    }

    await ctx.db.patch(invitation._id, {
      status: "accepted",
      acceptedAt: Date.now(),
    });

    return invitation;
  },
});

export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const invitations = await ctx.db
      .query("invitations")
      .order("desc")
      .take(limit);

    return invitations.map(inv => ({
      id: inv._id,
      email: inv.email,
      status: inv.status,
      sentAt: new Date(inv.sentAt).toISOString(),
      sentBy: inv.sentBy || "Admin",
      acceptedAt: inv.acceptedAt ? new Date(inv.acceptedAt).toISOString() : undefined,
    }));
  },
});

export const list = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("invitations")
      .order("desc")
      .collect();
  },
});

export const getPendingCount = query({
  handler: async (ctx) => {
    const pending = await ctx.db
      .query("invitations")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    return pending.length;
  },
});