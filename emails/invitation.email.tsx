import * as React from 'react';
import { Text, Section, Heading, Hr } from '@react-email/components';
import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
  EmailButton,
  InfoBox,
} from './components';

interface InvitationEmailProps {
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  invitationLink: string;
  adminName?: string;
  expiresInDays?: number;
}

export const InvitationEmail: React.FC<InvitationEmailProps> = ({
  email,
  firstName,
  lastName,
  companyName,
  invitationLink,
  adminName = 'The Ryse Team',
  expiresInDays = 7,
}) => {
  const prefilledInfo = [
    { label: 'Name', value: `${firstName} ${lastName}` },
    { label: 'Email', value: email },
    { label: 'Company', value: companyName },
  ];

  return (
    <EmailLayout preview={`You're invited to join Ryse as a Property Manager`}>
      <EmailHeader />

      <Section style={{ padding: '40px 20px' }}>
        <Heading style={heading}>
          Welcome to Ryse, {firstName}!
        </Heading>

        <Text style={paragraph}>
          You've been invited to join Ryse as a Property Manager for <strong>{companyName}</strong>.
          We're excited to help you streamline your property management and offer advance rent options to your property owners.
        </Text>

        <Text style={paragraph}>
          To get started, we've prefilled your registration with the following information:
        </Text>

        <InfoBox
          title="Your Information"
          items={prefilledInfo}
        />

        <Section style={{ margin: '32px 0' }}>
          <EmailButton href={invitationLink}>
            Complete Registration
          </EmailButton>
        </Section>

        <Hr style={divider} />

        <Text style={subheading}>
          What happens next?
        </Text>

        <Text style={listItem}>
          <strong>1. Complete your profile:</strong> Click the button above to finish setting up your account
        </Text>

        <Text style={listItem}>
          <strong>2. Add your properties:</strong> Import or manually add the properties you manage
        </Text>

        <Text style={listItem}>
          <strong>3. Offer advance rent:</strong> Start offering your property owners the option to receive advance rent payments
        </Text>

        <Hr style={divider} />

        <Text style={note}>
          This invitation link will expire in <strong>{expiresInDays} days</strong>.
          If you have any questions, please don't hesitate to reach out to our support team at support@ryse.com.
        </Text>

        <Text style={signature}>
          Best regards,<br />
          {adminName}
        </Text>
      </Section>

      <EmailFooter />
    </EmailLayout>
  );
};

const heading = {
  fontSize: '24px',
  fontWeight: '600',
  color: '#1a1a1a',
  textAlign: 'center' as const,
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

const note = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#718096',
  margin: '24px 0',
  padding: '16px',
  backgroundColor: '#f7fafc',
  borderRadius: '8px',
};

const signature = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#667085',
  margin: '24px 0 0',
};

// Preview props for development
// @ts-ignore - PreviewProps for React Email Dev Server
InvitationEmail.PreviewProps = {
  email: 'sarah@pmcompany.com',
  firstName: 'Sarah',
  lastName: 'Johnson',
  companyName: 'Premier Property Management',
  invitationLink: 'https://ryse.com/onboarding?token=abc123',
  adminName: 'Sean Mitchell',
  expiresInDays: 7,
} as InvitationEmailProps;

export default InvitationEmail;