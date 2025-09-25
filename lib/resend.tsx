import { Resend } from 'resend';
import { render } from '@react-email/render';
import * as React from 'react';
import InvitationEmail from '@/emails/invitation.email';
import AdvanceRequestEmail from '@/emails/advance-request.email';
import AdvanceOwnerResponseEmail from '@/emails/advance-owner-response.email';
import AdvanceRyseDecisionEmail from '@/emails/advance-ryse-decision.email';

const resend = new Resend(process.env.RESEND_API_KEY || "");

export default resend;

export interface InvitationEmailData {
  to: string;
  firstName: string;
  lastName: string;
  companyName: string;
  invitationLink: string;
  adminName?: string;
}

export interface AdvanceRequestEmailData {
  to: string;
  ownerName: string;
  pmCompanyName: string;
  pmName: string;
  properties: Array<{
    address: string;
    monthlyRent: number;
    leaseEndDate: string;
  }>;
  requestedAmount: number;
  termMonths: number;
  monthlyPayment: number;
  invitationLink: string;
}

export async function sendInvitationEmail(data: InvitationEmailData) {
  const { to, firstName, lastName, companyName, invitationLink, adminName } = data;

  try {
    // Render the React Email component to HTML
    const emailHtml = await render(
      <InvitationEmail
        email={to}
        firstName={firstName}
        lastName={lastName}
        companyName={companyName}
        invitationLink={invitationLink}
        adminName={adminName}
      />
    );

    // Generate plain text version
    const emailText = `
Welcome to Ryse, ${firstName}!

You've been invited to join Ryse as a Property Manager for ${companyName}.

To complete your registration with the following prefilled information:
- Name: ${firstName} ${lastName}
- Email: ${to}
- Company: ${companyName}

Click here to complete your registration: ${invitationLink}

What happens next?
1. Complete your profile: Click the link above to finish setting up your account
2. Add your properties: Import or manually add the properties you manage
3. Offer advance rent: Start offering your property owners the option to receive advance rent payments

This invitation link will expire in 7 days. If you have any questions, please don't hesitate to reach out to our support team at support@ryse.com.

Best regards,
${adminName || 'The Ryse Team'}

© 2025 Ryse. All rights reserved.
www.ryse.com
    `;

    const result = await resend.emails.send({
      from: 'Ryse <invites@rysemarket.com>',
      to: [to],
      subject: "You're invited to join Ryse as a Property Manager",
      html: emailHtml,
      text: emailText.trim(),
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return { success: false, error };
  }
}

export async function sendAdvanceRequestEmail(data: AdvanceRequestEmailData) {
  const { to, ownerName, pmCompanyName, pmName, properties, requestedAmount, termMonths, monthlyPayment, invitationLink } = data;

  try {
    // Render the React Email component to HTML
    const emailHtml = await render(
      <AdvanceRequestEmail
        ownerName={ownerName}
        ownerEmail={to}
        pmCompanyName={pmCompanyName}
        pmName={pmName}
        properties={properties}
        requestedAmount={requestedAmount}
        termMonths={termMonths}
        monthlyPayment={monthlyPayment}
        invitationLink={invitationLink}
      />
    );

    // Generate plain text version
    const propertyList = properties.map(p =>
      `- ${p.address}: $${p.monthlyRent.toLocaleString()}/mo (Lease ends ${p.leaseEndDate})`
    ).join('\n');

    const emailText = `
Hello ${ownerName},

${pmName} from ${pmCompanyName} has sent you an offer to receive an advance on your rental income through Ryse.

ADVANCE OFFER: $${requestedAmount.toLocaleString()}
Receive ${termMonths} months of rent upfront

Properties Included:
${propertyList}

Offer Details:
- Advance Amount: $${requestedAmount.toLocaleString()}
- Term: ${termMonths} months
- Monthly Rent Applied: $${monthlyPayment.toLocaleString()}
- Commission: 2% (paid by property manager)

To respond to this offer, please visit:
${invitationLink}

You can:
- Accept the offer as-is
- Counter with a different amount
- Decline the offer

This offer will expire in 7 days and is subject to final approval after acceptance.

Questions? Contact ${pmName} at ${pmCompanyName} or reply to this email for support.

Best regards,
The Ryse Team

© 2025 Ryse. All rights reserved.
www.ryse.com
    `;

    const result = await resend.emails.send({
      from: 'Ryse <advances@rysemarket.com>',
      to: [to],
      subject: `Rent Advance Offer from ${pmCompanyName} - $${requestedAmount.toLocaleString()}`,
      html: emailHtml,
      text: emailText.trim(),
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending advance request email:', error);
    return { success: false, error };
  }
}

export interface AdvanceOwnerResponseEmailData {
  to: string;
  recipientName: string;
  recipientType?: 'pm' | 'admin';
  ownerName: string;
  ownerEmail: string;
  pmCompanyName: string;
  pmName?: string;
  responseType: 'accepted' | 'countered' | 'declined';
  originalAmount: number;
  counterAmount?: number;
  counterTermMonths?: number;
  originalTermMonths: number;
  declineReason?: string;
  properties: Array<{
    address: string;
    monthlyRent: number;
    termMonths?: number;
  }>;
  reviewLink: string;
}

export async function sendAdvanceOwnerResponseEmail(data: AdvanceOwnerResponseEmailData) {
  const { to, ...emailProps } = data;

  try {
    const emailHtml = await render(
      <AdvanceOwnerResponseEmail {...emailProps} />
    );

    const responseTypeText = data.responseType === 'accepted' ? 'Accepted' :
                           data.responseType === 'countered' ? 'Counter Offer Received' : 'Declined';

    const result = await resend.emails.send({
      from: 'Ryse <notifications@rysemarket.com>',
      to: [to],
      subject: `Advance ${responseTypeText} - ${data.ownerName}`,
      html: emailHtml,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending owner response email:', error);
    return { success: false, error };
  }
}

export interface AdvanceRyseDecisionEmailData {
  to: string;
  recipientName: string;
  recipientType: 'owner' | 'pm';
  decision: 'approved' | 'denied';
  ownerName: string;
  pmCompanyName: string;
  amount: number;
  termMonths: number;
  properties: Array<{
    address: string;
    monthlyRent: number;
    termMonths?: number;
  }>;
  denialReason?: string;
  disbursementDate?: string;
  portalLink: string;
  commission?: number;
}

export async function sendAdvanceRyseDecisionEmail(data: AdvanceRyseDecisionEmailData) {
  const { to, ...emailProps } = data;

  try {
    const emailHtml = await render(
      <AdvanceRyseDecisionEmail {...emailProps} />
    );

    const result = await resend.emails.send({
      from: 'Ryse <notifications@rysemarket.com>',
      to: [to],
      subject: `Advance ${data.decision === 'approved' ? 'Approved' : 'Denied'} - $${data.amount.toLocaleString()}`,
      html: emailHtml,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending Ryse decision email:', error);
    return { success: false, error };
  }
}