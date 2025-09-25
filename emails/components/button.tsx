import * as React from 'react';
import { Button } from '@react-email/components';

interface EmailButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export const EmailButton: React.FC<EmailButtonProps> = ({
  href,
  children,
  variant = 'primary',
}) => {
  return (
    <Button
      href={href}
      style={variant === 'primary' ? primaryButton : secondaryButton}
    >
      {children}
    </Button>
  );
};

const baseButton = {
  borderRadius: '12px',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '14px 28px',
  width: '100%',
  maxWidth: '260px',
  margin: '0 auto',
  transition: 'all 0.2s ease',
};

const primaryButton = {
  ...baseButton,
  background: 'linear-gradient(291.85deg, #00269F 2.29%, #070E24 99.99%)',
  color: '#ffffff',
  boxShadow: '0 4px 12px rgba(0, 38, 159, 0.25)',
};

const secondaryButton = {
  ...baseButton,
  backgroundColor: '#ffffff',
  color: '#00269F',
  border: '2px solid #00269F',
};