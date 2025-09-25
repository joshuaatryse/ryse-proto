import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  admins: defineTable({
    email: v.string(),
    password: v.string(), // In production, this would be hashed
    firstName: v.string(),
    lastName: v.string(),
    role: v.union(v.literal("super_admin"), v.literal("admin")),
    createdAt: v.number(),
    lastLoginAt: v.optional(v.number()),
  })
    .index("by_email", ["email"]),

  propertyManagers: defineTable({
    email: v.string(),
    password: v.string(), // In production, this would be hashed
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
    profileImageUrl: v.optional(v.string()),
    createdAt: v.number(),
    lastLoginAt: v.optional(v.number()),
    integrationSynced: v.optional(v.object({
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
    })),
    branding: v.optional(v.object({
      logo: v.optional(v.string()),
      primaryColor: v.optional(v.string()),
      secondaryColor: v.optional(v.string()),
      textColor: v.optional(v.string()),
      backgroundColor: v.optional(v.string()),
      fontFamily: v.optional(v.string()),
      companyName: v.optional(v.string()),
      tagline: v.optional(v.string()),
      emailSignature: v.optional(v.string()),
    })),
  })
    .index("by_email", ["email"]),

  owners: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    propertyManagerId: v.id("propertyManagers"),
    // Optional authentication for owners who create accounts
    hasAccount: v.optional(v.boolean()),
    password: v.optional(v.string()), // In production, this would be hashed
    lastLoginAt: v.optional(v.number()),
    emailVerified: v.optional(v.boolean()),
    // Notification preferences
    notificationPreferences: v.optional(v.object({
      emailAdvanceRequests: v.boolean(),
      emailAdvanceUpdates: v.boolean(),
      emailMarketing: v.boolean(),
    })),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_property_manager", ["propertyManagerId"]),

  properties: defineTable({
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
    amenities: v.optional(v.array(v.string())),
    lastMaintenanceDate: v.optional(v.number()),
    nextMaintenanceDate: v.optional(v.number()),
    occupancyStatus: v.union(v.literal("occupied"), v.literal("vacant"), v.literal("maintenance")),
    images: v.optional(v.object({
      streetView: v.optional(v.string()),
      satellite: v.optional(v.string()),
      primary: v.optional(v.string()), // Primary display image
      gallery: v.optional(v.array(v.string())), // Additional images
    })),
    status: v.union(v.literal("active"), v.literal("accepted"), v.literal("under_review"), v.literal("rejected")),
    rejectionReason: v.optional(v.union(
      v.literal("no_lease"),
      v.literal("lease_ending_soon"), // Less than 3 months
      v.literal("incomplete_documents"),
      v.literal("property_condition"),
      v.literal("other")
    )),
    rejectionNotes: v.optional(v.string()),
    syncedFromIntegration: v.optional(v.boolean()),
    integrationId: v.optional(v.string()), // External ID from integration
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_property_manager", ["propertyManagerId"])
    .index("by_status", ["status"]),

  advances: defineTable({
    // Core relationships
    propertyId: v.id("properties"), // Each advance is for a single property
    ownerId: v.id("owners"),
    propertyManagerId: v.id("propertyManagers"),
    groupId: v.optional(v.string()), // Links advances created together in same request

    // Financial details
    amount: v.number(), // Requested or approved amount for this property
    requestedAmount: v.optional(v.number()), // Original requested amount (if different from approved)
    termMonths: v.number(), // How many months the advance covers for this property
    monthlyRentAmount: v.number(), // Monthly rent for this property at time of advance
    commissionRate: v.number(), // Default 0.02 (2%)
    commissionAmount: v.number(), // Commission for this property's advance

    // Comprehensive status tracking
    status: v.union(
      v.literal("requested"), // Initial request from PM
      v.literal("pending"), // Sent to owner, awaiting response
      v.literal("under_review"), // Being reviewed by admin
      v.literal("countered"), // Owner made a counter offer
      v.literal("denied"), // Request denied by admin
      v.literal("owner_declined"), // Request declined by owner
      v.literal("approved"), // Approved, pending disbursement
      v.literal("disbursed"), // Funds sent, advance active
      v.literal("repaid"), // Advance fully repaid/completed
      v.literal("cancelled"), // Request cancelled
      v.literal("expired") // Request expired without response
    ),

    // Request/Response tracking
    token: v.optional(v.string()), // Secure token for email link
    ownerResponseType: v.optional(v.union(v.literal("accept"), v.literal("counter"), v.literal("decline"))),
    ownerRespondedAt: v.optional(v.number()),
    counterAmount: v.optional(v.number()),
    counterTermMonths: v.optional(v.number()),
    declineReason: v.optional(v.string()),
    rejectionReason: v.optional(v.string()), // Admin rejection reason

    // Verification and signing
    identityVerified: v.optional(v.boolean()),
    identityVerificationId: v.optional(v.string()), // Stripe Identity ID
    documentSigned: v.optional(v.boolean()),
    documentSignatureId: v.optional(v.string()), // HelloSign document ID

    // Admin review
    adminReviewedBy: v.optional(v.id("admins")),
    adminReviewedAt: v.optional(v.number()),
    adminApprovalNotes: v.optional(v.string()),

    // Timeline tracking
    requestedAt: v.number(),
    sentAt: v.optional(v.number()), // When sent to owner
    approvedAt: v.optional(v.number()),
    disbursedAt: v.optional(v.number()),
    startDate: v.optional(v.number()), // When advance period begins
    endDate: v.optional(v.number()), // When advance period ends
    completedAt: v.optional(v.number()), // When marked as completed/repaid
    expiresAt: v.optional(v.number()), // For time-limited requests

    // Utilization tracking (for active advances)
    monthsUtilized: v.optional(v.number()), // How many months have been used
    remainingBalance: v.optional(v.number()), // Remaining advance amount
    lastUtilizationDate: v.optional(v.number()), // Last time rent was applied

    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_property", ["propertyId"])
    .index("by_owner", ["ownerId"])
    .index("by_property_manager", ["propertyManagerId"])
    .index("by_status", ["status"])
    .index("by_property_status", ["propertyId", "status"])
    .index("by_token", ["token"])
    .index("by_group", ["groupId"]),

  invitations: defineTable({
    email: v.string(),
    token: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    companyName: v.string(),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("expired")),
    sentAt: v.number(),
    acceptedAt: v.optional(v.number()),
    expiresAt: v.number(),
    sentBy: v.optional(v.string()), // Admin who sent the invitation
  })
    .index("by_email", ["email"])
    .index("by_token", ["token"])
    .index("by_status", ["status"]),

  emailCampaigns: defineTable({
    propertyManagerId: v.id("propertyManagers"),
    name: v.string(),
    subject: v.string(),
    content: v.string(),
    templateType: v.optional(v.union(v.literal("advance_offer"), v.literal("newsletter"), v.literal("announcement"), v.literal("custom"))),
    recipientType: v.union(v.literal("all"), v.literal("owners"), v.literal("selected")),
    recipientIds: v.optional(v.array(v.id("owners"))),
    excludedOwnerIds: v.optional(v.array(v.id("owners"))), // For owners who opted out
    status: v.union(v.literal("draft"), v.literal("sent"), v.literal("scheduled"), v.literal("automated")),
    sentAt: v.optional(v.number()),
    scheduledFor: v.optional(v.number()),
    isAutomated: v.optional(v.boolean()),
    automationTrigger: v.optional(v.union(v.literal("monthly"), v.literal("lease_expiry"), v.literal("new_owner"))),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    metrics: v.optional(v.object({
      sent: v.number(),
      opened: v.number(),
      clicked: v.number(),
      bounced: v.optional(v.number()),
      unsubscribed: v.optional(v.number()),
    })),
  })
    .index("by_property_manager", ["propertyManagerId"])
    .index("by_status", ["status"]),

  // Track owner's available advance capacity
  ownerAdvanceCapacity: defineTable({
    ownerId: v.id("owners"),
    propertyManagerId: v.id("propertyManagers"),
    totalEligibleProperties: v.number(),
    totalMonthlyRent: v.number(),
    maxAvailableMonths: v.number(), // Max months across all properties
    maxAvailableAmount: v.number(), // Max total advance amount
    activeAdvanceAmount: v.number(), // Currently active advances
    remainingCapacity: v.number(), // Available for new advances
    lastCalculated: v.number(),
    eligiblePropertyIds: v.array(v.id("properties")),
  })
    .index("by_owner", ["ownerId"])
    .index("by_owner_pm", ["ownerId", "propertyManagerId"]),

  // Notification preferences and tracking
  notifications: defineTable({
    userId: v.string(), // Can be PM, Owner, or Admin ID
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
    data: v.optional(v.any()), // Related IDs and metadata
    read: v.boolean(),
    emailSent: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_unread", ["userId", "read"])
    .index("by_type", ["type"]),
});