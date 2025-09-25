import * as React from 'react';
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
} from '@react-email/components';

interface EmailLayoutProps {
  preview: string;
  children: React.ReactNode;
}

export const EmailLayout: React.FC<EmailLayoutProps> = ({
  preview,
  children,
}) => {
  return (
    <Html>
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <style>{`
          @media (prefers-color-scheme: dark) {
            body {
              background-color: #f6f9fc !important;
            }
            .email-container {
              background-color: #ffffff !important;
              color: #1a1a1a !important;
            }
            .dark-safe {
              background-color: #ffffff !important;
              color: #1a1a1a !important;
            }
          }
        `}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container} className="email-container dark-safe">
          {children}
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 20px',
  marginBottom: '64px',
  borderRadius: '16px',
  border: '1px solid #e2e8f0',
  maxWidth: '37.5em',
};