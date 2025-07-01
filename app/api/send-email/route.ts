import { NextResponse } from 'next/server';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = twilio(accountSid, authToken);

export async function POST(request: Request) {
  try {
    const { to, subject, content } = await request.json();

    // Send email using Twilio
    const message = await client.messages.create({
      body: content,
      to: to,  // The recipient's phone number
      from: process.env.TWILIO_PHONE_NUMBER || '+1234567890', // Your Twilio phone number
    });

    return NextResponse.json({ 
      success: true, 
      messageId: message.sid 
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send email' 
    }, { 
      status: 500 
    });
  }
} 