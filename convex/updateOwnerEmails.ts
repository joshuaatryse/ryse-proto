import { mutation } from "./_generated/server";

// Script to update all owner emails to test emails
export const updateAllOwnerEmails = mutation({
  handler: async (ctx) => {
    // Get all owners
    const owners = await ctx.db.query("owners").collect();

    console.log(`Found ${owners.length} owners to update`);

    // Group owners by property manager to ensure unique emails across PMs
    const ownersByPM = new Map<string, typeof owners>();

    for (const owner of owners) {
      const pmId = owner.propertyManagerId;
      if (!ownersByPM.has(pmId)) {
        ownersByPM.set(pmId, []);
      }
      ownersByPM.get(pmId)!.push(owner);
    }

    let totalUpdated = 0;
    const updates: Array<{ name: string, oldEmail: string, newEmail: string }> = [];

    // Update each owner with a unique test email
    for (const [pmId, pmOwners] of Array.from(ownersByPM)) {
      // Sort owners by name for consistent ordering
      pmOwners.sort((a: any, b: any) => a.name.localeCompare(b.name));

      for (let i = 0; i < pmOwners.length; i++) {
        const owner = pmOwners[i];
        const ownerNumber = i + 1;
        const newEmail = `joshua+owner${ownerNumber}@rysemarket.com`;

        // Update the owner's email
        await ctx.db.patch(owner._id, {
          email: newEmail,
        });

        updates.push({
          name: owner.name,
          oldEmail: owner.email,
          newEmail: newEmail,
        });

        totalUpdated++;
      }
    }

    console.log("Email updates completed:");
    updates.forEach(update => {
      console.log(`  ${update.name}: ${update.oldEmail} → ${update.newEmail}`);
    });

    return {
      success: true,
      totalUpdated,
      updates,
    };
  },
});

// Script to update a single property manager's owners
export const updatePMOwnerEmails = mutation({
  args: {},
  handler: async (ctx) => {
    // For when running from PM context, get the PM ID from session
    // This is a placeholder - in production you'd get this from auth
    const propertyManagerId = "YOUR_PM_ID_HERE";

    const owners = await ctx.db
      .query("owners")
      .withIndex("by_property_manager", (q) => q.eq("propertyManagerId", propertyManagerId as any))
      .collect();

    console.log(`Found ${owners.length} owners for this PM`);

    // Sort owners by name for consistent ordering
    owners.sort((a: any, b: any) => a.name.localeCompare(b.name));

    const updates: Array<{ name: string, oldEmail: string, newEmail: string }> = [];

    for (let i = 0; i < owners.length; i++) {
      const owner = owners[i];
      const ownerNumber = i + 1;
      const newEmail = `joshua+owner${ownerNumber}@rysemarket.com`;

      // Update the owner's email
      await ctx.db.patch(owner._id, {
        email: newEmail,
      });

      updates.push({
        name: owner.name,
        oldEmail: owner.email,
        newEmail: newEmail,
      });
    }

    return {
      success: true,
      totalUpdated: updates.length,
      updates,
    };
  },
});