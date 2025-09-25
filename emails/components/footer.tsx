import * as React from 'react';
import { Section, Text, Link, Hr, Img } from '@react-email/components';

export const EmailFooter: React.FC = () => {
  return (
    <Section style={footer}>
      <Hr style={divider} />

      <Text style={footerText}>
        © 2024 Ryse. All rights reserved.
      </Text>

      <Text style={footerLinks}>
        <Link href="https://ryse.com" style={link}>
          Visit our website
        </Link>
        {' • '}
        <Link href="https://ryse.com/privacy" style={link}>
          Privacy Policy
        </Link>
        {' • '}
        <Link href="https://ryse.com/terms" style={link}>
          Terms of Service
        </Link>
      </Text>

      <Text style={footerAddress}>
        Ryse, Inc.<br />
        123 Main Street, Suite 100<br />
        San Francisco, CA 94105
      </Text>

      <Text style={footerNote}>
        This email was sent to you because you were invited to join Ryse.
        If you believe this was sent in error, please ignore this email.
      </Text>
    </Section>
  );
};

const footer = {
  padding: '24px 20px',
  textAlign: 'center' as const,
};

const divider = {
  border: 'none',
  borderTop: '1px solid #EBEBEB',
  margin: '0 0 24px 0',
};

const footerLogo = {
  margin: '0 auto 16px auto',
  display: 'block' as const,
};

const footerText = {
  color: '#717171',
  fontSize: '14px',
  textAlign: 'center' as const,
  margin: '0 0 12px 0',
};

const footerLinks = {
  color: '#717171',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '0 0 12px 0',
};

const link = {
  color: '#00269F',
  textDecoration: 'underline',
};

const footerAddress = {
  color: '#969696',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '12px 0',
  lineHeight: '18px',
};

const footerNote = {
  color: '#969696',
  fontSize: '11px',
  textAlign: 'center' as const,
  margin: '12px 0 0 0',
  lineHeight: '16px',
  fontStyle: 'italic',
};