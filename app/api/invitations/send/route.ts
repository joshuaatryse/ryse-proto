import { NextRequest, NextResponse } from 'next/server';
import { sendInvitationEmail } from '@/lib/resend';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, firstName, lastName, companyName, token, adminName } = body;

    if (!email || !firstName || !lastName || !companyName || !token) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Construct the invitation link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://ryse-demo.vercel.app');
    const invitationLink = `${baseUrl}/onboarding?token=${token}`;

    // Send the invitation email
    const result = await sendInvitationEmail({
      to: email,
      firstName,
      lastName,
      companyName,
      invitationLink,
      adminName,
    });

    if (result.success) {
      return NextResponse.json(
        { success: true, message: 'Invitation email sent successfully' },
        { status: 200 }
      );
    } else {
      console.error('Failed to send invitation email:', result.error);
      return NextResponse.json(
        { error: 'Failed to send invitation email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in invitation API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}