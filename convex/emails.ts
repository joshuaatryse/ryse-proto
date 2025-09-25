import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

// Email action to send advance-related emails
export const sendAdvanceOwnerResponseEmail = internalAction({
  args: {
    recipientEmail: v.string(),
    recipientName: v.string(),
    ownerName: v.string(),
    ownerEmail: v.string(),
    pmCompanyName: v.string(),
    responseType: v.union(v.literal("accepted"), v.literal("countered"), v.literal("declined")),
    originalAmount: v.number(),
    counterAmount: v.optional(v.number()),
    counterTermMonths: v.optional(v.number()),
    originalTermMonths: v.number(),
    declineReason: v.optional(v.string()),
    properties: v.array(v.object({
      address: v.string(),
      monthlyRent: v.number(),
    })),
    reviewLink: v.string(),
  },
  handler: async (ctx, args) => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      console.error("Missing RESEND_API_KEY");
      return { success: false, error: "Email service not configured" };
    }

    try {
      const { Resend } = await import("resend");
      const resend = new Resend(RESEND_API_KEY);

      // Import the React email template and render function
      const { AdvanceOwnerResponseEmail } = await import("@/emails/advance-owner-response.email");
      const { render } = await import("@react-email/render");

      // Render the email
      const emailHtml = await render(AdvanceOwnerResponseEmail(args));

      const getResponseTitle = () => {
        switch (args.responseType) {
          case "accepted":
            return "Advance Offer Accepted";
          case "countered":
            return "Counter Offer Received";
          case "declined":
            return "Advance Offer Declined";
        }
      };

      const result = await resend.emails.send({
        from: "Ryse <notifications@ryse.com>",
        to: args.recipientEmail,
        subject: `${getResponseTitle()} - ${args.ownerName}`,
        html: emailHtml,
      });

      return { success: true, emailId: result.data?.id || 'email-sent' };
    } catch (error) {
      console.error("Error sending owner response email:", error);
      return { success: false, error: String(error) };
    }
  },
});

export const sendAdvanceRyseDecisionEmail = internalAction({
  args: {
    recipientEmail: v.string(),
    recipientName: v.string(),
    recipientType: v.union(v.literal("owner"), v.literal("pm")),
    decision: v.union(v.literal("approved"), v.literal("denied")),
    ownerName: v.string(),
    pmCompanyName: v.string(),
    amount: v.number(),
    termMonths: v.number(),
    properties: v.array(v.object({
      address: v.string(),
      monthlyRent: v.number(),
    })),
    denialReason: v.optional(v.string()),
    disbursementDate: v.optional(v.string()),
    portalLink: v.string(),
  },
  handler: async (ctx, args) => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      console.error("Missing RESEND_API_KEY");
      return { success: false, error: "Email service not configured" };
    }

    try {
      const { Resend } = await import("resend");
      const resend = new Resend(RESEND_API_KEY);

      // Import the React email template and render function
      const { AdvanceRyseDecisionEmail } = await import("@/emails/advance-ryse-decision.email");
      const { render } = await import("@react-email/render");

      // Render the email
      const emailHtml = await render(AdvanceRyseDecisionEmail(args));

      const result = await resend.emails.send({
        from: "Ryse <notifications@ryse.com>",
        to: args.recipientEmail,
        subject: `Advance ${args.decision === "approved" ? "Approved" : "Denied"} - $${args.amount.toLocaleString()}`,
        html: emailHtml,
      });

      return { success: true, emailId: result.data?.id || 'email-sent' };
    } catch (error) {
      console.error("Error sending Ryse decision email:", error);
      return { success: false, error: String(error) };
    }
  },
});

// Helper to send initial advance request email (already exists)
export const sendAdvanceRequestEmail = internalAction({
  args: {
    recipientEmail: v.string(),
    ownerName: v.string(),
    ownerEmail: v.string(),
    pmCompanyName: v.string(),
    pmName: v.string(),
    properties: v.array(v.object({
      address: v.string(),
      monthlyRent: v.number(),
      leaseEndDate: v.string(),
    })),
    requestedAmount: v.number(),
    termMonths: v.number(),
    monthlyPayment: v.number(),
    invitationLink: v.string(),
    expiresInDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      console.error("Missing RESEND_API_KEY");
      return { success: false, error: "Email service not configured" };
    }

    try {
      const { Resend } = await import("resend");
      const resend = new Resend(RESEND_API_KEY);

      // Import the React email template and render function
      const { AdvanceRequestEmail } = await import("@/emails/advance-request.email");
      const { render } = await import("@react-email/render");

      // Render the email
      const emailHtml = await render(AdvanceRequestEmail(args));

      const result = await resend.emails.send({
        from: "Ryse <notifications@ryse.com>",
        to: args.recipientEmail,
        subject: `Rent Advance Offer from ${args.pmCompanyName}`,
        html: emailHtml,
      });

      return { success: true, emailId: result.data?.id || 'email-sent' };
    } catch (error) {
      console.error("Error sending advance request email:", error);
      return { success: false, error: String(error) };
    }
  },
});