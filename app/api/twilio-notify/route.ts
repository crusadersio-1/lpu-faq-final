import { NextResponse } from 'next/server';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const adminPhoneNumber = process.env.ADMIN_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!accountSid || !authToken || !twilioPhoneNumber || !adminPhoneNumber) {
      throw new Error('Missing Twilio configuration');
    }

    const twilioMessage = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: adminPhoneNumber
    });

    return NextResponse.json({ success: true, message: twilioMessage });
  } catch (error) {
    console.error('Error sending Twilio notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
} 