import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all email campaigns for a property manager
export const getCampaigns = query({
  args: { propertyManagerId: v.id("propertyManagers") },
  handler: async (ctx, args) => {
    const campaigns = await ctx.db
      .query("emailCampaigns")
      .withIndex("by_property_manager", (q) => q.eq("propertyManagerId", args.propertyManagerId))
      .order("desc")
      .collect();

    // Get recipient information for each campaign
    const campaignsWithDetails = await Promise.all(
      campaigns.map(async (campaign) => {
        let recipients: any[] = [];

        if (campaign.recipientType === "all") {
          // Get all owners for this property manager
          const owners = await ctx.db
            .query("owners")
            .withIndex("by_property_manager", (q) => q.eq("propertyManagerId", args.propertyManagerId))
            .collect();
          recipients = owners.filter(owner =>
            !campaign.excludedOwnerIds?.includes(owner._id)
          );
        } else if (campaign.recipientIds) {
          // Get specific recipients
          recipients = await Promise.all(
            campaign.recipientIds.map(id => ctx.db.get(id))
          );
        }

        return {
          ...campaign,
          recipientCount: recipients.length,
          recipients: recipients.slice(0, 5), // Return first 5 for preview
        };
      })
    );

    return campaignsWithDetails;
  },
});

// Get automated campaigns
export const getAutomatedCampaigns = query({
  args: { propertyManagerId: v.id("propertyManagers") },
  handler: async (ctx, args) => {
    const campaigns = await ctx.db
      .query("emailCampaigns")
      .withIndex("by_property_manager", (q) => q.eq("propertyManagerId", args.propertyManagerId))
      .collect();

    // Filter for automated campaigns, handling optional field
    return campaigns.filter(campaign => campaign.isAutomated === true);
  },
});

// Get property manager branding
export const getBranding = query({
  args: { propertyManagerId: v.id("propertyManagers") },
  handler: async (ctx, args) => {
    const pm = await ctx.db.get(args.propertyManagerId);
    return pm?.branding || {
      primaryColor: "#3B82F6",
      secondaryColor: "#10B981",
      textColor: "#1F2937",
      backgroundColor: "#FFFFFF",
      fontFamily: "Inter, sans-serif",
      companyName: pm?.company,
    };
  },
});

// Update property manager branding
export const updateBranding = mutation({
  args: {
    propertyManagerId: v.id("propertyManagers"),
    branding: v.object({
      logo: v.optional(v.string()),
      primaryColor: v.optional(v.string()),
      secondaryColor: v.optional(v.string()),
      textColor: v.optional(v.string()),
      backgroundColor: v.optional(v.string()),
      fontFamily: v.optional(v.string()),
      companyName: v.optional(v.string()),
      tagline: v.optional(v.string()),
      emailSignature: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.propertyManagerId, {
      branding: args.branding,
    });
  },
});

// Create email campaign
export const createCampaign = mutation({
  args: {
    propertyManagerId: v.id("propertyManagers"),
    name: v.string(),
    subject: v.string(),
    content: v.string(),
    templateType: v.optional(v.union(v.literal("advance_offer"), v.literal("newsletter"), v.literal("announcement"), v.literal("custom"))),
    recipientType: v.union(v.literal("all"), v.literal("owners"), v.literal("selected")),
    recipientIds: v.optional(v.array(v.id("owners"))),
    isAutomated: v.optional(v.boolean()),
    automationTrigger: v.optional(v.union(v.literal("monthly"), v.literal("lease_expiry"), v.literal("new_owner"))),
    scheduledFor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const campaignId = await ctx.db.insert("emailCampaigns", {
      propertyManagerId: args.propertyManagerId,
      name: args.name,
      subject: args.subject,
      content: args.content,
      recipientType: args.recipientType,
      status: args.scheduledFor ? "scheduled" : "draft",
      createdAt: Date.now(),
      ...(args.templateType && { templateType: args.templateType }),
      ...(args.recipientIds && { recipientIds: args.recipientIds }),
      ...(args.isAutomated !== undefined && { isAutomated: args.isAutomated }),
      ...(args.automationTrigger && { automationTrigger: args.automationTrigger }),
      ...(args.scheduledFor && { scheduledFor: args.scheduledFor }),
      updatedAt: Date.now(),
      excludedOwnerIds: [],
    });
    return campaignId;
  },
});

// Remove owner from marketing
export const excludeOwnerFromMarketing = mutation({
  args: {
    campaignId: v.id("emailCampaigns"),
    ownerId: v.id("owners"),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");

    const excludedOwnerIds = campaign.excludedOwnerIds || [];
    if (!excludedOwnerIds.includes(args.ownerId)) {
      excludedOwnerIds.push(args.ownerId);
      await ctx.db.patch(args.campaignId, {
        excludedOwnerIds,
        updatedAt: Date.now(),
      });
    }
  },
});

// Get all owners with marketing preferences
export const getOwnersWithPreferences = query({
  args: { propertyManagerId: v.id("propertyManagers") },
  handler: async (ctx, args) => {
    const owners = await ctx.db
      .query("owners")
      .withIndex("by_property_manager", (q) => q.eq("propertyManagerId", args.propertyManagerId))
      .collect();

    // Get properties for each owner
    const ownersWithDetails = await Promise.all(
      owners.map(async (owner) => {
        const properties = await ctx.db
          .query("properties")
          .withIndex("by_owner", (q) => q.eq("ownerId", owner._id))
          .collect();

        // Check if owner is excluded from any campaigns
        const campaigns = await ctx.db
          .query("emailCampaigns")
          .withIndex("by_property_manager", (q) => q.eq("propertyManagerId", args.propertyManagerId))
          .filter((q) => q.eq(q.field("isAutomated"), true))
          .collect();

        const isExcludedFromMarketing = campaigns.some(campaign =>
          campaign.excludedOwnerIds?.includes(owner._id)
        );

        return {
          ...owner,
          propertyCount: properties.length,
          totalRentValue: properties.reduce((sum, p) => sum + p.monthlyRent, 0),
          isExcludedFromMarketing,
        };
      })
    );

    return ownersWithDetails;
  },
});

// Send campaign (mock implementation)
export const sendCampaign = mutation({
  args: {
    campaignId: v.id("emailCampaigns"),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");

    // In a real implementation, this would integrate with an email service
    await ctx.db.patch(args.campaignId, {
      status: "sent",
      sentAt: Date.now(),
      updatedAt: Date.now(),
      metrics: {
        sent: Math.floor(Math.random() * 100) + 50,
        opened: Math.floor(Math.random() * 50) + 20,
        clicked: Math.floor(Math.random() * 20) + 5,
        bounced: Math.floor(Math.random() * 5),
        unsubscribed: Math.floor(Math.random() * 3),
      },
    });
  },
});