import * as React from 'react';
import { Text, Section, Heading, Hr } from '@react-email/components';
import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
} from './components';

interface AdvanceOwnerResponseEmailProps {
  recipientName: string; // PM name or Admin name
  recipientType?: 'pm' | 'admin'; // To differentiate email content
  ownerName: string;
  ownerEmail: string;
  pmCompanyName: string;
  pmName?: string; // PM's name for admin emails
  responseType: 'accepted' | 'countered' | 'declined';
  originalAmount: number;
  counterAmount?: number; // For counter offers
  counterTermMonths?: number; // For counter offers
  originalTermMonths: number;
  declineReason?: string;
  properties: Array<{
    address: string;
    monthlyRent: number;
    termMonths?: number; // Individual property term months
  }>;
  reviewLink: string; // Link for PM/Admin to review
}

export const AdvanceOwnerResponseEmail: React.FC<AdvanceOwnerResponseEmailProps> = ({
  recipientName,
  recipientType,
  ownerName,
  ownerEmail,
  pmCompanyName,
  pmName,
  responseType,
  originalAmount,
  counterAmount,
  counterTermMonths,
  originalTermMonths,
  declineReason,
  properties,
  reviewLink,
}) => {
  const getResponseTitle = () => {
    switch (responseType) {
      case 'accepted':
        return 'Advance Offer Accepted';
      case 'countered':
        return 'Counter Offer Received';
      case 'declined':
        return 'Advance Offer Declined';
    }
  };

  const getResponseColor = () => {
    switch (responseType) {
      case 'accepted':
        return { bg: '#dcfce7', border: '#86efac', text: '#166534' };
      case 'countered':
        return { bg: '#fef3c7', border: '#fde68a', text: '#92400e' };
      case 'declined':
        return { bg: '#fee2e2', border: '#fecaca', text: '#991b1b' };
    }
  };

  const colors = getResponseColor();

  return (
    <EmailLayout preview={`${getResponseTitle()} - ${ownerName}`}>
      <EmailHeader isPMBranded={false} />

      <Section style={{ padding: '40px 20px' }}>
        <Heading style={heading}>
          Hello {recipientName},
        </Heading>

        <Text style={paragraph}>
          {recipientType === 'admin' ? (
            <><strong>{ownerName}</strong> has {responseType === 'accepted' ? 'accepted' : responseType === 'countered' ? 'countered' : 'rejected'} a rent advance offer from {pmName || pmCompanyName}.</>
          ) : (
            <><strong>{ownerName}</strong> has {responseType === 'accepted' ? 'accepted' : responseType === 'countered' ? 'countered' : 'rejected'} your rent advance offer.</>
          )}
        </Text>

        {/* Response Card */}
        <div dangerouslySetInnerHTML={{ __html: `
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 32px 0; width: 100% !important; min-width: 100% !important;">
            <tr>
              <td>
                <table class="response-card" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="${colors.bg}" style="border: 2px solid ${colors.border}; border-radius: 12px; width: 100% !important;">
                  <tr>
                    <td style="padding: 24px;">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td>
                            <p style="margin: 0 0 4px 0; color: ${colors.text}; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                              ${getResponseTitle()}
                            </p>
                            ${responseType === 'accepted' ? `
                              <p style="margin: 8px 0 0; color: #14532d; font-size: 24px; font-weight: 700; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                                $${originalAmount.toLocaleString()}
                              </p>
                              <p style="margin: 4px 0 0; color: #166534; font-size: 14px; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                                ${properties.some(p => p.termMonths && p.termMonths !== originalTermMonths)
                                  ? `${originalTermMonths} months average term`
                                  : `${originalTermMonths} months term`}
                              </p>
                            ` : ''}
                            ${responseType === 'countered' && counterAmount ? `
                              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 12px;">
                                <tr>
                                  <td width="50%">
                                    <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Original Offer</p>
                                    <p style="margin: 4px 0 0; color: #374151; font-size: 18px; font-weight: 600; text-decoration: line-through; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                                      $${originalAmount.toLocaleString()}
                                    </p>
                                    <p style="margin: 2px 0 0; color: #6b7280; font-size: 13px; text-decoration: line-through; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                                      ${properties.some(p => p.termMonths && p.termMonths !== originalTermMonths)
                                        ? `${originalTermMonths} months avg`
                                        : `${originalTermMonths} months`}
                                    </p>
                                  </td>
                                  <td width="50%">
                                    <p style="margin: 0; color: #92400e; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Counter Offer</p>
                                    <p style="margin: 4px 0 0; color: #92400e; font-size: 24px; font-weight: 700; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                                      $${counterAmount.toLocaleString()}
                                    </p>
                                    <p style="margin: 2px 0 0; color: #92400e; font-size: 14px; font-weight: 500; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                                      ${properties.some(p => p.termMonths && p.termMonths !== (counterTermMonths || originalTermMonths))
                                        ? `${counterTermMonths || originalTermMonths} months avg`
                                        : `${counterTermMonths || originalTermMonths} months`}
                                    </p>
                                  </td>
                                </tr>
                              </table>
                            ` : ''}
                            ${responseType === 'declined' && declineReason ? `
                              <p style="margin: 12px 0 0; padding: 12px; background-color: white; border-radius: 6px; color: #374151; font-size: 14px; font-style: italic; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                                "${declineReason}"
                              </p>
                            ` : responseType === 'declined' ? `
                              <p style="margin: 12px 0 0; color: #991b1b; font-size: 14px; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                                No reason provided
                              </p>
                            ` : ''}
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

        {/* Owner Details */}
        <Text style={subheading}>
          Owner Information
        </Text>
        <div dangerouslySetInnerHTML={{ __html: `
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 24px 0; width: 100% !important;">
            <tr>
              <td>
                <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f3f4f6" style="background-color: #f3f4f6 !important; border-radius: 8px; padding: 16px; width: 100% !important;">
                  <tr>
                    <td>
                      <p style="margin: 0 0 8px; font-size: 14px; color: #374151; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                        <strong>Name:</strong> ${ownerName}
                      </p>
                      <p style="margin: 0 0 8px; font-size: 14px; color: #374151; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                        <strong>Email:</strong> ${ownerEmail}
                      </p>
                      <p style="margin: 0; font-size: 14px; color: #374151; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                        <strong>Properties:</strong> ${properties.length} included
                      </p>
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
                      <td bgcolor="#f3f4f6" style="background-color: #f3f4f6 !important; padding: 12px 16px; text-align: right; font-size: 12px; font-weight: 500; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Monthly Rent</td>
                      <td bgcolor="#f3f4f6" style="background-color: #f3f4f6 !important; padding: 12px 16px; text-align: right; font-size: 12px; font-weight: 500; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Term</td>
                    </tr>
                  </thead>
                  <tbody>
                    ${properties.map((property, index) => `
                      <tr>
                        <td style="padding: 16px; ${index > 0 ? 'border-top: 1px solid #e5e7eb;' : ''} color: #1a1a1a; font-size: 14px; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${property.address}</td>
                        <td style="padding: 16px; ${index > 0 ? 'border-top: 1px solid #e5e7eb;' : ''} color: #1a1a1a; font-size: 14px; font-weight: 500; text-align: right; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">$${property.monthlyRent.toLocaleString()}</td>
                        <td style="padding: 16px; ${index > 0 ? 'border-top: 1px solid #e5e7eb;' : ''} color: #1a1a1a; font-size: 14px; font-weight: 500; text-align: right; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${property.termMonths || originalTermMonths} mo</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </td>
            </tr>
          </table>
        ` }} />

        {/* Next Steps */}
        {responseType !== 'declined' && (
          <>
            <Hr style={divider} />
            <Text style={subheading}>
              Next Steps
            </Text>
            {recipientType === 'admin' ? (
              <Text style={paragraph}>
                Please log into the admin portal to review the details, finalize due diligence and underwriting, and respond to this request.
              </Text>
            ) : (
              <>
                {responseType === 'accepted' && (
                  <>
                    <Text style={listItem}>
                      <strong>1. Review completed verification:</strong> The owner has completed identity verification and signed the agreement
                    </Text>
                    <Text style={listItem}>
                      <strong>2. Admin review:</strong> Ryse will review the advance for final approval
                    </Text>
                    <Text style={listItem}>
                      <strong>3. Disbursement:</strong> Once approved, funds will be disbursed within 2-3 business days
                    </Text>
                  </>
                )}
                {responseType === 'countered' && (
                  <>
                    <Text style={listItem}>
                      <strong>1. Review counter offer:</strong> The owner has proposed different terms
                    </Text>
                    <Text style={listItem}>
                      <strong>2. Accept or modify:</strong> You can accept the counter offer or submit a new proposal
                    </Text>
                    <Text style={listItem}>
                      <strong>3. Admin approval:</strong> Once accepted, Ryse will review for final approval
                    </Text>
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* CTA Button */}
        <div dangerouslySetInnerHTML={{ __html: `
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 32px 0;">
            <tr>
              <td>
                <table border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td bgcolor="#001F7A" style="background-color: #001F7A !important; border-radius: 6px;">
                      <a href="${reviewLink}" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; text-decoration: none; color: #ffffff; font-family: 'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                        Review ${responseType === 'accepted' ? 'Accepted' : responseType === 'countered' ? 'Counter' : ''} Offer
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        ` }} />

        <Text style={signature}>
          Best regards,<br />
          The Ryse Team
        </Text>
      </Section>

      <EmailFooter isPMBranded={false} />
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
AdvanceOwnerResponseEmail.PreviewProps = {
  recipientName: 'Sarah Johnson',
  ownerName: 'John Smith',
  ownerEmail: 'john.smith@example.com',
  pmCompanyName: 'Premier Property Management',
  responseType: 'countered',
  originalAmount: 45000,
  counterAmount: 40000,
  counterTermMonths: 6,
  originalTermMonths: 8,
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
  reviewLink: 'https://ryse-demo.vercel.app/advances/review/abc123',
} as AdvanceOwnerResponseEmailProps;

export default AdvanceOwnerResponseEmail;