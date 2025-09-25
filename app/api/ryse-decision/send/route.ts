import { NextRequest, NextResponse } from 'next/server';
import { sendAdvanceRyseDecisionEmail } from '@/lib/resend';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      to,
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
    } = body;

    // Validate required fields
    const missingFields = [];
    if (!to) missingFields.push('to');
    if (!recipientName) missingFields.push('recipientName');
    if (!recipientType) missingFields.push('recipientType');
    if (!decision) missingFields.push('decision');
    if (!ownerName) missingFields.push('ownerName');
    if (!pmCompanyName) missingFields.push('pmCompanyName');
    if (amount === undefined || amount === null) missingFields.push('amount');
    if (termMonths === undefined || termMonths === null) missingFields.push('termMonths');
    if (!properties || !Array.isArray(properties)) missingFields.push('properties');
    if (!portalLink) missingFields.push('portalLink');

    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      console.error('Received body:', body);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Send the Ryse decision email
    const result = await sendAdvanceRyseDecisionEmail({
      to,
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
    });

    if (result.success) {
      return NextResponse.json(
        { success: true, message: 'Ryse decision email sent successfully' },
        { status: 200 }
      );
    } else {
      console.error('Failed to send Ryse decision email:', result.error);
      return NextResponse.json(
        { error: 'Failed to send Ryse decision email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in Ryse decision API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}