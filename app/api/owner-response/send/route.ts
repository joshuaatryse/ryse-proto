import { NextRequest, NextResponse } from 'next/server';
import { sendAdvanceOwnerResponseEmail } from '@/lib/resend';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      to,
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
    } = body;

    // Validate required fields
    const missingFields = [];
    if (!to) missingFields.push('to');
    if (!recipientName) missingFields.push('recipientName');
    if (!ownerName) missingFields.push('ownerName');
    if (!ownerEmail) missingFields.push('ownerEmail');
    if (!pmCompanyName) missingFields.push('pmCompanyName');
    if (!responseType) missingFields.push('responseType');
    if (originalAmount === undefined || originalAmount === null) missingFields.push('originalAmount');
    if (originalTermMonths === undefined || originalTermMonths === null) missingFields.push('originalTermMonths');
    if (!properties || !Array.isArray(properties)) missingFields.push('properties');
    if (!reviewLink) missingFields.push('reviewLink');

    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      console.error('Received body:', body);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Send the owner response email
    const result = await sendAdvanceOwnerResponseEmail({
      to,
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
    });

    if (result.success) {
      return NextResponse.json(
        { success: true, message: 'Owner response email sent successfully' },
        { status: 200 }
      );
    } else {
      console.error('Failed to send owner response email:', result.error);
      return NextResponse.json(
        { error: 'Failed to send owner response email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in owner response API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}