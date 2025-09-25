import { v } from "convex/values";
import { query } from "./_generated/server";

// Get comprehensive analytics for property manager
export const getAnalytics = query({
  args: { propertyManagerId: v.id("propertyManagers") },
  handler: async (ctx, args) => {
    // Get all properties
    const properties = await ctx.db
      .query("properties")
      .withIndex("by_property_manager", (q) => q.eq("propertyManagerId", args.propertyManagerId))
      .collect();

    // Get all advances
    const advances = await ctx.db
      .query("advances")
      .withIndex("by_property_manager", (q) => q.eq("propertyManagerId", args.propertyManagerId))
      .collect();

    // Get all owners
    const owners = await ctx.db
      .query("owners")
      .withIndex("by_property_manager", (q) => q.eq("propertyManagerId", args.propertyManagerId))
      .collect();

    // Calculate property metrics
    const activeProperties = properties.filter(p => p.status === "active");
    const totalMonthlyRent = activeProperties.reduce((sum, p) => sum + p.monthlyRent, 0);
    const averageRent = activeProperties.length > 0 ? totalMonthlyRent / activeProperties.length : 0;

    // Calculate advance metrics
    const activeAdvances = advances.filter(a => a.status === "approved" || a.status === "disbursed");
    const totalAdvanceAmount = activeAdvances.reduce((sum, a) => sum + a.amount, 0);
    const totalCommissions = advances
      .filter(a => a.status === "repaid")
      .reduce((sum, a) => sum + a.commissionAmount, 0);

    // Properties by type
    const propertiesByType = {
      singleFamily: properties.filter(p => !p.address.unit).length,
      multiFamily: properties.filter(p => !!p.address.unit).length,
    };

    // Properties by status
    const propertiesByStatus = {
      active: properties.filter(p => p.status === "active").length,
      accepted: properties.filter(p => p.status === "accepted").length,
      under_review: properties.filter(p => p.status === "under_review").length,
      rejected: properties.filter(p => p.status === "rejected").length,
    };

    // Advances by status
    const advancesByStatus = {
      requested: advances.filter(a => a.status === "requested").length,
      approved: advances.filter(a => a.status === "approved").length,
      disbursed: advances.filter(a => a.status === "disbursed").length,
      repaid: advances.filter(a => a.status === "repaid").length,
      denied: advances.filter(a => a.status === "denied").length,
    };

    // Commission breakdown by owner
    const commissionsByOwner = new Map<string, { name: string; amount: number; count: number }>();
    for (const advance of advances.filter(a => a.status === "repaid")) {
      const owner = await ctx.db.get(advance.ownerId);
      if (owner) {
        const existing = commissionsByOwner.get(owner._id) || { name: owner.name, amount: 0, count: 0 };
        existing.amount += advance.commissionAmount;
        existing.count += 1;
        commissionsByOwner.set(owner._id, existing);
      }
    }

    // Monthly advance trends (last 6 months)
    const monthlyTrends = [];
    const now = Date.now();
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const monthAdvances = advances.filter(
        a => a.requestedAt >= monthStart.getTime() && a.requestedAt < monthEnd.getTime()
      );

      monthlyTrends.push({
        month: monthStart.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        advances: monthAdvances.length,
        amount: monthAdvances.reduce((sum, a) => sum + a.amount, 0),
        commissions: monthAdvances
          .filter(a => a.status === "repaid")
          .reduce((sum, a) => sum + a.commissionAmount, 0),
      });
    }

    // Top performing properties by advance amount
    const propertiesWithAdvances = await Promise.all(
      properties.map(async (property) => {
        const propertyAdvances = advances.filter(a => a.propertyId === property._id);
        const totalAdvances = propertyAdvances.reduce((sum, a) => sum + a.amount, 0);
        const owner = await ctx.db.get(property.ownerId);
        return {
          ...property,
          owner,
          totalAdvances,
          advanceCount: propertyAdvances.length,
        };
      })
    );
    const topProperties = propertiesWithAdvances
      .sort((a, b) => b.totalAdvances - a.totalAdvances)
      .slice(0, 5);

    // Occupancy rate (properties with active leases)
    const propertiesWithActiveLeases = properties.filter(
      p => p.leaseEndDate && p.leaseEndDate > now
    ).length;
    const occupancyRate = properties.length > 0
      ? (propertiesWithActiveLeases / properties.length) * 100
      : 0;

    return {
      overview: {
        totalProperties: properties.length,
        activeProperties: activeProperties.length,
        totalOwners: owners.length,
        totalMonthlyRent,
        averageRent,
        occupancyRate,
      },
      advances: {
        activeCount: activeAdvances.length,
        totalAmount: totalAdvanceAmount,
        totalCommissions,
        averageCommissionRate: 2, // 2% default
        byStatus: advancesByStatus,
      },
      properties: {
        byType: propertiesByType,
        byStatus: propertiesByStatus,
        topPerforming: topProperties,
      },
      commissions: {
        total: totalCommissions,
        byOwner: Array.from(commissionsByOwner.values()).sort((a, b) => b.amount - a.amount),
      },
      trends: {
        monthly: monthlyTrends,
      },
    };
  },
});

// Get owner portfolio distribution
export const getOwnerDistribution = query({
  args: { propertyManagerId: v.id("propertyManagers") },
  handler: async (ctx, args) => {
    const owners = await ctx.db
      .query("owners")
      .withIndex("by_property_manager", (q) => q.eq("propertyManagerId", args.propertyManagerId))
      .collect();

    const distribution = await Promise.all(
      owners.map(async (owner) => {
        const properties = await ctx.db
          .query("properties")
          .withIndex("by_owner", (q) => q.eq("ownerId", owner._id))
          .collect();

        const totalRent = properties
          .filter(p => p.status === "active")
          .reduce((sum, p) => sum + p.monthlyRent, 0);

        return {
          owner: owner.name,
          propertyCount: properties.length,
          totalRent,
        };
      })
    );

    // Group by property count ranges
    const ranges = {
      "1 property": distribution.filter(d => d.propertyCount === 1).length,
      "2-3 properties": distribution.filter(d => d.propertyCount >= 2 && d.propertyCount <= 3).length,
      "4-5 properties": distribution.filter(d => d.propertyCount >= 4 && d.propertyCount <= 5).length,
      "6+ properties": distribution.filter(d => d.propertyCount >= 6).length,
    };

    return {
      distribution: distribution.sort((a, b) => b.propertyCount - a.propertyCount),
      ranges,
    };
  },
});