import { NextRequest, NextResponse } from 'next/server';
import { sendEmergencySMS } from '@/lib/twilio-service';

export async function POST(request: NextRequest) {
    try {
        const { phoneNumbers, message } = await request.json();

        if (!phoneNumbers || !Array.isArray(phoneNumbers) || !message) {
            return NextResponse.json(
                { success: false, error: 'Invalid request data. phoneNumbers (array) and message (string) are required.' },
                { status: 400 }
            );
        }

        console.log(`📡 Starting SMS broadcast to ${phoneNumbers.length} recipients...`);

        // Using the utility function from twilio-service
        const results = await sendEmergencySMS(phoneNumbers, message);

        return NextResponse.json({
            success: true,
            message: 'Broadcast completed',
            results
        });
    } catch (error: any) {
        console.error('❌ SMS Broadcast failed:', error.message || error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
