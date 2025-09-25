import { NextRequest, NextResponse } from 'next/server';
import { sendAdvanceRequestEmail } from '@/lib/resend';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      to,
      ownerName,
      pmCompanyName,
      pmName,
      properties,
      requestedAmount,
      termMonths,
      monthlyPayment,
      token,
    } = body;

    // Validate required fields
    if (!to || !ownerName || !pmCompanyName || !pmName || !properties || !requestedAmount || !termMonths || !token) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Construct the invitation link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://ryse.com');
    const invitationLink = `${baseUrl}/owner/advance-invite?token=${token}`;

    // Send the advance request email
    const result = await sendAdvanceRequestEmail({
      to,
      ownerName,
      pmCompanyName,
      pmName,
      properties,
      requestedAmount,
      termMonths,
      monthlyPayment,
      invitationLink,
    });

    if (result.success) {
      return NextResponse.json(
        { success: true, message: 'Advance request email sent successfully' },
        { status: 200 }
      );
    } else {
      console.error('Failed to send advance request email:', result.error);
      return NextResponse.json(
        { error: 'Failed to send advance request email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in advance request API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}