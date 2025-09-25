import * as React from 'react';
import { Section, Img, Text } from '@react-email/components';

export const EmailHeader: React.FC = () => {
  return (
    <Section style={header}>
      <Img
        src="https://exuberant-cheetah-904.convex.cloud/api/storage/f81748b5-030b-4bb2-a472-0d13122ccd28"
        alt="Ryse"
        width="200"
        height="auto"
        style={logoImage}
      />
      <Text style={tagline}>Advance Rent Management Platform</Text>
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

const tagline = {
  color: '#717171',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '12px 0 0 0',
  fontWeight: '500',
  letterSpacing: '0.02em',
};