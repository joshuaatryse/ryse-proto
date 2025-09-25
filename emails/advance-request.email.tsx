import * as React from 'react';
import { Text, Section, Heading, Hr } from '@react-email/components';
import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
} from './components';

interface AdvanceRequestEmailProps {
  ownerName: string;
  ownerEmail: string;
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
  expiresInDays?: number;
}

export const AdvanceRequestEmail: React.FC<AdvanceRequestEmailProps> = ({
  ownerName,
  pmCompanyName,
  pmName,
  properties,
  requestedAmount,
  termMonths,
  monthlyPayment,
  invitationLink,
  expiresInDays = 7,
}) => {

  return (
    <EmailLayout preview={`Rent Advance Offer from ${pmCompanyName}`}>
      <EmailHeader isPMBranded={true} />

      <Section style={{ padding: '40px 20px' }}>
        <Heading style={heading}>
          Hello {ownerName},
        </Heading>

        <Text style={paragraph}>
          {pmName} from <strong>{pmCompanyName}</strong> has sent you an offer to receive an advance on your rental income through Nomad.
        </Text>

        {/* Modern Summary Card - Advance Offer */}
        <div dangerouslySetInnerHTML={{ __html: `
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 32px 0; width: 100% !important; min-width: 100% !important;">
            <tr>
              <td>
                <table class="summary-card" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#dcfce7" style="border: 1px solid #86efac; border-radius: 12px; width: 100% !important;">
                  <tr>
                    <td style="padding: 24px;">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="vertical-align: top; width: 50%;">
                            <p style="margin: 0 0 4px 0; color: #166534; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Advance Offer</p>
                            <p style="margin: 0; color: #14532d; font-size: 16px; font-weight: 500; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${properties.length > 1 ? 'Average ' : ''}${termMonths} months of rent upfront</p>
                          </td>
                          <td class="summary-amount" style="text-align: right; vertical-align: top; width: 50%;">
                            <p style="margin: 0; color: #14532d; font-size: 36px; font-weight: 700; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; white-space: nowrap;">$${requestedAmount.toLocaleString()}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        ` }} />

        <Text style={subheading}>
          Properties Included
        </Text>

        {/* Properties Table */}
        <div dangerouslySetInnerHTML={{ __html: `
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 32px 0; width: 100% !important; min-width: 100% !important;">
            <tr>
              <td>
                <table class="properties-table" width="100%" border="0" cellspacing="0" cellpadding="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; width: 100% !important;">
                  <thead>
                    <tr>
                      <td bgcolor="#f3f4f6" style="background-color: #f3f4f6 !important; padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 500; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Property</td>
                      <td bgcolor="#f3f4f6" style="background-color: #f3f4f6 !important; padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 500; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Monthly Rent</td>
                      <td bgcolor="#f3f4f6" style="background-color: #f3f4f6 !important; padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 500; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Lease End Date</td>
                    </tr>
                  </thead>
                  <tbody>
                    ${properties.map((property, index) => `
                      <tr>
                        <td style="padding: 16px; ${index > 0 ? 'border-top: 1px solid #e5e7eb;' : ''} color: #1a1a1a; font-size: 14px; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${property.address}</td>
                        <td style="padding: 16px; ${index > 0 ? 'border-top: 1px solid #e5e7eb;' : ''} color: #1a1a1a; font-size: 14px; font-weight: 500; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">$${property.monthlyRent.toLocaleString()}</td>
                        <td style="padding: 16px; ${index > 0 ? 'border-top: 1px solid #e5e7eb;' : ''} color: #6b7280; font-size: 14px; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${property.leaseEndDate}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </td>
            </tr>
          </table>
        ` }} />

        {/* Offer Details Card */}
        <div dangerouslySetInnerHTML={{ __html: `
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 32px 0; width: 100% !important; min-width: 100% !important;">
            <tr>
              <td>
                <!--[if mso]>
                <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:100%;">
                <v:fill type="tile" color="#f3f4f6" />
                <v:textbox style="mso-fit-shape-to-text:true" inset="0,0,0,0">
                <![endif]-->
                <table class="offer-details-card" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f3f4f6" style="background-color: #f3f4f6 !important; border: 1px solid #e5e7eb; border-radius: 8px; width: 100% !important;">
                  <tr>
                    <td style="padding: 24px;">
                      <h3 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 16px; font-weight: 600; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Offer Details</h3>
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="padding: 4px 0;">
                            <p style="margin: 0; color: #6b7280; font-size: 14px; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                              <strong style="color: #1a1a1a;">Advance Amount:</strong><br>$${requestedAmount.toLocaleString()}
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 4px 0;">
                            <p style="margin: 0; color: #6b7280; font-size: 14px; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                              <strong style="color: #1a1a1a;">${properties.length > 1 ? 'Average Term Length' : 'Term Length'}:</strong><br>${termMonths} months
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 4px 0;">
                            <p style="margin: 0; color: #6b7280; font-size: 14px; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                              <strong style="color: #1a1a1a;">Total Monthly Rent:</strong><br>$${monthlyPayment.toLocaleString()}
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                <!--[if mso]>
                </v:textbox>
                </v:rect>
                <![endif]-->
              </td>
            </tr>
          </table>
        ` }} />

        {/* CTA Buttons */}
        <div dangerouslySetInnerHTML={{ __html: `
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 32px 0;">
            <tr>
              <td>
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td width="48%" style="padding-right: 2%;">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td bgcolor="#e5e7eb" style="background-color: #e5e7eb !important; border-radius: 6px; text-align: center;">
                            <a href="${invitationLink}&action=counter" style="display: block; padding: 14px 24px; font-size: 16px; font-weight: 600; text-decoration: none; color: #374151; text-align: center; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Counter Offer</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td width="48%" style="padding-left: 2%;">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td bgcolor="#E6EDFF" style="border-radius: 6px; text-align: center;">
                            <a href="${invitationLink}&action=accept" style="display: block; padding: 14px 24px; font-size: 16px; font-weight: 600; text-decoration: none; color: #001F7A; text-align: center; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Accept Offer</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding-top: 12px;">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td bgcolor="#fee2e2" style="border-radius: 6px; text-align: center;">
                            <a href="${invitationLink}&action=decline" style="display: block; padding: 10px 24px; font-size: 16px; font-weight: 600; text-decoration: none; color: #dc2626; text-align: center; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Decline</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        ` }} />

        <Text style={paragraph}>
          <a href={invitationLink} style={{ color: '#3b82f6', textDecoration: 'underline' }}>
            Or view full details here
          </a>
        </Text>

        <Hr style={divider} />

        <Text style={subheading}>
          How It Works
        </Text>

        <Text style={listItem}>
          <strong>1. Review the offer:</strong> Click any button above to see full details and terms
        </Text>

        <Text style={listItem}>
          <strong>2. Make your decision:</strong> Accept, counter with a different amount, or decline
        </Text>

        <Text style={listItem}>
          <strong>3. Quick verification:</strong> If you accept or counter, we'll need to verify your identity (takes 2 minutes)
        </Text>

        <Text style={listItem}>
          <strong>4. Sign agreement:</strong> Review and sign the advance agreement electronically
        </Text>

        <Text style={listItem}>
          <strong>5. Receive funds:</strong> Once approved, funds are typically disbursed within 2-3 business days
        </Text>

        <Hr style={divider} />

        <div dangerouslySetInnerHTML={{ __html: `
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
            <tr>
              <td>
                <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#eff6ff" style="border-radius: 8px;">
                  <tr>
                    <td style="padding: 20px;">
                      <p style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #1e40af; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                        Benefits of Accepting
                      </p>
                      <p style="margin: 8px 0; font-size: 14px; line-height: 20px; color: #3730a3; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                        ✓ Immediate access to rental income
                      </p>
                      <p style="margin: 8px 0; font-size: 14px; line-height: 20px; color: #3730a3; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                        ✓ No credit checks or personal guarantees
                      </p>
                      <p style="margin: 8px 0; font-size: 14px; line-height: 20px; color: #3730a3; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                        ✓ Your property manager continues to handle everything
                      </p>
                      <p style="margin: 8px 0; font-size: 14px; line-height: 20px; color: #3730a3; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                        ✓ Flexible use of funds for any purpose
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        ` }} />

        {/* Important Note Card */}
        <div dangerouslySetInnerHTML={{ __html: `
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 32px 0; width: 100% !important; min-width: 100% !important;">
            <tr>
              <td>
                <table class="note-card" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#fef3c7" style="border: 1px solid #fde68a; border-radius: 6px; width: 100% !important;">
                  <tr>
                    <td style="padding: 16px;">
                      <p style="margin: 0; color: #92400e; font-size: 14px; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                        <strong>Important:</strong> This offer will expire in ${expiresInDays} days. This is subject to final approval after acceptance. You are not obligated to accept this offer.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        ` }} />

        <Text style={signature}>
          Questions? Contact {pmName} at {pmCompanyName} or reply to this email for support.
        </Text>

        <Text style={signature}>
          Best regards,<br />
          The Nomad Team
        </Text>
      </Section>

      <EmailFooter isPMBranded={true} />
    </EmailLayout>
  );
};

const heading = {
  fontSize: '24px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '0 0 20px',
};

const subheading = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#344054',
  margin: '24px 0 16px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#4a5568',
  margin: '0 0 20px',
};

const listItem = {
  fontSize: '15px',
  lineHeight: '22px',
  color: '#4a5568',
  margin: '12px 0',
  paddingLeft: '8px',
};

const linkText = {
  fontSize: '14px',
  color: '#3b82f6',
  wordBreak: 'break-all' as const,
  margin: '8px 0 20px',
};

const divider = {
  border: 'none',
  borderTop: '1px solid #e2e8f0',
  margin: '32px 0',
};

const signature = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#667085',
  margin: '24px 0 0',
};

// Preview props for development
// @ts-ignore - PreviewProps for React Email Dev Server
AdvanceRequestEmail.PreviewProps = {
  ownerName: 'John Smith',
  ownerEmail: 'john.smith@example.com',
  pmCompanyName: 'Premier Property Management',
  pmName: 'Sarah Johnson',
  properties: [
    {
      address: '123 Main St, Apt 4B',
      monthlyRent: 3500,
      leaseEndDate: 'March 2025',
    },
    {
      address: '456 Oak Avenue',
      monthlyRent: 2800,
      leaseEndDate: 'June 2025',
    },
  ],
  requestedAmount: 45000,
  termMonths: 8,
  monthlyPayment: 6300,
  invitationLink: 'https://ryse.com/owner/advance-invite?token=abc123xyz',
  expiresInDays: 7,
} as AdvanceRequestEmailProps;

export default AdvanceRequestEmail;