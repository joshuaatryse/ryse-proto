import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const seedDatabase = mutation({
  handler: async (ctx) => {
    // Check if database is already seeded
    const existingAdmins = await ctx.db.query("admins").first();
    if (existingAdmins) {
      return { message: "Database already seeded" };
    }

    // Seed admin users
    const seanAdminId = await ctx.db.insert("admins", {
      email: "sean@rysemarket.com",
      password: "admin123", // In production, this would be hashed
      firstName: "Sean",
      lastName: "Admin",
      role: "super_admin",
      createdAt: Date.now(),
    });

    const joshuaAdminId = await ctx.db.insert("admins", {
      email: "joshua@rysemarket.com",
      password: "admin123", // In production, this would be hashed
      firstName: "Joshua",
      lastName: "Admin",
      role: "super_admin",
      createdAt: Date.now(),
    });

    // Seed property managers
    const pmIds = [];
    const propertyManagers = [
      {
        email: "sarah.johnson@premierproperties.com",
        password: "password123",
        firstName: "Sarah",
        lastName: "Johnson",
        phone: "(555) 123-4567",
        company: "Premier Properties LLC",
        companyAddress: {
          street: "123 Main Street",
          city: "San Francisco",
          state: "CA",
          zipCode: "94102",
          country: "United States",
          fullAddress: "123 Main Street, San Francisco, CA 94102",
        },
        propertiesManaged: 45,
        averageRent: 3500,
        marketingPreference: "automated" as const,
        termsAccepted: true,
        createdAt: Date.now(),
        integrationSynced: {
          enabled: false,
          integrationType: "rent_manager" as const,
          syncType: "all" as const,
          lastSyncedAt: Date.now(),
        },
      },
      {
        email: "michael.chen@urbanrealty.com",
        password: "password123",
        firstName: "Michael",
        lastName: "Chen",
        phone: "(555) 234-5678",
        company: "Urban Realty Management",
        companyAddress: {
          street: "456 Market Street",
          city: "Los Angeles",
          state: "CA",
          zipCode: "90001",
          country: "United States",
          fullAddress: "456 Market Street, Los Angeles, CA 90001",
        },
        propertiesManaged: 120,
        averageRent: 2800,
        marketingPreference: "diy" as const,
        termsAccepted: true,
        createdAt: Date.now(),
        integrationSynced: {
          enabled: false,
          integrationType: "rent_manager" as const,
          syncType: "all" as const,
          lastSyncedAt: Date.now(),
        },
      },
      {
        email: "emily.davis@coastalpm.com",
        password: "password123",
        firstName: "Emily",
        lastName: "Davis",
        phone: "(555) 345-6789",
        company: "Coastal Property Management",
        companyAddress: {
          street: "789 Beach Boulevard",
          city: "San Diego",
          state: "CA",
          zipCode: "92101",
          country: "United States",
          fullAddress: "789 Beach Boulevard, San Diego, CA 92101",
        },
        propertiesManaged: 78,
        averageRent: 3200,
        marketingPreference: "automated" as const,
        termsAccepted: true,
        createdAt: Date.now(),
        integrationSynced: {
          enabled: false,
          integrationType: "buildium" as const,
          syncType: "all" as const,
        },
      },
    ];

    for (const pm of propertyManagers) {
      const pmId = await ctx.db.insert("propertyManagers", pm);
      pmIds.push({ id: pmId, company: pm.company });
    }

    // Seed owners for each property manager with test emails
    const ownerData = [
      // Owners for Sarah Johnson - Premier Properties
      { name: "Robert Williams", email: "joshua+owner1@rysemarket.com", phone: "(555) 111-2222" },
      { name: "Jennifer Martinez", email: "joshua+owner2@rysemarket.com", phone: "(555) 111-3333" },
      { name: "David Thompson", email: "joshua+owner3@rysemarket.com", phone: "(555) 111-4444" },
      { name: "Lisa Anderson", email: "joshua+owner4@rysemarket.com", phone: "(555) 111-5555" },
      { name: "James Wilson", email: "joshua+owner5@rysemarket.com", phone: "(555) 111-6666" },
      // Owners for Michael Chen - Urban Realty
      { name: "Patricia Brown", email: "joshua+owner6@rysemarket.com", phone: "(555) 222-3333" },
      { name: "Christopher Lee", email: "joshua+owner7@rysemarket.com", phone: "(555) 222-4444" },
      { name: "Nancy Taylor", email: "joshua+owner8@rysemarket.com", phone: "(555) 222-5555" },
      { name: "Daniel Garcia", email: "joshua+owner9@rysemarket.com", phone: "(555) 222-6666" },
      { name: "Susan Miller", email: "joshua+owner10@rysemarket.com", phone: "(555) 222-7777" },
      // Owners for Emily Davis - Coastal PM
      { name: "Mark Robinson", email: "joshua+owner11@rysemarket.com", phone: "(555) 333-4444" },
      { name: "Karen White", email: "joshua+owner12@rysemarket.com", phone: "(555) 333-5555" },
      { name: "Steven Harris", email: "joshua+owner13@rysemarket.com", phone: "(555) 333-6666" },
      { name: "Maria Rodriguez", email: "joshua+owner14@rysemarket.com", phone: "(555) 333-7777" },
      { name: "Paul Jackson", email: "joshua+owner15@rysemarket.com", phone: "(555) 333-8888" },
    ];

    const ownerIds: any[] = [];
    for (let i = 0; i < ownerData.length; i++) {
      const pmIndex = Math.floor(i / 5); // 5 owners per property manager
      const ownerId = await ctx.db.insert("owners", {
        ...ownerData[i],
        propertyManagerId: pmIds[pmIndex].id,
        createdAt: Date.now(),
      });
      ownerIds.push({ id: ownerId, pmId: pmIds[pmIndex].id, name: ownerData[i].name });
    }

    // Seed properties
    const propertyTemplates = [
      { unit: "101", monthlyRent: 2500, securityDeposit: 2500 },
      { unit: "102", monthlyRent: 2800, securityDeposit: 2800 },
      { unit: "201", monthlyRent: 3200, securityDeposit: 3200 },
      { unit: "202", monthlyRent: 3500, securityDeposit: 3500 },
      { unit: "301", monthlyRent: 4000, securityDeposit: 4000 },
    ];

    const streets = [
      { street: "Oak Avenue", city: "San Francisco", state: "CA", zipCode: "94103" },
      { street: "Maple Drive", city: "Los Angeles", state: "CA", zipCode: "90012" },
      { street: "Pine Street", city: "San Diego", state: "CA", zipCode: "92104" },
      { street: "Elm Boulevard", city: "San Francisco", state: "CA", zipCode: "94104" },
      { street: "Cedar Lane", city: "Los Angeles", state: "CA", zipCode: "90013" },
    ];

    const propertyIds: any[] = [];
    for (const owner of ownerIds) {
      // Each owner gets 2-3 properties
      const numProperties = Math.floor(Math.random() * 2) + 2;
      for (let p = 0; p < numProperties; p++) {
        const template = propertyTemplates[Math.floor(Math.random() * propertyTemplates.length)];
        const location = streets[Math.floor(Math.random() * streets.length)];
        const streetNumber = Math.floor(Math.random() * 900) + 100;

        // Determine status with 90% accepted, 5% under review, 5% rejected
        const statusRandom = Math.random();
        let status: "accepted" | "under_review" | "rejected" = "accepted";
        let rejectionReason = undefined;
        let rejectionNotes = undefined;
        let leaseEndDate = Date.now() + 180 * 24 * 60 * 60 * 1000; // 6 months from now by default

        if (statusRandom < 0.90) {
          status = "accepted";
        } else if (statusRandom < 0.95) {
          status = "under_review";
        } else {
          status = "rejected";
          // Add rejection reason
          const rejectionRandom = Math.random();
          if (rejectionRandom < 0.3) {
            rejectionReason = "no_lease" as const;
            rejectionNotes = "No valid lease agreement provided";
          } else if (rejectionRandom < 0.6) {
            rejectionReason = "lease_ending_soon" as const;
            leaseEndDate = Date.now() + 60 * 24 * 60 * 60 * 1000; // Only 2 months left
            rejectionNotes = "Lease ending in less than 3 months";
          } else if (rejectionRandom < 0.8) {
            rejectionReason = "incomplete_documents" as const;
            rejectionNotes = "Missing required documentation";
          } else {
            rejectionReason = "property_condition" as const;
            rejectionNotes = "Property does not meet minimum standards";
          }
        }

        const propertyId = await ctx.db.insert("properties", {
          ownerId: owner.id,
          propertyManagerId: owner.pmId,
          propertyName: `${template.unit ? `Unit ${template.unit}` : `${streetNumber} ${location.street}`}`,
          propertyType: ["single_family", "condo", "townhouse", "apartment"][Math.floor(Math.random() * 4)] as any,
          address: {
            street: `${streetNumber} ${location.street}`,
            unit: template.unit,
            city: location.city,
            state: location.state,
            zipCode: location.zipCode,
            country: "United States",
            fullAddress: `${streetNumber} ${location.street}${template.unit ? `, Unit ${template.unit}` : ""}, ${location.city}, ${location.state} ${location.zipCode}`,
          },
          bedrooms: Math.floor(Math.random() * 3) + 1,
          bathrooms: Math.floor(Math.random() * 2) + 1,
          squareFeet: Math.floor(Math.random() * 1000) + 800,
          yearBuilt: 2000 + Math.floor(Math.random() * 24),
          estimatedValue: template.monthlyRent * 150,
          occupancyStatus: status === "accepted" ? "occupied" : "vacant",
          monthlyRent: template.monthlyRent,
          securityDeposit: template.securityDeposit,
          leaseStartDate: Date.now() - 180 * 24 * 60 * 60 * 1000, // 6 months ago
          leaseEndDate,
          status,
          rejectionReason,
          rejectionNotes,
          syncedFromIntegration: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        propertyIds.push({ id: propertyId, ownerId: owner.id, pmId: owner.pmId });
      }
    }

    // Seed advances
    const advanceStatuses = ["requested", "approved", "disbursed", "repaid", "declined"] as const;
    const advancesCreated = [];

    for (let i = 0; i < 25; i++) {
      const property = propertyIds[Math.floor(Math.random() * propertyIds.length)];
      const status = advanceStatuses[Math.floor(Math.random() * advanceStatuses.length)];
      const amount = Math.floor(Math.random() * 10000) + 5000; // $5,000 - $15,000
      const commissionRate = 0.02; // 2%

      const advanceData: any = {
        propertyId: property.id,
        ownerId: property.ownerId,
        propertyManagerId: property.pmId,
        amount,
        commissionRate,
        commissionAmount: amount * commissionRate,
        status,
        requestedAt: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000), // Random time in last 30 days
      };

      if (status !== "requested" && status !== "declined") {
        advanceData.approvedAt = advanceData.requestedAt + 24 * 60 * 60 * 1000; // 1 day after request
      }
      if (status === "disbursed" || status === "repaid") {
        advanceData.disbursedAt = advanceData.approvedAt + 24 * 60 * 60 * 1000; // 1 day after approval
      }
      if (status === "repaid") {
        advanceData.repaidAt = advanceData.disbursedAt + 30 * 24 * 60 * 60 * 1000; // 30 days after disbursement
      }

      const advanceId = await ctx.db.insert("advances", advanceData);
      advancesCreated.push(advanceId);
    }

    // Seed email campaigns
    for (const pm of pmIds) {
      await ctx.db.insert("emailCampaigns", {
        propertyManagerId: pm.id,
        name: "Rent Advance Introduction",
        subject: "New Benefit: Get Your Rent Early with Ryse",
        content: "Dear Property Owner, We're excited to introduce Ryse Rent Advance...",
        recipientType: "all",
        status: "sent",
        sentAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
        createdAt: Date.now() - 8 * 24 * 60 * 60 * 1000,
        metrics: {
          sent: 15,
          opened: 12,
          clicked: 8,
        },
      });

      await ctx.db.insert("emailCampaigns", {
        propertyManagerId: pm.id,
        name: "Holiday Rent Advance Reminder",
        subject: "Need Extra Cash for the Holidays?",
        content: "The holiday season is here, and we want to help...",
        recipientType: "owners",
        status: "draft",
        createdAt: Date.now(),
      });
    }

    return {
      message: "Database seeded successfully",
      stats: {
        admins: 2,
        propertyManagers: pmIds.length,
        owners: ownerIds.length,
        properties: propertyIds.length,
        advances: advancesCreated.length,
      },
    };
  },
});

// Function to sync properties after PM enables integration
export const syncPropertiesForPM = mutation({
  args: { propertyManagerId: v.id("propertyManagers") },
  handler: async (ctx, args) => {
    const pm = await ctx.db.get(args.propertyManagerId);
    if (!pm) throw new Error("Property manager not found");

    // Simulated property sync - in production this would call Rent Manager API
    const simulatedOwners = [
      { name: "New Owner 1", email: "newowner1@email.com", phone: "(555) 999-1111" },
      { name: "New Owner 2", email: "newowner2@email.com", phone: "(555) 999-2222" },
      { name: "New Owner 3", email: "newowner3@email.com", phone: "(555) 999-3333" },
    ];

    const syncedOwnerIds = [];
    for (const owner of simulatedOwners) {
      const ownerId = await ctx.db.insert("owners", {
        ...owner,
        propertyManagerId: args.propertyManagerId,
        createdAt: Date.now(),
      });
      syncedOwnerIds.push(ownerId);
    }

    // Add properties for new owners
    const propertyTemplates = [
      { street: "500 Synced Street", unit: "A", monthlyRent: 3000, city: "San Francisco", state: "CA", zipCode: "94105" },
      { street: "600 Synced Avenue", unit: "B", monthlyRent: 3500, city: "San Francisco", state: "CA", zipCode: "94106" },
      { street: "700 Synced Boulevard", unit: "C", monthlyRent: 4000, city: "San Francisco", state: "CA", zipCode: "94107" },
    ];

    const syncedPropertyIds = [];
    for (let i = 0; i < syncedOwnerIds.length; i++) {
      const template = propertyTemplates[i];
      const propertyId = await ctx.db.insert("properties", {
        ownerId: syncedOwnerIds[i],
        propertyManagerId: args.propertyManagerId,
        propertyType: "multi_family",
        occupancyStatus: "occupied",
        address: {
          street: template.street,
          unit: template.unit,
          city: template.city,
          state: template.state,
          zipCode: template.zipCode,
          country: "United States",
          fullAddress: `${template.street}, Unit ${template.unit}, ${template.city}, ${template.state} ${template.zipCode}`,
        },
        monthlyRent: template.monthlyRent,
        securityDeposit: template.monthlyRent,
        leaseStartDate: Date.now() - 90 * 24 * 60 * 60 * 1000,
        leaseEndDate: Date.now() + 275 * 24 * 60 * 60 * 1000,
        status: "active",
        syncedFromIntegration: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      syncedPropertyIds.push(propertyId);
    }

    // Update PM integration status
    await ctx.db.patch(args.propertyManagerId, {
      integrationSynced: {
        enabled: true,
        integrationType: "rent_manager",
        syncType: "all",
        lastSyncedAt: Date.now(),
      },
    });

    return {
      message: "Properties synced successfully",
      ownersAdded: syncedOwnerIds.length,
      propertiesAdded: syncedPropertyIds.length,
    };
  },
});