import twilio from 'twilio';

// Twilio credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client
// We use a getter to avoid initialization errors if environment variables are missing during build
let client: twilio.Twilio | null = null;

function getTwilioClient() {
    if (!accountSid || !authToken) {
        console.warn('⚠️ Twilio credentials missing from environment variables');
        return null;
    }

    if (!client) {
        client = twilio(accountSid, authToken);
    }
    return client;
}

/**
 * Interface for SMS data
 */
export interface SMSData {
    to: string;
    body: string;
}

/**
 * Sends an SMS using Twilio
 * @param data SMS content and recipient
 * @returns Promise<boolean> success status
 */
export async function sendSMS(data: SMSData): Promise<boolean> {
    const twilioClient = getTwilioClient();

    if (!twilioClient || !twilioPhoneNumber) {
        console.error('❌ Twilio is not configured. Please check your .env.local file.');
        return false;
    }

    try {
        // Format the phone number (E.164 format)
        let formattedTo = data.to.trim().replace(/\s+/g, '');

        // If it's 10 digits, assume India (+91)
        if (formattedTo.length === 10 && !formattedTo.startsWith('+')) {
            formattedTo = `+91${formattedTo}`;
        }
        // If it starts with 91 but no +, add +
        else if (formattedTo.length === 12 && formattedTo.startsWith('91')) {
            formattedTo = `+${formattedTo}`;
        }
        // Ensure it has a +
        else if (!formattedTo.startsWith('+')) {
            formattedTo = `+${formattedTo}`;
        }

        console.log(`📱 Attempting to send SMS to ${formattedTo}...`);

        const message = await twilioClient.messages.create({
            body: data.body,
            from: twilioPhoneNumber,
            to: formattedTo
        });

        if (message.sid) {
            console.log(`✅ SMS sent successfully! SID: ${message.sid}`);
            return true;
        }

        return false;
    } catch (error: any) {
        console.error('❌ Twilio SMS failed:', error.message || error);
        return false;
    }
}

/**
 * Function to send emergency SMS notifications to multiple recipients
 */
export async function sendEmergencySMS(phoneNumbers: string[], message: string): Promise<{ success: number; failed: number }> {
    const results = { success: 0, failed: 0 };

    const smsPromises = phoneNumbers.map(async (phone) => {
        const success = await sendSMS({
            to: phone,
            body: message
        });

        if (success) {
            results.success++;
        } else {
            results.failed++;
        }
    });

    await Promise.all(smsPromises);
    return results;
}
