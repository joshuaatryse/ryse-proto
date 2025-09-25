import * as React from 'react';
import { Section, Img, Text } from '@react-email/components';

interface EmailHeaderProps {
  logoUrl?: string;
  altText?: string;
  taglineText?: string;
  isPMBranded?: boolean;
}

export const EmailHeader: React.FC<EmailHeaderProps> = ({
  logoUrl,
  altText,
  taglineText,
  isPMBranded = false
}) => {
  // Use Nomad branding for PM to Owner emails
  const logo = isPMBranded
    ? 'https://cdn.prod.website-files.com/67d1f50ac0b3a99a08b99fda/68d56bb57515c76364fefda5_nomad.png' // Will need to be hosted
    : (logoUrl || "https://exuberant-cheetah-904.convex.cloud/api/storage/f81748b5-030b-4bb2-a472-0d13122ccd28");

  const alt = isPMBranded ? 'Nomad' : (altText || 'Ryse');
  const tagline = isPMBranded ? 'Manage Your Property Like a Pro' : (taglineText || 'Advance Rent Management Platform');

  return (
    <Section style={header}>
      <Img
        src={logo}
        alt={alt}
        width={isPMBranded ? "150" : "200"}
        height="auto"
        style={logoImage}
      />
      <Text style={{...taglineStyle, color: isPMBranded ? '#027468' : '#717171'}}>{tagline}</Text>
    </Section>
  );
};

const header = {
  padding: '24px 0',
  textAlign: 'center' as const,
  borderBottom: '1px solid #EBEBEB',
};

const logoImage = {
  margin: '0 auto',
  display: 'block' as const,
};

const taglineStyle = {
  color: '#717171',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '12px 0 0 0',
  fontWeight: '500',
  letterSpacing: '0.02em',
};