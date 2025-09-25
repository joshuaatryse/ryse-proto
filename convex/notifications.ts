import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get notifications for a user
export const getUserNotifications = query({
  args: {
    userId: v.string(),
    unreadOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));

    if (args.unreadOnly) {
      query = ctx.db
        .query("notifications")
        .withIndex("by_user_unread", (q) =>
          q.eq("userId", args.userId).eq("read", false)
        );
    }

    const notifications = await query
      .order("desc")
      .take(50);

    return notifications;
  },
});

// Mark notification as read
export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, {
      read: true,
    });
    return { success: true };
  },
});

// Mark all notifications as read for a user
export const markAllAsRead = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) =>
        q.eq("userId", args.userId).eq("read", false)
      )
      .collect();

    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, {
        read: true,
      });
    }

    return {
      success: true,
      markedCount: unreadNotifications.length
    };
  },
});

// Get unread count for a user
export const getUnreadCount = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) =>
        q.eq("userId", args.userId).eq("read", false)
      )
      .collect();

    return unreadNotifications.length;
  },
});

// Create a notification (internal use)
export const createNotification = mutation({
  args: {
    userId: v.string(),
    userType: v.union(v.literal("propertyManager"), v.literal("owner"), v.literal("admin")),
    type: v.union(
      v.literal("advance_request_sent"),
      v.literal("advance_request_received"),
      v.literal("advance_response_received"),
      v.literal("advance_approved"),
      v.literal("advance_rejected"),
      v.literal("advance_expired")
    ),
    title: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const notificationId = await ctx.db.insert("notifications", {
      ...args,
      read: false,
      emailSent: false,
      createdAt: Date.now(),
    });

    return notificationId;
  },
});

// Mark notification email as sent
export const markEmailSent = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, {
      emailSent: true,
    });
    return { success: true };
  },
});

// Get recent notifications by type
export const getNotificationsByType = query({
  args: {
    type: v.union(
      v.literal("advance_request_sent"),
      v.literal("advance_request_received"),
      v.literal("advance_response_received"),
      v.literal("advance_approved"),
      v.literal("advance_rejected"),
      v.literal("advance_expired")
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .order("desc")
      .take(limit);

    return notifications;
  },
});

// Cleanup old read notifications (older than 30 days)
export const cleanupOldNotifications = mutation({
  handler: async (ctx) => {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

    const oldNotifications = await ctx.db
      .query("notifications")
      .filter((q) =>
        q.and(
          q.eq(q.field("read"), true),
          q.lt(q.field("createdAt"), thirtyDaysAgo)
        )
      )
      .collect();

    let deletedCount = 0;
    for (const notification of oldNotifications) {
      await ctx.db.delete(notification._id);
      deletedCount++;
    }

    return {
      success: true,
      deletedCount
    };
  },
});

// Get notification preferences for a user
export const getNotificationPreferences = query({
  args: {
    userId: v.id("owners"),
  },
  handler: async (ctx, args) => {
    const owner = await ctx.db.get(args.userId);

    if (!owner) {
      return null;
    }

    return owner.notificationPreferences || {
      emailAdvanceRequests: true,
      emailAdvanceUpdates: true,
      emailMarketing: false,
    };
  },
});

// Update notification preferences
export const updateNotificationPreferences = mutation({
  args: {
    userId: v.id("owners"),
    preferences: v.object({
      emailAdvanceRequests: v.boolean(),
      emailAdvanceUpdates: v.boolean(),
      emailMarketing: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      notificationPreferences: args.preferences,
    });

    return { success: true };
  },
});