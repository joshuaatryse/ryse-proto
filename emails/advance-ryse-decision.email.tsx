import * as React from 'react';
import { Text, Section, Heading, Hr } from '@react-email/components';
import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
} from './components';

interface AdvanceRyseDecisionEmailProps {
  recipientName: string; // Owner or PM name
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
  disbursementDate?: string; // For approved advances
  portalLink: string; // Link to owner/PM portal
  commission?: number; // PM commission amount
}

export const AdvanceRyseDecisionEmail: React.FC<AdvanceRyseDecisionEmailProps> = ({
  recipientName,
  recipientType,
  decision,
  ownerName,
  pmCompanyName,
  amount,
  termMonths,
  properties,
  denialReason,
  disbursementDate,
  portalLink,
  commission,
}) => {
  const isOwner = recipientType === 'owner';
  const isApproved = decision === 'approved';

  return (
    <EmailLayout preview={`Advance ${decision === 'approved' ? 'Approved' : 'Denied'} - $${amount.toLocaleString()}`}>
      <EmailHeader isPMBranded={recipientType === 'owner'} />

      <Section style={{ padding: '40px 20px' }}>
        <Heading style={heading}>
          Hello {recipientName},
        </Heading>

        <Text style={paragraph}>
          {isApproved ? (
            isOwner ? (
              <>Great news! Your rent advance has been approved.</>
            ) : (
              <>Great news! Your rent advance to {ownerName} has been approved by Ryse.</>
            )
          ) : (
            <>We've completed our review of the rent advance request.</>
          )}
        </Text>

        {/* Decision Card */}
        <div dangerouslySetInnerHTML={{ __html: `
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 32px 0; width: 100% !important; min-width: 100% !important;">
            <tr>
              <td>
                <table class="decision-card" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="${isApproved ? '#F0F8FF' : '#fee2e2'}" style="border: 2px solid ${isApproved ? '#B3D9FF' : '#fecaca'}; border-radius: 12px; width: 100% !important;">
                  <tr>
                    <td style="padding: 24px;">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="text-align: center;">
                            ${isApproved ? `
                              <div style="display: inline-block; width: 48px; height: 48px; background-color: #22c55e; border-radius: 50%; margin-bottom: 16px;">
                                <div style="padding-top: 12px; font-size: 24px; color: white;">✓</div>
                              </div>
                            ` : `
                              <div style="display: inline-block; width: 48px; height: 48px; background-color: #ef4444; border-radius: 50%; margin-bottom: 16px;">
                                <div style="padding-top: 12px; font-size: 24px; color: white;">✕</div>
                              </div>
                            `}
                            <p style="margin: 0 0 4px 0; color: ${isApproved ? '#0066CC' : '#991b1b'}; font-size: 18px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                              Advance ${isApproved ? 'Approved' : 'Denied'}
                            </p>
                            ${isApproved ? `
                              <p style="margin: 12px 0 8px; color: #003D7A; font-size: 36px; font-weight: 700; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                                $${amount.toLocaleString()}
                              </p>
                              <p style="margin: 0; color: #0066CC; font-size: 16px; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                                ${properties.length > 1 && properties.some((p, i, arr) => p.termMonths !== arr[0].termMonths) ? 'Average ' : ''}${termMonths} month term
                              </p>
                              ${!isOwner && commission ? `
                                <p style="margin: 8px 0 0; color: #0066CC; font-size: 14px; font-weight: 500; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                                  💰 Your commission: $${commission.toLocaleString()}
                                </p>
                              ` : ''}
                              ${disbursementDate ? `
                                <p style="margin: 16px 0 0; padding: 12px; background-color: white; border-radius: 6px; color: #0066CC; font-size: 14px; font-weight: 500; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                                  💰 Funds will be disbursed by ${disbursementDate}
                                </p>
                              ` : ''}
                            ` : `
                              ${denialReason ? `
                                <p style="margin: 16px 0 0; padding: 12px; background-color: white; border-radius: 6px; color: #374151; font-size: 14px; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                                  <strong>Reason:</strong> ${denialReason}
                                </p>
                              ` : ''}
                            `}
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

        {/* Advance Details */}
        <Text style={subheading}>
          Advance Details
        </Text>
        <div dangerouslySetInnerHTML={{ __html: `
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 24px 0; width: 100% !important;">
            <tr>
              <td>
                <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f3f4f6" style="background-color: #f3f4f6 !important; border-radius: 8px; padding: 20px; width: 100% !important;">
                  <tr>
                    <td>
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td width="50%">
                            <p style="margin: 0 0 12px; font-size: 14px; color: #374151; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                              <strong>Owner:</strong><br />${ownerName}
                            </p>
                            <p style="margin: 0; font-size: 14px; color: #374151; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                              <strong>Property Manager:</strong><br />${pmCompanyName}
                            </p>
                          </td>
                          <td width="50%" style="text-align: right;">
                            <p style="margin: 0 0 12px; font-size: 14px; color: #374151; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                              <strong>Amount:</strong><br />$${amount.toLocaleString()}
                            </p>
                            <p style="margin: 0; font-size: 14px; color: #374151; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                              <strong>${properties.length > 1 && properties.some((p, i, arr) => p.termMonths !== arr[0].termMonths) ? 'Average Term' : 'Term'}:</strong><br />${termMonths} months
                            </p>
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

        {/* Properties Table */}
        <Text style={subheading}>
          Properties Included
        </Text>
        <div dangerouslySetInnerHTML={{ __html: `
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 32px 0; width: 100% !important; min-width: 100% !important;">
            <tr>
              <td>
                <table class="properties-table" width="100%" border="0" cellspacing="0" cellpadding="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; width: 100% !important;">
                  <thead>
                    <tr>
                      <td bgcolor="#f3f4f6" style="background-color: #f3f4f6 !important; padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 500; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Property</td>
                      <td bgcolor="#f3f4f6" style="background-color: #f3f4f6 !important; padding: 12px 16px; text-align: center; font-size: 12px; font-weight: 500; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Term</td>
                      <td bgcolor="#f3f4f6" style="background-color: #f3f4f6 !important; padding: 12px 16px; text-align: right; font-size: 12px; font-weight: 500; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Monthly Rent</td>
                    </tr>
                  </thead>
                  <tbody>
                    ${properties.map((property, index) => `
                      <tr>
                        <td style="padding: 16px; ${index > 0 ? 'border-top: 1px solid #e5e7eb;' : ''} color: #1a1a1a; font-size: 14px; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${property.address}</td>
                        <td style="padding: 16px; ${index > 0 ? 'border-top: 1px solid #e5e7eb;' : ''} color: #1a1a1a; font-size: 14px; text-align: center; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${property.termMonths || termMonths} months</td>
                        <td style="padding: 16px; ${index > 0 ? 'border-top: 1px solid #e5e7eb;' : ''} color: #1a1a1a; font-size: 14px; font-weight: 500; text-align: right; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">$${property.monthlyRent.toLocaleString()}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </td>
            </tr>
          </table>
        ` }} />

        {/* Next Steps */}
        <Hr style={divider} />
        <Text style={subheading}>
          {isApproved ? 'What Happens Next' : 'Other Options'}
        </Text>

        {isApproved ? (
          <>
            {isOwner ? (
              <>
                <Text style={listItem}>
                  <strong>1. Funds disbursement:</strong> You'll receive ${amount.toLocaleString()} within 2-3 business days
                </Text>
                <Text style={listItem}>
                  <strong>2. Monthly reconciliation:</strong> Your property manager will handle all rent collection and reconciliation
                </Text>
                <Text style={listItem}>
                  <strong>3. Portal access:</strong> Track your advance status and payments in your owner portal
                </Text>
              </>
            ) : (
              <>
                <Text style={listItem}>
                  <strong>1. Owner receives funds:</strong> ${amount.toLocaleString()} will be disbursed to the owner
                </Text>
                <Text style={listItem}>
                  <strong>2. Commission payment:</strong> Your 2% commission will be paid separately
                </Text>
                <Text style={listItem}>
                  <strong>3. Monthly reconciliation:</strong> Continue collecting rent and reconciling with Ryse monthly
                </Text>
              </>
            )}
          </>
        ) : (
          <>
            <Text style={listItem}>
              <strong>Need assistance?</strong> Our team is here to help address any concerns
            </Text>
            <Text style={listItem}>
              <strong>Alternative options:</strong> You may submit a new advance request with different terms
            </Text>
            <Text style={listItem}>
              <strong>Questions?</strong> Contact us at support@rysemarket.com
            </Text>
          </>
        )}

        {/* Important Information Box */}
        {isApproved && (
          <div dangerouslySetInnerHTML={{ __html: `
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 32px 0; width: 100% !important;">
              <tr>
                <td>
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#eff6ff" style="border: 1px solid #3b82f6; border-radius: 8px; width: 100% !important;">
                    <tr>
                      <td style="padding: 20px;">
                        <p style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #1e40af; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                          Important Information
                        </p>
                        ${isOwner ? `
                          <p style="margin: 8px 0; font-size: 14px; line-height: 20px; color: #3730a3; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                            • Funds will be deposited to your account on file
                          </p>
                          <p style="margin: 8px 0; font-size: 14px; line-height: 20px; color: #3730a3; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                            • You'll receive a confirmation once funds are sent
                          </p>
                          <p style="margin: 8px 0; font-size: 14px; line-height: 20px; color: #3730a3; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                            • Monthly statements will be available in your portal
                          </p>
                        ` : `
                          <p style="margin: 8px 0; font-size: 14px; line-height: 20px; color: #3730a3; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                            • Your 2% commission will be paid within 5 business days
                          </p>
                          <p style="margin: 8px 0; font-size: 14px; line-height: 20px; color: #3730a3; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                            • Continue normal rent collection procedures
                          </p>
                          <p style="margin: 8px 0; font-size: 14px; line-height: 20px; color: #3730a3; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                            • Submit monthly reconciliation reports as usual
                          </p>
                        `}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          ` }} />
        )}

        {/* CTA Button */}
        <div dangerouslySetInnerHTML={{ __html: `
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 32px 0;">
            <tr>
              <td>
                <table border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td bgcolor="#001F7A" style="background-color: #001F7A !important; border-radius: 6px;">
                      <a href="${portalLink}" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; text-decoration: none; color: #ffffff; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                        View in ${isOwner ? 'Owner' : 'PM'} Portal
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        ` }} />

        <Text style={signature}>
          {recipientType === 'owner'
            ? `Questions? Contact your property manager at ${pmCompanyName} for support.`
            : 'Questions? Contact us at support@rysemarket.com or call 1-800-RYSE-NOW'
          }
        </Text>

        <Text style={signature}>
          Best regards,<br />
          {recipientType === 'owner' ? 'The Nomad Team' : 'The Ryse Team'}
        </Text>
      </Section>

      <EmailFooter isPMBranded={recipientType === 'owner'} />
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
AdvanceRyseDecisionEmail.PreviewProps = {
  recipientName: 'John Smith',
  recipientType: 'owner',
  decision: 'approved',
  ownerName: 'John Smith',
  pmCompanyName: 'Premier Property Management',
  amount: 45000,
  termMonths: 8,
  properties: [
    {
      address: '123 Main St, Apt 4B',
      monthlyRent: 3500,
    },
    {
      address: '456 Oak Avenue',
      monthlyRent: 2800,
    },
  ],
  disbursementDate: 'December 20, 2024',
  portalLink: 'https://ryse-demo.vercel.app/owner/advances',
} as AdvanceRyseDecisionEmailProps;

export default AdvanceRyseDecisionEmail;