import { NextRequest, NextResponse } from 'next/server';
import { sendSMS, SMSData } from '@/lib/twilio-service';

export async function POST(request: NextRequest) {
    try {
        const body: SMSData = await request.json();

        // Validate required fields
        if (!body.to || !body.body) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: to and body are required.' },
                { status: 400 }
            );
        }

        // Attempt to send SMS
        const success = await sendSMS(body);

        if (success) {
            return NextResponse.json({
                success: true,
                message: 'SMS sent successfully'
            });
        } else {
            return NextResponse.json(
                { success: false, error: 'Failed to send SMS via Twilio. Check server logs for details.' },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error('❌ API Route Twilio failed:', error.message || error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
