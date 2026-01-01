import { NextResponse } from 'next/server';

export async function GET() {
    try {
        return NextResponse.json({
            accountSid: !!process.env.TWILIO_ACCOUNT_SID,
            authToken: !!process.env.TWILIO_AUTH_TOKEN,
            phoneNumber: !!process.env.TWILIO_PHONE_NUMBER
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
    }
}
