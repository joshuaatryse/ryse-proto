import * as React from 'react';
import { Section, Text, Row, Column } from '@react-email/components';

interface InfoItem {
  label: string;
  value: string;
}

interface InfoBoxProps {
  title: string;
  items: InfoItem[];
}

export const InfoBox: React.FC<InfoBoxProps> = ({ title, items }) => {
  return (
    <Section style={infoBox}>
      <Text style={infoTitle}>{title}</Text>
      {items.map((item, index) => (
        <Row key={index} style={infoRow}>
          <Column style={infoLabel}>{item.label}:</Column>
          <Column style={infoValue}>{item.value}</Column>
        </Row>
      ))}
    </Section>
  );
};

const infoBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
};

const infoTitle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#344054',
  margin: '0 0 12px 0',
};

const infoRow = {
  margin: '8px 0',
};

const infoLabel = {
  fontSize: '14px',
  color: '#667085',
  fontWeight: '500',
  width: '40%',
};

const infoValue = {
  fontSize: '14px',
  color: '#344054',
  width: '60%',
};